"""
database.py — MindNote AI
==========================
Pure asyncpg connection pool for Neon PostgreSQL.

Bypasses SQLAlchemy async (which requires greenlet — incompatible with Python 3.14)
and uses asyncpg directly. This is actually simpler, faster, and works perfectly
with Neon's serverless architecture.
"""

import asyncpg
from config import DATABASE_URL

# ── Global connection pool ─────────────────────────────────────────────────────
_pool: asyncpg.Pool | None = None

# Convert SQLAlchemy-style URL to standard PostgreSQL URL for asyncpg
# asyncpg uses: postgresql://... (NOT postgresql+asyncpg://)
def _get_asyncpg_url(url: str) -> str:
    """Strip the +asyncpg driver suffix that SQLAlchemy requires but asyncpg doesn't."""
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def get_pool() -> asyncpg.Pool:
    """Returns the global connection pool, creating it if needed."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=_get_asyncpg_url(DATABASE_URL),
            min_size=1,
            max_size=5,
            command_timeout=30,
        )
    return _pool


async def close_pool():
    """Closes the connection pool on shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ── FastAPI Dependency ────────────────────────────────────────────────────────
async def get_db():
    """
    Yields an asyncpg connection from the pool.
    Usage in route: conn = Depends(get_db)
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


# ── Table Creation ────────────────────────────────────────────────────────────
CREATE_CONVERSATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_MESSAGES_TABLE = """
CREATE TABLE IF NOT EXISTS messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL,
    content             TEXT NOT NULL,
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_INDEX_CONV_ID = """
CREATE INDEX IF NOT EXISTS ix_messages_conversation_id
ON messages(conversation_id);
"""

CREATE_INDEX_TIMESTAMP = """
CREATE INDEX IF NOT EXISTS ix_messages_timestamp
ON messages(timestamp);
"""

CREATE_INDEX_CONV_TIME = """
CREATE INDEX IF NOT EXISTS ix_messages_conv_time
ON messages(conversation_id, timestamp);
"""

CREATE_INDEX_CONV_UPDATED = """
CREATE INDEX IF NOT EXISTS ix_conversations_updated_at
ON conversations(updated_at DESC);
"""


async def create_all_tables():
    """
    Creates all database tables if they don't already exist.
    Called once at application startup.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(CREATE_CONVERSATIONS_TABLE)
            await conn.execute(CREATE_MESSAGES_TABLE)
            await conn.execute(CREATE_INDEX_CONV_ID)
            await conn.execute(CREATE_INDEX_TIMESTAMP)
            await conn.execute(CREATE_INDEX_CONV_TIME)
            await conn.execute(CREATE_INDEX_CONV_UPDATED)
