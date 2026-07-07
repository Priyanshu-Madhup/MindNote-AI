"""
routes.py — MindNote AI
========================
All Chat History API routes using pure asyncpg.

Endpoints:
  POST   /conversation          Create a new conversation
  GET    /conversations         Get all conversations (sorted by latest)
  GET    /conversation/{id}     Get one conversation with all its messages
  POST   /message               Save user + AI messages (one round-trip)
  DELETE /conversation/{id}     Delete conversation + all messages
  PUT    /conversation/{id}     Rename conversation title
"""

from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

import crud
from database import get_db
from models import Conversation, Message
from schemas import (
    ConversationCreate,
    ConversationOut,
    ConversationRename,
    ConversationWithMessages,
    MessageOut,
    SaveMessageRequest,
    SaveMessageResponse,
)

router = APIRouter(tags=["Chat History"])


# ── Helper: convert dataclass → Pydantic schema ───────────────────────────────
def _conv_out(c: Conversation) -> ConversationOut:
    return ConversationOut(
        id=c.id,
        title=c.title,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )

def _msg_out(m: Message) -> MessageOut:
    return MessageOut(
        id=m.id,
        conversation_id=m.conversation_id,
        role=m.role,
        content=m.content,
        timestamp=m.timestamp,
    )


# ── POST /conversation ────────────────────────────────────────────────────────
@router.post(
    "/conversation",
    response_model=ConversationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
)
async def create_conversation(
    body: ConversationCreate,
    conn: asyncpg.Connection = Depends(get_db),
):
    try:
        conv = await crud.create_conversation(conn, title=body.title or "New Chat")
        return _conv_out(conv)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {e}")


# ── GET /conversations ────────────────────────────────────────────────────────
@router.get(
    "/conversations",
    response_model=list[ConversationOut],
    summary="Get all conversations sorted by latest",
)
async def get_conversations(conn: asyncpg.Connection = Depends(get_db)):
    try:
        convs = await crud.get_all_conversations(conn)
        return [_conv_out(c) for c in convs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {e}")


# ── GET /conversation/{id} ────────────────────────────────────────────────────
@router.get(
    "/conversation/{conv_id}",
    response_model=ConversationWithMessages,
    summary="Get one conversation with all its messages",
)
async def get_conversation(
    conv_id: UUID,
    conn: asyncpg.Connection = Depends(get_db),
):
    try:
        conv = await crud.get_conversation_by_id(conn, conv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    if not conv:
        raise HTTPException(status_code=404, detail=f"Conversation {conv_id} not found")

    messages = await crud.get_messages_for_conversation(conn, conv_id)

    return ConversationWithMessages(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[_msg_out(m) for m in messages],
    )


# ── POST /message ─────────────────────────────────────────────────────────────
@router.post(
    "/message",
    response_model=SaveMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save both user message and AI response",
)
async def save_message(
    body: SaveMessageRequest,
    conn: asyncpg.Connection = Depends(get_db),
):
    try:
        msg_count   = await crud.get_message_count(conn, body.conversation_id)
        is_first    = msg_count == 0

        user_msg, asst_msg, title = await crud.save_message_pair(
            conn=conn,
            conv_id=body.conversation_id,
            user_content=body.user_content,
            assistant_content=body.assistant_content,
            is_first_message=is_first,
        )

        return SaveMessageResponse(
            user_message=_msg_out(user_msg),
            assistant_message=_msg_out(asst_msg),
            conversation_title=title,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save messages: {e}")


# ── DELETE /conversation/{id} ──────────────────────────────────────────────────
@router.delete(
    "/conversation/{conv_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation and all its messages",
)
async def delete_conversation(
    conv_id: UUID,
    conn: asyncpg.Connection = Depends(get_db),
):
    try:
        deleted = await crud.delete_conversation(conn, conv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete: {e}")

    if not deleted:
        raise HTTPException(status_code=404, detail=f"Conversation {conv_id} not found")


# ── PUT /conversation/{id} ─────────────────────────────────────────────────────
@router.put(
    "/conversation/{conv_id}",
    response_model=ConversationOut,
    summary="Rename a conversation",
)
async def rename_conversation(
    conv_id: UUID,
    body: ConversationRename,
    conn: asyncpg.Connection = Depends(get_db),
):
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="Title cannot be empty")

    try:
        conv = await crud.rename_conversation(conn, conv_id, body.title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rename: {e}")

    if not conv:
        raise HTTPException(status_code=404, detail=f"Conversation {conv_id} not found")

    return _conv_out(conv)
