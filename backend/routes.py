"""
routes.py — MindNote AI
========================
All Chat History API routes, mounted as a router in main.py.

Endpoints:
  POST   /conversation          Create a new conversation
  GET    /conversations         Get all conversations (sorted by latest)
  GET    /conversation/{id}     Get one conversation with all its messages
  POST   /message               Save user + AI messages (one round-trip)
  DELETE /conversation/{id}     Delete conversation + all messages
  PUT    /conversation/{id}     Rename conversation title
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

import crud
from database import get_db
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


# ── POST /conversation ────────────────────────────────────────────────────────
@router.post(
    "/conversation",
    response_model=ConversationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new conversation with an optional initial title.
    Title is 'New Chat' by default — it gets auto-updated when the
    first message is saved via POST /message.
    """
    try:
        conv = await crud.create_conversation(db, title=body.title or "New Chat")
        return conv
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}",
        )


# ── GET /conversations ────────────────────────────────────────────────────────
@router.get(
    "/conversations",
    response_model=list[ConversationOut],
    summary="Get all conversations sorted by latest",
)
async def get_conversations(db: AsyncSession = Depends(get_db)):
    """
    Returns all conversations sorted by most recently updated first.
    Used to populate the sidebar list.
    Messages are NOT included here (saves bandwidth).
    """
    try:
        convs = await crud.get_all_conversations(db)
        return convs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversations: {str(e)}",
        )


# ── GET /conversation/{id} ────────────────────────────────────────────────────
@router.get(
    "/conversation/{conv_id}",
    response_model=ConversationWithMessages,
    summary="Get one conversation with all its messages",
)
async def get_conversation(
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a single conversation with all its messages ordered by timestamp.
    Used when the user clicks a conversation in the sidebar.
    """
    try:
        conv = await crud.get_conversation_by_id(db, conv_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conv_id} not found",
        )

    return conv


# ── POST /message ─────────────────────────────────────────────────────────────
@router.post(
    "/message",
    response_model=SaveMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save both user message and AI response",
)
async def save_message(
    body: SaveMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Saves both the user message and the AI response in a single request.
    If this is the first message in the conversation, auto-generates a title.

    The frontend calls this AFTER the AI stream completes.
    """
    try:
        # Check if this is the first message (for auto-title generation)
        msg_count = await crud.get_message_count(db, body.conversation_id)
        is_first  = msg_count == 0

        user_msg, asst_msg, title = await crud.save_message_pair(
            db=db,
            conv_id=body.conversation_id,
            user_content=body.user_content,
            assistant_content=body.assistant_content,
            is_first_message=is_first,
        )

        return SaveMessageResponse(
            user_message=MessageOut.model_validate(user_msg),
            assistant_message=MessageOut.model_validate(asst_msg),
            conversation_title=title,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save messages: {str(e)}",
        )


# ── DELETE /conversation/{id} ──────────────────────────────────────────────────
@router.delete(
    "/conversation/{conv_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation and all its messages",
)
async def delete_conversation(
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently deletes a conversation and all related messages (CASCADE).
    Returns 204 No Content on success, 404 if not found.
    """
    try:
        deleted = await crud.delete_conversation(db, conv_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}",
        )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conv_id} not found",
        )


# ── PUT /conversation/{id} ─────────────────────────────────────────────────────
@router.put(
    "/conversation/{conv_id}",
    response_model=ConversationOut,
    summary="Rename a conversation",
)
async def rename_conversation(
    conv_id: UUID,
    body: ConversationRename,
    db: AsyncSession = Depends(get_db),
):
    """
    Updates the title of an existing conversation.
    Used when the user inline-edits a title in the sidebar.
    """
    if not body.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title cannot be empty",
        )

    try:
        conv = await crud.rename_conversation(db, conv_id, body.title)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rename conversation: {str(e)}",
        )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conv_id} not found",
        )

    return conv
