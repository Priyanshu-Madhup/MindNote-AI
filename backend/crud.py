"""
crud.py — MindNote AI
======================
All async database operations using pure asyncpg.
Every function takes an asyncpg Connection and returns dataclass instances.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

import asyncpg

from models import Conversation, Message


# ══════════════════════════════════════════════════════════════════════════════
# Helpers — convert asyncpg Record → dataclass
# ══════════════════════════════════════════════════════════════════════════════

def _row_to_conversation(row: asyncpg.Record) -> Conversation:
    return Conversation(
        id=row["id"],
        title=row["title"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )

def _row_to_message(row: asyncpg.Record) -> Message:
    return Message(
        id=row["id"],
        conversation_id=row["conversation_id"],
        role=row["role"],
        content=row["content"],
        timestamp=row["timestamp"],
    )


# ══════════════════════════════════════════════════════════════════════════════
# Title Generation
# ══════════════════════════════════════════════════════════════════════════════

_STRIP_PREFIXES = re.compile(
    r"^(explain|what\s+is|what\s+are|how\s+to|how\s+do\s+i|tell\s+me\s+about|"
    r"can\s+you|could\s+you|please|write\s+a|write\s+an|give\s+me|"
    r"describe|define|show\s+me|help\s+me\s+with|i\s+want\s+to\s+know\s+about)\s+",
    re.IGNORECASE,
)

def generate_title(first_user_message: str) -> str:
    """
    Generates a concise conversation title from the first user message.
    Examples:
      "Explain Binary Search"   → "Binary Search"
      "What is photosynthesis?" → "Photosynthesis"
    """
    text = first_user_message.strip().rstrip("?.!")
    text = _STRIP_PREFIXES.sub("", text, count=1).strip()
    text = text.title()
    if len(text) > 50:
        text = text[:50].rsplit(" ", 1)[0] + "…"
    return text or "New Chat"


# ══════════════════════════════════════════════════════════════════════════════
# Conversation CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def create_conversation(conn: asyncpg.Connection, title: str = "New Chat") -> Conversation:
    """Creates a new conversation and returns it."""
    row = await conn.fetchrow(
        """
        INSERT INTO conversations (title)
        VALUES ($1)
        RETURNING id, title, created_at, updated_at
        """,
        title,
    )
    return _row_to_conversation(row)


async def get_all_conversations(conn: asyncpg.Connection) -> List[Conversation]:
    """Returns all conversations sorted by most recently updated first."""
    rows = await conn.fetch(
        "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
    )
    return [_row_to_conversation(r) for r in rows]


async def get_conversation_by_id(conn: asyncpg.Connection, conv_id: UUID) -> Optional[Conversation]:
    """Returns a conversation or None if not found."""
    row = await conn.fetchrow(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = $1",
        conv_id,
    )
    return _row_to_conversation(row) if row else None


async def get_messages_for_conversation(conn: asyncpg.Connection, conv_id: UUID) -> List[Message]:
    """Returns all messages for a conversation, ordered by timestamp."""
    rows = await conn.fetch(
        """
        SELECT id, conversation_id, role, content, timestamp
        FROM messages
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
        """,
        conv_id,
    )
    return [_row_to_message(r) for r in rows]


async def rename_conversation(conn: asyncpg.Connection, conv_id: UUID, new_title: str) -> Optional[Conversation]:
    """Updates a conversation's title. Returns updated conversation or None."""
    row = await conn.fetchrow(
        """
        UPDATE conversations
        SET title = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, created_at, updated_at
        """,
        new_title.strip(),
        conv_id,
    )
    return _row_to_conversation(row) if row else None


async def delete_conversation(conn: asyncpg.Connection, conv_id: UUID) -> bool:
    """Deletes a conversation (cascades to messages). Returns True if deleted."""
    result = await conn.execute(
        "DELETE FROM conversations WHERE id = $1",
        conv_id,
    )
    # asyncpg returns "DELETE N" — check if N > 0
    return result.endswith("1")


# ══════════════════════════════════════════════════════════════════════════════
# Message CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def get_message_count(conn: asyncpg.Connection, conv_id: UUID) -> int:
    """Returns how many messages are in a conversation."""
    return await conn.fetchval(
        "SELECT COUNT(*) FROM messages WHERE conversation_id = $1",
        conv_id,
    )


async def save_message_pair(
    conn: asyncpg.Connection,
    conv_id: UUID,
    user_content: str,
    assistant_content: str,
    is_first_message: bool = False,
) -> tuple[Message, Message, str]:
    """
    Saves both user and assistant messages in one transaction.
    Auto-generates title if this is the first message.
    Returns (user_message, assistant_message, conversation_title).
    """
    async with conn.transaction():
        # Save user message
        user_row = await conn.fetchrow(
            """
            INSERT INTO messages (conversation_id, role, content)
            VALUES ($1, 'user', $2)
            RETURNING id, conversation_id, role, content, timestamp
            """,
            conv_id,
            user_content,
        )

        # Save assistant message
        asst_row = await conn.fetchrow(
            """
            INSERT INTO messages (conversation_id, role, content)
            VALUES ($1, 'assistant', $2)
            RETURNING id, conversation_id, role, content, timestamp
            """,
            conv_id,
            assistant_content,
        )

        # Update conversation timestamp and optionally title
        new_title = generate_title(user_content) if is_first_message else None

        if new_title:
            conv_row = await conn.fetchrow(
                """
                UPDATE conversations
                SET updated_at = NOW(), title = $1
                WHERE id = $2
                RETURNING title
                """,
                new_title,
                conv_id,
            )
        else:
            conv_row = await conn.fetchrow(
                """
                UPDATE conversations
                SET updated_at = NOW()
                WHERE id = $1
                RETURNING title
                """,
                conv_id,
            )

        title = conv_row["title"] if conv_row else "New Chat"

    return _row_to_message(user_row), _row_to_message(asst_row), title
