"""
models.py — MindNote AI
========================
Plain Python dataclasses representing database rows.
Used instead of SQLAlchemy ORM (which requires greenlet, broken on Python 3.14).
These are simple data containers — all SQL is in crud.py.
"""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Conversation:
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


@dataclass
class Message:
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    timestamp: datetime
