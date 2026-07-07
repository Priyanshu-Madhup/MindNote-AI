"""
schemas.py — MindNote AI
=========================
Pydantic v2 request/response schemas for the Chat History API.

These are the shapes of data that:
  - Come IN from the frontend (Request bodies)
  - Go OUT to the frontend (Response bodies)

Kept separate from ORM models (models.py) following clean architecture.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ══════════════════════════════════════════════════════════════════════════════
# Conversation Schemas
# ══════════════════════════════════════════════════════════════════════════════

class ConversationCreate(BaseModel):
    """Body for POST /conversation (title is optional — auto-generated later)."""
    title: Optional[str] = "New Chat"


class ConversationRename(BaseModel):
    """Body for PUT /conversation/{id}."""
    title: str


class ConversationOut(BaseModel):
    """Single conversation row returned to the frontend (no messages)."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    # orm_mode (Pydantic v2: from_attributes) lets us convert
    # SQLAlchemy model instances directly to this schema.
    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════════════════════
# Message Schemas
# ══════════════════════════════════════════════════════════════════════════════

class MessageCreate(BaseModel):
    """Body for POST /message."""
    conversation_id: UUID
    role: str        # "user" | "assistant"
    content: str


class MessageOut(BaseModel):
    """Single message row returned to the frontend."""
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════════════════════
# Combined Response Schemas
# ══════════════════════════════════════════════════════════════════════════════

class ConversationWithMessages(BaseModel):
    """Full conversation + all its messages. Used by GET /conversation/{id}."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut]

    model_config = ConfigDict(from_attributes=True)


class SaveMessageRequest(BaseModel):
    """
    Body for POST /message.
    Saves BOTH the user message and the AI response in one call
    to keep the frontend simple and reduce round-trips.
    """
    conversation_id: UUID
    user_content: str       # The user's message text
    assistant_content: str  # The complete AI response text


class SaveMessageResponse(BaseModel):
    """Response after saving both messages."""
    user_message: MessageOut
    assistant_message: MessageOut
    conversation_title: str  # Updated title (may have been auto-generated)
