"""
models.py — MindNote AI
========================
SQLAlchemy ORM models for Conversations and Messages.

Schema:
  Conversation (1) ──< Message (many)
  Deleting a Conversation cascades to all its Messages.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


# ── Conversation ──────────────────────────────────────────────────────────────
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    title = Column(
        String(255),
        nullable=False,
        default="New Chat",
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship: accessing conv.messages loads all related Message rows.
    # cascade="all, delete-orphan" means deleting a Conversation automatically
    # deletes all its Messages (no orphaned rows).
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.timestamp",
        lazy="selectin",  # async-safe: loads messages in a second SELECT
    )

    def __repr__(self) -> str:
        return f"<Conversation id={self.id} title={self.title!r}>"


# ── Message ────────────────────────────────────────────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,  # speeds up "get all messages for conversation X"
    )
    role = Column(
        String(20),
        nullable=False,
    )  # "user" | "assistant"
    content = Column(
        Text,
        nullable=False,
    )
    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,  # speeds up time-sorted queries
    )

    # Back-reference to parent Conversation
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message id={self.id} role={self.role!r} conv={self.conversation_id}>"


# ── Composite index for common query pattern ───────────────────────────────────
# "Get all messages for conv X ordered by time" — most common read pattern
Index(
    "ix_messages_conv_time",
    Message.conversation_id,
    Message.timestamp,
)
