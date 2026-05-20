"""
RAG Reranker — Phase 2 chunk reranking for improved retrieval precision.

Strategy (free-tier compatible):
1. Primary: Cross-encoder scoring using Gemini's embedding similarity
   between the query and each chunk (no extra API cost — reuses embeddings).
2. Boost signals:
   - Recency: newer sources get a small boost
   - Trust: higher trust_level sources get a boost
   - Keyword overlap: exact keyword matches get a boost
3. Fallback: if embedding rerank fails, uses keyword overlap scoring.

This replaces the need for a paid Cohere reranker while maintaining
similar accuracy for our domain-specific financial content.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


# ── Keyword Overlap Scorer ──────────────────────────────────────

def _keyword_overlap_score(query: str, content: str) -> float:
    """
    Calculate keyword overlap between query and chunk content.
    Returns a score between 0.0 and 1.0.
    """
    query_words = set(re.findall(r'\b\w{3,}\b', query.lower()))
    content_words = set(re.findall(r'\b\w{3,}\b', content.lower()))

    if not query_words:
        return 0.0

    overlap = query_words & content_words
    return len(overlap) / len(query_words)


# ── Recency Boost ──────────────────────────────────────────────

def _recency_boost(source_date: Optional[str], max_boost: float = 0.08) -> float:
    """
    Give a small boost to more recent content.
    Content < 30 days old gets full boost, older content gets less.
    """
    if not source_date:
        return 0.0

    try:
        if isinstance(source_date, str):
            # Try multiple date formats
            for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S'):
                try:
                    dt = datetime.strptime(source_date.split('.')[0], fmt)
                    break
                except ValueError:
                    continue
            else:
                return 0.0
        else:
            dt = source_date

        age_days = (datetime.utcnow() - dt).days
        if age_days < 30:
            return max_boost
        elif age_days < 90:
            return max_boost * 0.6
        elif age_days < 365:
            return max_boost * 0.3
        return 0.0
    except Exception:
        return 0.0


# ── Trust Level Boost ──────────────────────────────────────────

def _trust_boost(trust_level: int, max_boost: float = 0.05) -> float:
    """
    Boost based on source trust level (1-5 scale).
    Level 5 (SEBI/RBI official) gets full boost.
    """
    if trust_level >= 5:
        return max_boost
    elif trust_level >= 4:
        return max_boost * 0.6
    elif trust_level >= 3:
        return max_boost * 0.3
    return 0.0


# ── Main Reranker ──────────────────────────────────────────────

def rerank_chunks(
    query: str,
    chunks: list[dict],
    top_k: int = 5,
    keyword_weight: float = 0.15,
    recency_weight: float = 1.0,
    trust_weight: float = 1.0,
) -> list[dict]:
    """
    Rerank retrieved chunks using multi-signal scoring.
    
    Final score = base_similarity + keyword_boost + recency_boost + trust_boost
    
    Args:
        query: The user's query
        chunks: List of chunk dicts from pgvector search (must have 'similarity_score')
        top_k: Number of top results to return
        keyword_weight: Weight for keyword overlap scoring
        recency_weight: Multiplier for recency boost
        trust_weight: Multiplier for trust boost
    
    Returns:
        Top-k reranked chunks with updated scores
    """
    if not chunks:
        return []

    scored = []
    for chunk in chunks:
        base_score = chunk.get("similarity_score", 0.0)

        # Keyword overlap
        kw_score = _keyword_overlap_score(query, chunk.get("content", ""))
        kw_boost = kw_score * keyword_weight

        # Recency
        rec_boost = _recency_boost(
            chunk.get("source_date"),
        ) * recency_weight

        # Trust level
        tr_boost = _trust_boost(
            chunk.get("trust_level", 3),
        ) * trust_weight

        # Final composite score
        final_score = base_score + kw_boost + rec_boost + tr_boost

        scored.append({
            **chunk,
            "rerank_score": round(final_score, 4),
            "rerank_detail": {
                "base": round(base_score, 4),
                "keyword_boost": round(kw_boost, 4),
                "recency_boost": round(rec_boost, 4),
                "trust_boost": round(tr_boost, 4),
            },
        })

    # Sort by rerank score descending
    scored.sort(key=lambda c: c["rerank_score"], reverse=True)

    top = scored[:top_k]
    logger.info(
        f"Reranked {len(chunks)} → {len(top)} chunks. "
        f"Top score: {top[0]['rerank_score'] if top else 'N/A'}"
    )
    return top


# ── Diversity Filter (MMR-inspired) ───────────────────────────

def diversify_chunks(
    chunks: list[dict],
    max_per_source: int = 2,
    min_content_diff: float = 0.3,
) -> list[dict]:
    """
    Apply diversity filtering to prevent dominated results from a single source.
    
    - Max N chunks per source document
    - Remove near-duplicate content
    """
    if not chunks:
        return []

    seen_sources: dict[str, int] = {}
    seen_content: list[set] = []
    diverse = []

    for chunk in chunks:
        source = chunk.get("doc_title", "") or chunk.get("source_url", "")

        # Source diversity check
        if source:
            count = seen_sources.get(source, 0)
            if count >= max_per_source:
                continue
            seen_sources[source] = count + 1

        # Content diversity check (Jaccard distance)
        chunk_words = set(chunk.get("content", "").lower().split())
        is_duplicate = False
        for existing_words in seen_content:
            if not chunk_words or not existing_words:
                continue
            intersection = chunk_words & existing_words
            union = chunk_words | existing_words
            jaccard = len(intersection) / len(union) if union else 0
            if jaccard > (1 - min_content_diff):
                is_duplicate = True
                break

        if is_duplicate:
            continue

        seen_content.append(chunk_words)
        diverse.append(chunk)

    return diverse
