"""
MindNote AI – FastAPI Chat Backend  v2.0
Uses Groq's OpenAI-compatible API with streaming (typewriter effect).
Chat history is persisted to Appwrite Database (collections: chat_sessions, messages).

Appwrite replaces raw Postgres — no connection pooling or DDL needed.
Collections must be created in the Appwrite Console (see README section 13).
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
from appwrite.id import ID
import os
import json

# ── Load env vars from backend/.env ──────────────────────────────────────────
load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found – add it to backend/.env")

APPWRITE_ENDPOINT  = os.environ.get("APPWRITE_ENDPOINT",  "https://cloud.appwrite.io/v1")
APPWRITE_PROJECT   = os.environ.get("APPWRITE_PROJECT")
APPWRITE_API_KEY   = os.environ.get("APPWRITE_API_KEY")
APPWRITE_DB_ID     = os.environ.get("APPWRITE_DB_ID",     "6a4d48340002b251cad9")
SESSIONS_COL       = os.environ.get("APPWRITE_SESSIONS_COL", "chat_sessions")
MESSAGES_COL       = os.environ.get("APPWRITE_MESSAGES_COL", "messages")

if not APPWRITE_PROJECT or not APPWRITE_API_KEY:
    raise RuntimeError(
        "APPWRITE_PROJECT and APPWRITE_API_KEY are required – add them to backend/.env"
    )

# ── Appwrite client (server-side SDK) ────────────────────────────────────────
appwrite_client = (
    Client()
    .set_endpoint(APPWRITE_ENDPOINT)
    .set_project(APPWRITE_PROJECT)
    .set_key(APPWRITE_API_KEY)
)
db = Databases(appwrite_client)

# ── Groq client (OpenAI-compatible) ──────────────────────────────────────────
groq = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

MODEL = "openai/gpt-oss-20b"

SYSTEM_PROMPT = (
    "You are MindNote AI, an intelligent study and knowledge assistant. "
    "You help users understand documents, generate insights, create study materials, "
    "and answer questions across their notebooks. Be concise, helpful, and insightful."
)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="MindNote AI Chat API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://mindnote-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class Message(BaseModel):
    role:    str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages:   List[Message]
    user_id:    str             # Clerk userId e.g. "user_2abc..."
    session_id: Optional[str] = None   # Appwrite document ID; None → new session

class NewSessionRequest(BaseModel):
    user_id: str


# ── DB helpers ────────────────────────────────────────────────────────────────
def _save_messages_bg(session_id: str, user_content: str, assembled_tokens: list, is_new_session: bool):
    """
    Background task: save user + assistant messages; set session title on first save.
    Runs after the SSE stream completes so it adds zero latency to the client.
    assembled_tokens is passed by reference so it is fully populated by the time this runs.
    """
    assistant_content = "".join(assembled_tokens)
    try:
        # Save user message
        db.create_document(
            database_id=APPWRITE_DB_ID,
            collection_id=MESSAGES_COL,
            document_id=ID.unique(),
            data={
                "session_id": session_id,
                "role":       "user",
                "content":    user_content,
            },
        )
        # Save assistant message
        if assistant_content:
            db.create_document(
                database_id=APPWRITE_DB_ID,
                collection_id=MESSAGES_COL,
                document_id=ID.unique(),
                data={
                    "session_id": session_id,
                    "role":       "assistant",
                    "content":    assistant_content,
                },
            )
        # Set session title from first user message
        if is_new_session:
            db.update_document(
                database_id=APPWRITE_DB_ID,
                collection_id=SESSIONS_COL,
                document_id=session_id,
                data={"title": user_content[:80]},
            )
    except Exception as e:
        print(f"⚠️  Failed to save messages to Appwrite: {e}")


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL, "db": "appwrite"}


@app.get("/history/{user_id}")
def get_history(user_id: str):
    """List all chat sessions for a user, newest first."""
    try:
        result = db.list_documents(
            database_id=APPWRITE_DB_ID,
            collection_id=SESSIONS_COL,
            queries=[
                Query.equal("user_id", user_id),
                Query.order_desc("$createdAt"),
                Query.limit(50),
            ],
        )
        return [
            {
                "session_id": doc.id,
                "title":      (doc.data or {}).get("title") or "Untitled Chat",
                "created_at": doc.createdat,
            }
            for doc in result.documents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/{user_id}/{session_id}")
def get_session_messages(user_id: str, session_id: str):
    """Return all messages in a session (ownership-checked)."""
    try:
        # Verify ownership
        session = db.get_document(
            database_id=APPWRITE_DB_ID,
            collection_id=SESSIONS_COL,
            document_id=session_id,
        )
        if (session.data or {}).get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        result = db.list_documents(
            database_id=APPWRITE_DB_ID,
            collection_id=MESSAGES_COL,
            queries=[
                Query.equal("session_id", session_id),
                Query.order_asc("$createdAt"),
                Query.limit(200),
            ],
        )
        return [
            {
                "role":       doc.data["role"],
                "content":    doc.data["content"],
                "created_at": doc.createdat,
            }
            for doc in result.documents
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/history/new-session")
def new_session(body: NewSessionRequest):
    """Create a blank chat session. Returns session_id."""
    try:
        doc = db.create_document(
            database_id=APPWRITE_DB_ID,
            collection_id=SESSIONS_COL,
            document_id=ID.unique(),
            data={"user_id": body.user_id, "title": None},
        )
        return {"session_id": doc.id, "created_at": doc.createdat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/history/{user_id}/{session_id}")
def delete_session(user_id: str, session_id: str):
    """Delete a session. Messages are deleted via Appwrite cascade (set up in Console)."""
    try:
        # Verify ownership first
        session = db.get_document(
            database_id=APPWRITE_DB_ID,
            collection_id=SESSIONS_COL,
            document_id=session_id,
        )
        if (session.data or {}).get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Delete all messages in this session first
        msgs = db.list_documents(
            database_id=APPWRITE_DB_ID,
            collection_id=MESSAGES_COL,
            queries=[Query.equal("session_id", session_id), Query.limit(200)],
        )
        for msg in msgs.documents:
            db.delete_document(
                database_id=APPWRITE_DB_ID,
                collection_id=MESSAGES_COL,
                document_id=msg.id,
            )

        # Delete the session itself
        db.delete_document(
            database_id=APPWRITE_DB_ID,
            collection_id=SESSIONS_COL,
            document_id=session_id,
        )
        return {"deleted": True, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(body: ChatRequest, background_tasks: BackgroundTasks):
    """
    SSE stream of tokens from Groq.
    Frame 0:  { session_id }  ← so frontend can track the session
    Frame 1+: { token }
    Final:    [DONE]

    After the response is fully streamed, a BackgroundTask saves messages to Appwrite.
    """
    # ── Ensure session exists ─────────────────────────────────────────────────
    is_new_session = body.session_id is None
    if is_new_session:
        try:
            doc = db.create_document(
                database_id=APPWRITE_DB_ID,
                collection_id=SESSIONS_COL,
                document_id=ID.unique(),
                data={"user_id": body.user_id, "title": None},
            )
            session_id = doc.id
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not create session: {e}")
    else:
        session_id = body.session_id

    user_content = body.messages[-1].content

    # Build conversation for Groq
    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
    conversation += [m.model_dump() for m in body.messages]

    # Collect assembled tokens for background save
    assembled: list[str] = []

    def generate():
        # Frame 0: send session_id to frontend
        yield f"data: {json.dumps({'session_id': session_id})}\n\n"

        try:
            stream = groq.chat.completions.create(
                model=MODEL,
                messages=conversation,
                stream=True,
                temperature=0.7,
                max_tokens=2048,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    assembled.append(delta.content)
                    yield f"data: {json.dumps({'token': delta.content})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    # Save messages after stream is fully sent (non-blocking).
    # Pass `assembled` list by reference — it will be fully populated once generate() finishes.
    background_tasks.add_task(
        _save_messages_bg,
        session_id,
        user_content,
        assembled,
        is_new_session,
    )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
        },
        background=background_tasks,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
