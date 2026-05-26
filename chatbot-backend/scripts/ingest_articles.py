"""
Article Ingestion Script — Seeds the vector DB with existing blog articles.

Usage:
    cd chatbot-backend
    python -m scripts.ingest_articles

This script:
1. Connects to your Supabase PostgreSQL
2. Fetches all published articles
3. Chunks each article
4. Embeds chunks using Gemini text-embedding-004
5. Stores in document_chunks table with pgvector
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import sys
import uuid
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncpg
from pgvector.asyncpg import register_vector

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s")
logger = logging.getLogger(__name__)


# ── Config ──────────────────────────────────────────────────────

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")

# Chunking parameters
CHUNK_SIZE = 512       # target tokens per chunk
CHUNK_OVERLAP = 64     # overlap tokens
MAX_BATCH_SIZE = 20    # embeddings per batch


# ── Text Chunking ───────────────────────────────────────────────

def strip_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split text into chunks using recursive character splitting.
    Splits on: paragraph, newline, sentence, space.
    """
    if not text:
        return []

    # Estimate words per chunk (1.3 tokens per word)
    words_per_chunk = int(chunk_size / 1.3)
    overlap_words = int(overlap / 1.3)

    words = text.split()
    if len(words) <= words_per_chunk:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = start + words_per_chunk
        chunk_words = words[start:end]
        chunk = " ".join(chunk_words)

        # Try to break at sentence boundary
        last_period = chunk.rfind('. ')
        if last_period > len(chunk) * 0.5:
            chunk = chunk[:last_period + 1]
            # Adjust end based on actual words used
            actual_words = len(chunk.split())
            end = start + actual_words

        chunks.append(chunk.strip())
        start = end - overlap_words
        if start <= 0 and end > 0:
            start = end  # prevent infinite loop

    return [c for c in chunks if len(c.split()) >= 10]  # min 10 words


def content_hash(text: str) -> str:
    """Generate content hash for deduplication."""
    return hashlib.sha256(text.encode()).hexdigest()[:32]


# ── Gemini Embedding ────────────────────────────────────────────

async def embed_texts_batch(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using Gemini API directly (no LangChain dependency)."""
    import httpx

    url = f"https://generativelanguage.googleapis.com/v1beta/{GEMINI_EMBEDDING_MODEL}:batchEmbedContents"
    
    requests_body = {
        "requests": [
            {
                "model": GEMINI_EMBEDDING_MODEL,
                "content": {"parts": [{"text": t}]},
                "taskType": "RETRIEVAL_DOCUMENT",
                "outputDimensionality": 768,
            }
            for t in texts
        ]
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{url}?key={GEMINI_API_KEY}",
            json=requests_body,
        )
        resp.raise_for_status()
        data = resp.json()

    embeddings = []
    for emb in data.get("embeddings", []):
        embeddings.append(emb["values"])

    return embeddings


# ── Main Ingestion ──────────────────────────────────────────────

async def ingest_articles():
    """Fetch articles from DB, chunk, embed, and store."""
    if not DATABASE_URL:
        logger.error("DATABASE_URL not set in .env")
        return
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not set in .env")
        return

    logger.info("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    await register_vector(conn)

    try:
        # Fetch published articles
        articles = await conn.fetch(
            """
            SELECT id, title, content, excerpt, category, tags, created_at
            FROM articles
            WHERE is_published = true
            ORDER BY created_at DESC
            """
        )
        logger.info(f"Found {len(articles)} published articles")

        total_chunks = 0
        for article in articles:
            article_id = str(article["id"])
            title = article["title"]
            raw_content = article["content"] or ""
            excerpt = article["excerpt"] or ""
            category = article["category"] or ""
            tags = article["tags"]
            created_at = article["created_at"]

            # Strip HTML from content
            clean_content = strip_html(raw_content)
            if not clean_content or len(clean_content.split()) < 20:
                logger.warning(f"  Skipping '{title}' — too short after cleaning")
                continue

            # Full text = title + excerpt + content
            full_text = f"{title}\n\n{excerpt}\n\n{clean_content}"

            # Register source document
            doc_url = f"internal://articles/{article_id}"
            doc_hash = content_hash(full_text)

            # Check if already ingested with same hash
            existing = await conn.fetchrow(
                "SELECT id, doc_hash FROM source_documents WHERE url = $1",
                doc_url,
            )
            if existing and existing["doc_hash"] == doc_hash:
                logger.info(f"  ✓ '{title}' — unchanged, skipping")
                continue

            # Upsert source document
            if existing:
                doc_id = str(existing["id"])
                await conn.execute(
                    "UPDATE source_documents SET doc_hash = $1, last_crawled_at = NOW(), title = $2 WHERE id = $3",
                    doc_hash, title, existing["id"],
                )
                # Delete old chunks
                await conn.execute(
                    "DELETE FROM document_chunks WHERE doc_id = $1",
                    existing["id"],
                )
            else:
                doc_id = str(uuid.uuid4())
                await conn.execute(
                    """
                    INSERT INTO source_documents (id, url, title, namespace, doc_hash, last_crawled_at, trust_level)
                    VALUES ($1, $2, $3, 'concepts', $4, NOW(), 5)
                    """,
                    uuid.UUID(doc_id), doc_url, title, doc_hash,
                )

            # Chunk the article
            chunks = chunk_text(full_text)
            logger.info(f"  📄 '{title}' → {len(chunks)} chunks")

            # Batch embed
            for i in range(0, len(chunks), MAX_BATCH_SIZE):
                batch = chunks[i:i + MAX_BATCH_SIZE]
                try:
                    embeddings = await embed_texts_batch(batch)
                except Exception as e:
                    logger.error(f"  ❌ Embedding failed for batch: {e}")
                    continue

                # Store chunks
                for j, (chunk_text_item, embedding) in enumerate(zip(batch, embeddings)):
                    chunk_id = uuid.uuid4()
                    c_hash = content_hash(chunk_text_item)

                    tags_list = []
                    if tags:
                        if isinstance(tags, str):
                            tags = json.loads(tags)
                        if isinstance(tags, list):
                            tags_list = [t.get("name", "") if isinstance(t, dict) else str(t) for t in tags]

                    metadata = {
                        "doc_title": title,
                        "source_url": doc_url,
                        "category": category,
                        "tags": tags_list,
                        "chunk_index": i + j,
                        "trust_level": 5,
                    }

                    import numpy as np
                    vec = np.array(embedding, dtype=np.float32)

                    try:
                        await conn.execute(
                            """
                            INSERT INTO document_chunks (id, doc_id, namespace, content, content_hash, embedding, metadata, source_date)
                            VALUES ($1, $2, 'concepts', $3, $4, $5::vector, $6, $7)
                            ON CONFLICT (content_hash) DO UPDATE SET metadata = $6, updated_at = NOW()
                            """,
                            chunk_id, uuid.UUID(doc_id), chunk_text_item, c_hash,
                            vec, json.dumps(metadata), created_at,
                        )
                        total_chunks += 1
                    except Exception as e:
                        logger.error(f"  ❌ Chunk insert failed: {e}")

                # Rate limit: small delay between batches
                await asyncio.sleep(0.5)

            # Update source doc chunk count
            await conn.execute(
                "UPDATE source_documents SET chunk_count = $1 WHERE id = $2",
                len(chunks), uuid.UUID(doc_id),
            )

        logger.info(f"\n✅ Ingestion complete! {total_chunks} chunks stored across {len(articles)} articles")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(ingest_articles())
