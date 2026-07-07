"""
database.py — MindNote AI
==========================
Async SQLAlchemy engine + session factory for Neon PostgreSQL.

Uses asyncpg driver for full async I/O.
Connection pooling is configured for Neon's serverless environment
(keep pool small — Neon suspends idle connections).
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from config import DATABASE_URL

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True → automatically reconnects stale connections (important
# for Neon which suspends after inactivity)
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,        # max persistent connections
    max_overflow=10,    # additional connections allowed under load
    echo=False,         # set True to log all SQL (useful for debugging)
)

# ── Session Factory ───────────────────────────────────────────────────────────
# expire_on_commit=False prevents SQLAlchemy from expiring objects after
# commit, which would cause errors when accessing attributes post-commit
# in async context.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=True,
    autocommit=False,
)

# ── Base class for all ORM models ─────────────────────────────────────────────
class Base(DeclarativeBase):
    pass

# ── FastAPI Dependency ────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """
    Yields an async database session.
    Session is automatically closed after the request completes.
    Usage in route: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# ── Table Creation ────────────────────────────────────────────────────────────
async def create_all_tables():
    """
    Creates all database tables if they don't already exist.
    Called once at application startup.
    For production schema migrations, use Alembic instead.
    """
    async with engine.begin() as conn:
        # Import models so SQLAlchemy discovers them before creating tables
        from models import Conversation, Message  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
