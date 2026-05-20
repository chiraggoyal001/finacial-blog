"""
Database repository functions — all CRUD for chat, persona, RAG chunks.
Uses asyncpg directly against Supabase PostgreSQL.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Optional

import numpy as np

from app.db.connection import get_pool
from app.config import settings


# ═══════════════════════════════════════════════════════════════
# CHAT SESSIONS & MESSAGES
# ═══════════════════════════════════════════════════════════════

async def create_chat_session(
    user_id: Optional[str] = None,
    session_type: str = "reactive",
    initiation_type: str = "user_message",
) -> str:
    """Create a new chat session and return its ID."""
    pool = get_pool()
    session_id = str(uuid.uuid4())
    await pool.execute(
        """
        INSERT INTO chat_sessions (id, user_id, session_type, initiation_type)
        VALUES ($1, $2, $3, $4)
        """,
        uuid.UUID(session_id),
        uuid.UUID(user_id) if user_id else None,
        session_type,
        initiation_type,
    )
    return session_id


async def save_chat_message(
    session_id: str,
    role: str,
    content: str,
    model_used: str = "",
    tokens_used: int = 0,
    rag_chunk_ids: Optional[list[str]] = None,
    compliance_flags: Optional[dict] = None,
) -> str:
    """Save a chat message and return its ID."""
    pool = get_pool()
    msg_id = str(uuid.uuid4())
    await pool.execute(
        """
        INSERT INTO chat_messages (id, session_id, role, content, model_used, tokens_used, compliance_flags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
        uuid.UUID(msg_id),
        uuid.UUID(session_id),
        role,
        content,
        model_used,
        tokens_used,
        json.dumps(compliance_flags or {}),
    )
    # Increment message count
    await pool.execute(
        "UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = $1",
        uuid.UUID(session_id),
    )
    return msg_id


async def get_chat_history(session_id: str, limit: int = 20) -> list[dict]:
    """Fetch recent messages for a session."""
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT role, content, created_at
        FROM chat_messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        uuid.UUID(session_id),
        limit,
    )
    # Reverse to chronological order
    return [
        {"role": row["role"], "content": row["content"], "created_at": str(row["created_at"])}
        for row in reversed(rows)
    ]


# ═══════════════════════════════════════════════════════════════
# USER PERSONA
# ═══════════════════════════════════════════════════════════════

async def get_user_persona(user_id: str) -> dict:
    """
    Fetch the user persona. Falls back to building one from the profiles table
    if no persona record exists yet.
    """
    pool = get_pool()

    # Try persona table first
    row = await pool.fetchrow(
        "SELECT data, confidence_scores FROM user_personas WHERE user_id = $1",
        uuid.UUID(user_id),
    )
    if row:
        data = row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])
        return data

    # Fallback: build flat persona from profiles table
    profile = await pool.fetchrow(
        """
        SELECT first_name, last_name, age, region, interests, profession, hobbies
        FROM profiles WHERE id = $1
        """,
        uuid.UUID(user_id),
    )
    if not profile:
        return {}

    return {
        "first_name": profile["first_name"] or "",
        "age": profile["age"],
        "region": profile["region"] or "",
        "interests": profile["interests"] or [],
        "profession": profile["profession"] or "",
        "hobbies": profile["hobbies"] or "",
        "literacy_level": "beginner",  # default until calibrated
        "goals": [],
        "risk_profile": "",
    }


async def upsert_user_persona(user_id: str, data: dict) -> None:
    """Create or update the user persona."""
    pool = get_pool()
    await pool.execute(
        """
        INSERT INTO user_personas (user_id, data, last_enriched_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET data = $2, version = user_personas.version + 1, updated_at = NOW(), last_enriched_at = NOW()
        """,
        uuid.UUID(user_id),
        json.dumps(data),
    )


# ═══════════════════════════════════════════════════════════════
# VECTOR SEARCH (RAG)
# ═══════════════════════════════════════════════════════════════

async def search_chunks(
    embedding: list[float],
    top_k: int = 10,
    namespace: Optional[str] = None,
    score_threshold: float = 0.35,
) -> list[dict]:
    """
    Search document_chunks using pgvector cosine similarity.
    Returns chunks sorted by relevance, filtered by threshold.
    """
    pool = get_pool()
    vec = np.array(embedding, dtype=np.float32)

    # Build query with optional namespace filter
    if namespace:
        rows = await pool.fetch(
            """
            SELECT
                id, content, namespace, metadata,
                source_date, 
                1 - (embedding <=> $1::vector) AS similarity_score
            FROM document_chunks
            WHERE namespace = $2
              AND (ttl_days IS NULL OR created_at + (ttl_days || ' days')::interval > NOW())
              AND superseded_by IS NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $3
            """,
            vec,
            namespace,
            top_k,
        )
    else:
        rows = await pool.fetch(
            """
            SELECT
                id, content, namespace, metadata,
                source_date,
                1 - (embedding <=> $1::vector) AS similarity_score
            FROM document_chunks
            WHERE (ttl_days IS NULL OR created_at + (ttl_days || ' days')::interval > NOW())
              AND superseded_by IS NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2
            """,
            vec,
            top_k,
        )

    results = []
    for row in rows:
        score = float(row["similarity_score"])
        if score < score_threshold:
            continue

        meta = row["metadata"] if isinstance(row["metadata"], dict) else json.loads(row["metadata"] or "{}")
        results.append({
            "id": str(row["id"]),
            "content": row["content"],
            "namespace": row["namespace"],
            "similarity_score": score,
            "doc_title": meta.get("doc_title", ""),
            "source_url": meta.get("source_url", ""),
            "source_date": str(row["source_date"]) if row["source_date"] else None,
            "trust_level": meta.get("trust_level", 3),
        })

    return results


# ═══════════════════════════════════════════════════════════════
# INGESTION HELPERS
# ═══════════════════════════════════════════════════════════════

async def upsert_chunk(
    doc_id: str,
    namespace: str,
    content: str,
    content_hash: str,
    embedding: list[float],
    metadata: dict,
    source_date: Optional[datetime] = None,
    ttl_days: Optional[int] = None,
) -> str:
    """Insert or update a document chunk in the vector store."""
    pool = get_pool()
    chunk_id = str(uuid.uuid4())
    vec = np.array(embedding, dtype=np.float32)

    await pool.execute(
        """
        INSERT INTO document_chunks (id, doc_id, namespace, content, content_hash, embedding, metadata, source_date, ttl_days)
        VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8, $9)
        ON CONFLICT (content_hash)
        DO UPDATE SET metadata = $7, updated_at = NOW()
        """,
        uuid.UUID(chunk_id),
        uuid.UUID(doc_id),
        namespace,
        content,
        content_hash,
        vec,
        json.dumps(metadata),
        source_date,
        ttl_days,
    )
    return chunk_id


async def upsert_source_document(
    url: str,
    title: str,
    namespace: str,
    doc_hash: str,
    trust_level: int = 3,
) -> str:
    """Register or update a source document."""
    pool = get_pool()
    doc_id = str(uuid.uuid4())

    row = await pool.fetchrow(
        """
        INSERT INTO source_documents (id, url, title, namespace, doc_hash, last_crawled_at, trust_level)
        VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        ON CONFLICT (url)
        DO UPDATE SET doc_hash = $5, last_crawled_at = NOW(), title = $3
        RETURNING id
        """,
        uuid.UUID(doc_id),
        url,
        title,
        namespace,
        doc_hash,
        trust_level,
    )
    return str(row["id"])


# ═══════════════════════════════════════════════════════════════
# SYSTEM SETTINGS & AFFILIATES
# ═══════════════════════════════════════════════════════════════

async def get_system_setting(key: str) -> Optional[dict]:
    """Fetch a system setting by key."""
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT value FROM system_settings WHERE key = $1",
        key,
    )
    if not row:
        return None
    return row["value"] if isinstance(row["value"], dict) else json.loads(row["value"])


async def get_active_affiliates() -> list[dict]:
    """Fetch active chatbot-controlled affiliate links."""
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT name, url, description, category, chatbot_prompt
        FROM affiliate_links
        WHERE is_active = true AND chatbot_controlled = true
        """
    )
    return [dict(r) for r in rows]
