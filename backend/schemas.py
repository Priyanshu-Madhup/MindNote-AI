"""
schemas.py — MindNote AI
=========================
Pydantic v2 request/response schemas for the Chat History API.
These validate incoming JSON and shape outgoing JSON responses.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


# ══════════════════════════════════════════════════════════════════════════════
# Conversation Schemas
# ══════════════════════════════════════════════════════════════════════════════

class ConversationCreate(BaseModel):
    """Body for POST /conversation."""
    title: Optional[str] = "New Chat"


class ConversationRename(BaseModel):
    """Body for PUT /conversation/{id}."""
    title: str


class ConversationOut(BaseModel):
    """Single conversation row returned to the frontend."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


# ══════════════════════════════════════════════════════════════════════════════
# Message Schemas
# ══════════════════════════════════════════════════════════════════════════════

class MessageOut(BaseModel):
    """Single message row returned to the frontend."""
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    timestamp: datetime


# ══════════════════════════════════════════════════════════════════════════════
# Combined Response Schemas
# ══════════════════════════════════════════════════════════════════════════════

class ConversationWithMessages(BaseModel):
    """Full conversation + all messages. Used by GET /conversation/{id}."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut]


class SaveMessageRequest(BaseModel):
    """
    Body for POST /message.
    Saves BOTH user message and AI response in one call.
    """
    conversation_id: UUID
    user_content: str
    assistant_content: str


class SaveMessageResponse(BaseModel):
    """Response after saving both messages."""
    user_message: MessageOut
    assistant_message: MessageOut
    conversation_title: str
