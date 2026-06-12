"""
MindNote AI – FastAPI Chat Backend
Uses Groq's OpenAI-compatible API with streaming so the frontend
can receive tokens as they arrive (typewriter effect).
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

# ── Load env vars from backend/.env ──────────────────────────────────────────
load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found – add it to backend/.env")

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

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="MindNote AI Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str        # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/chat/stream")
async def chat_stream(body: ChatRequest):
    """
    Returns a Server-Sent Events (SSE) stream of tokens.
    The frontend reads each 'data: ...' line and appends characters
    one-by-one for the typewriter effect.
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
