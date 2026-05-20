"""
Ingestion API — CMS webhook + manual ingestion endpoints.

- POST /api/ingest/article   — Ingest a single article by slug/ID
- POST /api/ingest/webhook   — CMS webhook (called by Supabase trigger)
- GET  /api/ingest/status     — Check ingestion status
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Request, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.db.connection import get_pool
from app.rag.embed_search import embed_texts

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Text Processing ─────────────────────────────────────────────

import re

def strip_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    """Split text into overlapping chunks."""
    if not text or not text.strip():
        return []

    words_per_chunk = int(chunk_size / 1.3)
    overlap_words = int(overlap / 1.3)

    words = text.split()
    if not words:
        return []
    if len(words) <= words_per_chunk:
        return [text.strip()]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + words_per_chunk, len(words))
        chunk_words = words[start:end]
        chunk = " ".join(chunk_words)

        # Try to break at sentence boundary
        last_period = chunk.rfind('. ')
        if last_period > len(chunk) * 0.5:
            chunk = chunk[:last_period + 1]
            actual_words = len(chunk.split())
            # Only use sentence boundary if it advances meaningfully
            if start + actual_words > start + overlap_words:
                end = start + actual_words

        chunks.append(chunk.strip())

        # Advance with overlap, but always move forward
        next_start = end - overlap_words
        if next_start <= start:
            next_start = start + max(1, overlap_words)  # Force forward progress
        start = next_start

    return [c for c in chunks if len(c.split()) >= 10]


def content_hash(text: str) -> str:
    """Generate content hash for deduplication."""
    return hashlib.sha256(text.encode()).hexdigest()[:32]


# ── Request Models ──────────────────────────────────────────────

class IngestArticleRequest(BaseModel):
    article_id: Optional[str] = None
    slug: Optional[str] = None


class WebhookPayload(BaseModel):
    """Supabase database webhook payload."""
    type: str = ""           # INSERT | UPDATE | DELETE
    table: str = ""
    record: Optional[dict] = None
    old_record: Optional[dict] = None


# ── Endpoints ───────────────────────────────────────────────────

@router.post("/ingest/article")
async def ingest_article(request: Request):
    """
    Manually ingest a single article into the vector DB.
    Provide either article_id or slug.
    """
    try:
        body = await request.json()
        req = IngestArticleRequest(**body)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    pool = get_pool()

    # Fetch article
    if req.article_id:
        article = await pool.fetchrow(
            "SELECT id, title, content, excerpt, category, tags, created_at FROM articles WHERE id = $1",
            uuid.UUID(req.article_id),
        )
    elif req.slug:
        article = await pool.fetchrow(
            "SELECT id, title, content, excerpt, category, tags, created_at FROM articles WHERE slug = $1",
            req.slug,
        )
    else:
        return JSONResponse(status_code=400, content={"error": "Provide article_id or slug"})

    if not article:
        return JSONResponse(status_code=404, content={"error": "Article not found"})

    try:
        result = await _ingest_single_article(article)
        return JSONResponse(content=result)
    except Exception as e:
        logger.exception(f"Ingestion failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/ingest/webhook")
async def cms_webhook(request: Request):
    """
    CMS webhook endpoint. Called when articles are created/updated in Supabase.
    
    Setup: Create a Supabase Database Webhook that POSTs to this endpoint
    on INSERT/UPDATE of the `articles` table.
    """
    try:
        body = await request.json()
        payload = WebhookPayload(**body)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    if payload.table != "articles":
        return JSONResponse(content={"status": "ignored", "reason": "not articles table"})

    if payload.type == "DELETE":
        # Remove chunks for deleted article
        if payload.old_record and payload.old_record.get("id"):
            try:
                pool = get_pool()
                doc_url = f"internal://articles/{payload.old_record['id']}"
                source = await pool.fetchrow(
                    "SELECT id FROM source_documents WHERE url = $1", doc_url,
                )
                if source:
                    await pool.execute("DELETE FROM document_chunks WHERE doc_id = $1", source["id"])
                    await pool.execute("DELETE FROM source_documents WHERE id = $1", source["id"])
                    logger.info(f"Deleted chunks for removed article: {payload.old_record['id']}")
            except Exception as e:
                logger.error(f"Webhook delete failed: {e}")
        return JSONResponse(content={"status": "deleted"})

    # INSERT or UPDATE — ingest the article
    record = payload.record
    if not record or not record.get("is_published"):
        return JSONResponse(content={"status": "skipped", "reason": "not published"})

    try:
        pool = get_pool()
        article = await pool.fetchrow(
            "SELECT id, title, content, excerpt, category, tags, created_at FROM articles WHERE id = $1",
            uuid.UUID(record["id"]),
        )
        if article:
            result = await _ingest_single_article(article)
            return JSONResponse(content=result)
        else:
            return JSONResponse(status_code=404, content={"error": "Article not found in DB"})
    except Exception as e:
        logger.exception(f"Webhook ingestion failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/ingest/status")
async def ingestion_status():
    """Get stats about the ingested content."""
    try:
        pool = get_pool()
        
        stats = await pool.fetchrow("""
            SELECT 
                (SELECT COUNT(*) FROM source_documents) AS total_docs,
                (SELECT COUNT(*) FROM document_chunks) AS total_chunks,
                (SELECT COUNT(DISTINCT namespace) FROM document_chunks) AS namespaces,
                (SELECT MAX(created_at) FROM document_chunks) AS last_ingested
        """)
        
        namespaces = await pool.fetch("""
            SELECT namespace, COUNT(*) as chunk_count 
            FROM document_chunks 
            GROUP BY namespace 
            ORDER BY chunk_count DESC
        """)

        return JSONResponse(content={
            "total_documents": stats["total_docs"],
            "total_chunks": stats["total_chunks"],
            "namespaces": {r["namespace"]: r["chunk_count"] for r in namespaces},
            "last_ingested": str(stats["last_ingested"]) if stats["last_ingested"] else None,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ── Internal Ingestion Logic ────────────────────────────────────

async def _ingest_single_article(article) -> dict:
    """Ingest a single article: chunk → embed → store."""
    import numpy as np

    pool = get_pool()
    article_id = str(article["id"])
    title = article["title"] or ""
    raw_content = article["content"] or ""
    excerpt = article["excerpt"] or ""
    category = article["category"] or ""
    tags = article["tags"]
    created_at = article["created_at"]

    # Clean HTML
    clean_content = strip_html(raw_content)
    if not clean_content or len(clean_content.split()) < 20:
        return {"status": "skipped", "reason": "content too short"}

    full_text = f"{title}\n\n{excerpt}\n\n{clean_content}"
    doc_url = f"internal://articles/{article_id}"
    doc_hash = content_hash(full_text)

    # Check if unchanged
    existing = await pool.fetchrow(
        "SELECT id, doc_hash FROM source_documents WHERE url = $1", doc_url,
    )
    if existing and existing["doc_hash"] == doc_hash:
        return {"status": "unchanged", "article_id": article_id}

    # Upsert source document
    if existing:
        doc_id = existing["id"]
        await pool.execute(
            "UPDATE source_documents SET doc_hash = $1, last_crawled_at = NOW(), title = $2 WHERE id = $3",
            doc_hash, title, doc_id,
        )
        await pool.execute("DELETE FROM document_chunks WHERE doc_id = $1", doc_id)
    else:
        doc_id = uuid.uuid4()
        await pool.execute(
            """INSERT INTO source_documents (id, url, title, namespace, doc_hash, last_crawled_at, trust_level)
            VALUES ($1, $2, $3, 'concepts', $4, NOW(), 5)""",
            doc_id, doc_url, title, doc_hash,
        )

    # Chunk
    chunks = chunk_text(full_text)
    if not chunks:
        return {"status": "skipped", "reason": "no chunks generated"}

    # Batch embed
    embeddings = await embed_texts(chunks)

    # Store chunks
    stored = 0
    tags_list = []
    if tags:
        if isinstance(tags, str):
            tags = json.loads(tags)
        if isinstance(tags, list):
            tags_list = [t.get("name", "") if isinstance(t, dict) else str(t) for t in tags]

    for i, (chunk_text_item, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_id = uuid.uuid4()
        c_hash = content_hash(chunk_text_item)
        vec = np.array(embedding, dtype=np.float32)
        metadata = {
            "doc_title": title,
            "source_url": doc_url,
            "category": category,
            "tags": tags_list,
            "chunk_index": i,
            "trust_level": 5,
        }

        try:
            await pool.execute(
                """INSERT INTO document_chunks (id, doc_id, namespace, content, content_hash, embedding, metadata, source_date)
                VALUES ($1, $2, 'concepts', $3, $4, $5::vector, $6, $7)
                ON CONFLICT (content_hash) DO UPDATE SET metadata = $6, updated_at = NOW()""",
                chunk_id, doc_id, chunk_text_item, c_hash,
                vec, json.dumps(metadata), created_at,
            )
            stored += 1
        except Exception as e:
            logger.error(f"Chunk insert failed: {e}")

    # Update chunk count
    await pool.execute(
        "UPDATE source_documents SET chunk_count = $1 WHERE id = $2",
        stored, doc_id,
    )

    logger.info(f"Ingested '{title}': {stored}/{len(chunks)} chunks")
    return {
        "status": "ingested",
        "article_id": article_id,
        "title": title,
        "chunks_stored": stored,
        "chunks_total": len(chunks),
    }
