"""
Async PostgreSQL connection pool with pgvector support.
Connects to the existing Supabase PostgreSQL instance.
"""

from __future__ import annotations

import asyncpg
from pgvector.asyncpg import register_vector

from app.config import settings

_pool: asyncpg.Pool | None = None


async def _init_connection(conn: asyncpg.Connection) -> None:
    """Register pgvector type on each new connection."""
    await register_vector(conn)


async def init_db() -> None:
    """Initialize the connection pool. Called on app startup."""
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=2,
        max_size=10,
        init=_init_connection,
        command_timeout=30,
    )


async def close_db() -> None:
    """Close the connection pool. Called on app shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """Get the active connection pool."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_db() first.")
    return _pool
