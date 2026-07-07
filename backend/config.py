"""
config.py — MindNote AI
========================
Single source of truth for all environment variables.
Reads from backend/.env via python-dotenv.
"""

import os
from dotenv import load_dotenv

# Load .env from the same directory as this file
load_dotenv()

# ── Database ──────────────────────────────────────────────────────────────────
# Neon PostgreSQL connection string.
# Must use asyncpg driver prefix:  postgresql+asyncpg://...
DATABASE_URL: str = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not found.\n"
        "Add it to backend/.env:\n"
        "  DATABASE_URL=postgresql+asyncpg://<user>:<pass>@<host>/<db>?sslmode=require"
    )

# ── AI / Groq ─────────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found – add it to backend/.env")

# ── App Settings ──────────────────────────────────────────────────────────────
APP_TITLE   = "MindNote AI Chat API"
APP_VERSION = "2.0.0"
