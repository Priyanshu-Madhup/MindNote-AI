"""
crud.py — MindNote AI
======================
All async database operations (Create, Read, Update, Delete).
Every function takes an AsyncSession and returns ORM model instances
(or None on not-found).

This layer knows nothing about HTTP — it's pure database logic.
"""

import re
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models import Conversation, Message


# ══════════════════════════════════════════════════════════════════════════════
# Title Generation
# ══════════════════════════════════════════════════════════════════════════════

# Common question/instruction prefixes to strip for cleaner titles
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
      "Explain Binary Search"         → "Binary Search"
      "What is photosynthesis?"       → "Photosynthesis"
      "How to reverse a linked list?" → "Reverse a Linked List"
      "Write a poem about rain"       → "Write a Poem About Rain"
      "Hello there"                   → "Hello There"
    """
    text = first_user_message.strip()

    # Remove trailing punctuation
    text = text.rstrip("?.!")

    # Strip leading instruction verbs
    text = _STRIP_PREFIXES.sub("", text, count=1).strip()

    # Title-case the result
    text = text.title()

    # Truncate to 50 chars, breaking at a word boundary
    if len(text) > 50:
        text = text[:50].rsplit(" ", 1)[0] + "…"

    return text or "New Chat"


# ══════════════════════════════════════════════════════════════════════════════
# Conversation CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def create_conversation(
    db: AsyncSession,
    title: str = "New Chat",
) -> Conversation:
    """Creates a new conversation row and returns it."""
    conv = Conversation(title=title)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


async def get_all_conversations(db: AsyncSession) -> List[Conversation]:
    """
    Returns all conversations sorted by most recently updated first.
    Messages are NOT loaded here (sidebar only needs titles + timestamps).
    """
    result = await db.execute(
        select(Conversation).order_by(desc(Conversation.updated_at))
    )
    return result.scalars().all()


async def get_conversation_by_id(
    db: AsyncSession,
    conv_id: UUID,
) -> Optional[Conversation]:
    """
    Returns a single Conversation with all its Messages pre-loaded.
    Returns None if not found.
    """
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id)
    )
    return result.scalar_one_or_none()


async def rename_conversation(
    db: AsyncSession,
    conv_id: UUID,
    new_title: str,
) -> Optional[Conversation]:
    """
    Updates a conversation's title.
    Returns the updated conversation or None if not found.
    """
    conv = await get_conversation_by_id(db, conv_id)
    if not conv:
        return None

    conv.title = new_title.strip()
    # Manually bump updated_at since we're not adding messages
    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conv)
    return conv


async def delete_conversation(
    db: AsyncSession,
    conv_id: UUID,
) -> bool:
    """
    Deletes a conversation (and all its messages via CASCADE).
    Returns True if deleted, False if not found.
    """
    conv = await get_conversation_by_id(db, conv_id)
    if not conv:
        return False

    await db.delete(conv)
    await db.commit()
    return True


async def update_conversation_timestamp(
    db: AsyncSession,
    conv_id: UUID,
) -> None:
    """Bumps updated_at on a conversation (used when new messages are added)."""
    await db.execute(
        update(Conversation)
        .where(Conversation.id == conv_id)
        .values(updated_at=datetime.now(timezone.utc))
    )
    await db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# Message CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def save_message(
    db: AsyncSession,
    conv_id: UUID,
    role: str,
    content: str,
) -> Message:
    """
    Saves a single message to the database.
    Also bumps the parent conversation's updated_at timestamp.
    """
    msg = Message(
        conversation_id=conv_id,
        role=role,
        content=content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def save_message_pair(
    db: AsyncSession,
    conv_id: UUID,
    user_content: str,
    assistant_content: str,
    is_first_message: bool = False,
) -> tuple[Message, Message, str]:
    """
    Saves both user and assistant messages in one transaction.
    If it's the first message, auto-generates and updates the title.

    Returns: (user_message, assistant_message, current_title)
    """
    # Generate title from first user message
    new_title = None
    if is_first_message:
        new_title = generate_title(user_content)

    # Save user message
    user_msg = Message(conversation_id=conv_id, role="user",      content=user_content)
    asst_msg = Message(conversation_id=conv_id, role="assistant", content=assistant_content)

    db.add(user_msg)
    db.add(asst_msg)

    # Update conversation timestamp and optionally the title
    conv = await get_conversation_by_id(db, conv_id)
    if conv:
        conv.updated_at = datetime.now(timezone.utc)
        if new_title:
            conv.title = new_title

    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(asst_msg)
    if conv:
        await db.refresh(conv)

    return user_msg, asst_msg, conv.title if conv else "New Chat"


async def get_message_count(db: AsyncSession, conv_id: UUID) -> int:
    """Returns the number of messages in a conversation."""
    result = await db.execute(
        select(func.count()).where(Message.conversation_id == conv_id)
    )
    return result.scalar_one()
