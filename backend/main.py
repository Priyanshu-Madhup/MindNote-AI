"""
MindNote AI – FastAPI Chat Backend  (v2.0 — with Chat History)
===============================================================
Uses Groq's OpenAI-compatible API with streaming so the frontend
can receive tokens as they arrive (typewriter effect).

v2 additions:
  - Neon PostgreSQL via async SQLAlchemy
  - Chat History endpoints (see routes.py)
  - Tables auto-created at startup
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from openai import OpenAI
import json

# ── Config (env vars) ─────────────────────────────────────────────────────────
from config import GROQ_API_KEY, APP_TITLE, APP_VERSION

# ── Database (startup table creation) ────────────────────────────────────────
from database import create_all_tables

# ── Chat History routes ───────────────────────────────────────────────────────
from routes import router as history_router


# ── Lifespan: runs once at startup and shutdown ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables if they don't exist
    await create_all_tables()
    print("✅ Database tables ready")
    yield
    # Shutdown: nothing to clean up (connections managed by engine)


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local dev
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        # Production — Vercel
        "https://mindnote-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Chat History router ─────────────────────────────────────────────────
app.include_router(history_router)


# ── Groq client (OpenAI-compatible) ──────────────────────────────────────────
client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

MODEL = "openai/gpt-oss-20b"   # fast, capable Groq model

SYSTEM_PROMPT = (
    "You are MindNote AI, an intelligent study and knowledge assistant. "
    "You help users understand documents, generate insights, create study materials, "
    "and answer questions across their notebooks. Be concise, helpful, and insightful."
)


# ── Schemas (for existing /chat/stream endpoint) ──────────────────────────────
class Message(BaseModel):
    role: str        # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]


# ── Existing Routes (unchanged) ───────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL, "version": APP_VERSION}


@app.post("/chat/stream")
async def chat_stream(body: ChatRequest):
    """
    Returns a Server-Sent Events (SSE) stream of tokens.
    The frontend reads each 'data: ...' line and appends characters
    one-by-one for the typewriter effect.

    NOTE: This endpoint is UNCHANGED from v1.
    The frontend calls POST /message separately to persist the exchange.
    """
    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
    conversation += [m.model_dump() for m in body.messages]

    def generate():
        try:
            stream = client.chat.completions.create(
                model=MODEL,
                messages=conversation,
                stream=True,
                temperature=0.7,
                max_tokens=2048,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    # SSE format: each line is "data: <json>\n\n"
                    payload = json.dumps({"token": delta.content})
                    yield f"data: {payload}\n\n"

            # Signal stream end
            yield "data: [DONE]\n\n"

        except Exception as e:
            err = json.dumps({"error": str(e)})
            yield f"data: {err}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx buffering if behind proxy
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
