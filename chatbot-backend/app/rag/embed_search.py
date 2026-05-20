"""
RAG Step 1 & 2: Embed queries and search pgvector.
Uses Gemini text-embedding-004 (free tier, 768 dimensions).
"""

from __future__ import annotations

import logging
from typing import Optional

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import settings
from app.db import repositories

logger = logging.getLogger(__name__)

# Singleton embeddings model
_embeddings: GoogleGenerativeAIEmbeddings | None = None


def get_embeddings_model() -> GoogleGenerativeAIEmbeddings:
    """Get or create the embeddings model instance."""
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.gemini_api_key,
        )
    return _embeddings


async def embed_query(text: str) -> list[float]:
    """Embed a single query string using Gemini."""
    model = get_embeddings_model()
    try:
        vector = await model.aembed_query(text)
        return vector
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        raise


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts using Gemini."""
    model = get_embeddings_model()
    try:
        vectors = await model.aembed_documents(texts)
        return vectors
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        raise


async def search(
    query: str,
    top_k: int | None = None,
    namespace: Optional[str] = None,
    score_threshold: float | None = None,
) -> list[dict]:
    """
    Full search pipeline: embed query → pgvector search → return ranked chunks.
    
    Returns list of dicts with: id, content, namespace, similarity_score,
    doc_title, source_url, source_date, trust_level
    """
    top_k = top_k or settings.rag_top_k
    score_threshold = score_threshold or settings.rag_score_threshold

    # Step 1: Embed the query
    embedding = await embed_query(query)

    # Step 2: Search pgvector
    chunks = await repositories.search_chunks(
        embedding=embedding,
        top_k=top_k,
        namespace=namespace,
        score_threshold=score_threshold,
    )

    logger.info(f"RAG search: query='{query[:50]}...' → {len(chunks)} chunks found")
    return chunks


async def search_multi_query(
    queries: list[str],
    top_k: int | None = None,
    namespace: Optional[str] = None,
    score_threshold: float | None = None,
) -> list[dict]:
    """
    Search with multiple query variants, deduplicate results by content hash.
    Used with query expansion (HyDE, multi-angle).
    """
    top_k = top_k or settings.rag_top_k
    score_threshold = score_threshold or settings.rag_score_threshold

    seen_ids: set[str] = set()
    all_chunks: list[dict] = []

    for query in queries:
        chunks = await search(query, top_k=top_k, namespace=namespace, score_threshold=score_threshold)
        for chunk in chunks:
            if chunk["id"] not in seen_ids:
                seen_ids.add(chunk["id"])
                all_chunks.append(chunk)

    # Re-sort by similarity score and take top_k
    all_chunks.sort(key=lambda c: c["similarity_score"], reverse=True)
    return all_chunks[:top_k]
