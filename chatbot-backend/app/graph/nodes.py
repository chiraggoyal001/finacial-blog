"""
LangGraph node functions — each node reads/writes to ChatState.

Pipeline (v2 — with escalation, query expansion, persona enrichment):
  validate_input → escalation_check → fetch_context → rag_search → assemble → (stream) → post_process
"""

from __future__ import annotations

import logging
from typing import Any

from app.config import settings
from app.db import repositories
from app import bot_config
from app.rag import embed_search
from app.rag.inject import assemble_prompt, estimate_tokens
from app.graph.state import ChatState

logger = logging.getLogger(__name__)

# ── Rate Limiter (in-memory for Phase 1) ────────────────────────
_rate_limits: dict[str, list[float]] = {}  # user_id → [timestamps]


def _check_rate_limit(user_id: str) -> bool:
    """Check if user has exceeded rate limit. Returns True if allowed."""
    import time
    now = time.time()
    window = settings.rate_limit_window

    if user_id not in _rate_limits:
        _rate_limits[user_id] = []

    # Clean old entries
    _rate_limits[user_id] = [t for t in _rate_limits[user_id] if now - t < window]

    if len(_rate_limits[user_id]) >= settings.rate_limit_max_requests:
        return False

    _rate_limits[user_id].append(now)
    return True


# ═══════════════════════════════════════════════════════════════
# NODE 1: VALIDATE INPUT
# ═══════════════════════════════════════════════════════════════

async def validate_input(state: ChatState) -> dict[str, Any]:
    """
    Validate the user's message: length, rate limit, empty check.
    """
    message = state.get("user_message", "").strip()
    user_id = state.get("user_id")

    # Empty message check
    if not message:
        return {
            "is_valid": False,
            "validation_error": "Please enter a message.",
            "error": "Empty message",
            "error_stage": "validate_input",
        }

    # Length check
    if len(message) > 2000:
        return {
            "is_valid": False,
            "validation_error": "Message is too long. Please keep it under 2000 characters.",
            "error": "Message too long",
            "error_stage": "validate_input",
        }

    # Rate limit check (only for identified users)
    if user_id and not _check_rate_limit(user_id):
        return {
            "is_valid": False,
            "validation_error": "You're sending messages too quickly. Please wait a moment.",
            "error": "Rate limited",
            "error_stage": "validate_input",
        }

    return {"is_valid": True, "validation_error": None}


# ═══════════════════════════════════════════════════════════════
# NODE 2: ESCALATION CHECK (NEW)
# ═══════════════════════════════════════════════════════════════

async def escalation_check(state: ChatState) -> dict[str, Any]:
    """
    Check if the user's message signals distress, complexity,
    or a request for professional advice.
    """
    from app.compliance.escalation import detect_escalation

    message = state.get("user_message", "")
    result = detect_escalation(message)

    return {
        "escalation_level": result["level"],
        "escalation_signals": result["signals"],
        "escalation_prefix": result.get("response_prefix"),
    }


# ═══════════════════════════════════════════════════════════════
# NODE 3: FETCH CONTEXT
# ═══════════════════════════════════════════════════════════════

async def fetch_context(state: ChatState) -> dict[str, Any]:
    """
    Parallel fetch of persona, system prompt, and affiliates.
    Uses enriched persona with confidence gating when available.
    """
    import asyncio

    user_id = state.get("user_id")
    persona = {}
    default_prompt_cfg = await bot_config.get("bot_default_system_prompt")
    system_prompt = default_prompt_cfg.get("text", "") if isinstance(default_prompt_cfg, dict) else ""
    affiliates_context = ""

    try:
        # Parallel fetch
        tasks = []

        # Fetch persona (use enriched version with confidence gating)
        if user_id:
            from app.memory.persona import get_enriched_persona
            tasks.append(get_enriched_persona(user_id))
        else:
            async def _empty():
                return {}
            tasks.append(_empty())

        # Fetch system prompt
        tasks.append(repositories.get_system_setting("ai_prompt"))

        # Fetch affiliates
        tasks.append(repositories.get_active_affiliates())

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process persona
        if not isinstance(results[0], Exception) and results[0]:
            persona = results[0]
            # Apply DPDPA consent filtering
            if user_id:
                try:
                    from app.compliance.dpdpa import check_and_filter_persona
                    persona = await check_and_filter_persona(user_id, persona)
                except Exception as e:
                    logger.debug(f"DPDPA filter skipped: {e}")

        # Process system prompt
        if not isinstance(results[1], Exception) and results[1]:
            custom_prompt = results[1].get("text", "") if isinstance(results[1], dict) else ""
            if custom_prompt:
                system_prompt = custom_prompt

        # Process affiliates
        if not isinstance(results[2], Exception) and results[2]:
            affiliates = results[2]
            if affiliates:
                lines = [
                    "\nAVAILABLE PARTNER RECOMMENDATIONS (use when relevant, not required):"
                ]
                for aff in affiliates:
                    lines.append(f"- **{aff['name']}** ({aff.get('category', '')}): {aff.get('description', '')}")
                    if aff.get("chatbot_prompt"):
                        lines.append(f"  Guideline: {aff['chatbot_prompt']}")
                    lines.append(f"  URL: {aff['url']}")
                affiliates_context = "\n".join(lines)

    except Exception as e:
        logger.error(f"Context fetch error: {e}")
        # Continue with defaults — degraded but functional

    return {
        "persona": persona,
        "system_prompt": system_prompt,
        "affiliates_context": affiliates_context,
    }


# ═══════════════════════════════════════════════════════════════
# NODE 4: RAG SEARCH (with query expansion)
# ═══════════════════════════════════════════════════════════════

async def rag_search(state: ChatState) -> dict[str, Any]:
    """
    Run RAG pipeline with optional query expansion:
    1. Expand query (HyDE + multi-angle, skipped for simple queries)
    2. Embed expanded queries
    3. Search pgvector with all variants
    4. Deduplicate and rank results
    """
    message = state.get("user_message", "")

    try:
        # Try query expansion first
        from app.rag.query_expand import expand_query, is_simple_query

        if is_simple_query(message):
            # Simple query — direct search
            chunks = await embed_search.search(
                query=message,
                top_k=settings.rag_max_chunks,
            )
            query_count = 1
        else:
            # Complex query — expand and multi-search
            try:
                expanded = await expand_query(message)
                chunks = await embed_search.search_multi_query(
                    queries=expanded,
                    top_k=settings.rag_max_chunks,
                )
                query_count = len(expanded)
            except Exception as exp_err:
                # Expansion failed — fall back to single query
                logger.warning(f"Query expansion failed, using single query: {exp_err}")
                chunks = await embed_search.search(
                    query=message,
                    top_k=settings.rag_max_chunks,
                )
                query_count = 1

        logger.info(f"RAG found {len(chunks)} raw chunks (from {query_count} queries)")

        # Phase 2: Rerank + diversity filter
        try:
            from app.rag.reranker import rerank_chunks, diversify_chunks

            # Rerank with multi-signal scoring
            reranked = rerank_chunks(
                query=message,
                chunks=chunks,
                top_k=settings.rag_max_chunks * 2,  # Keep more for diversity pass
            )
            # Apply diversity filter
            final_chunks = diversify_chunks(reranked, max_per_source=2)
            # Trim to budget
            final_chunks = final_chunks[:settings.rag_max_chunks]

            logger.info(
                f"Reranker: {len(chunks)} → {len(reranked)} → {len(final_chunks)} chunks"
            )
            chunks = final_chunks
        except Exception as rr_err:
            logger.warning(f"Reranker failed, using raw chunks: {rr_err}")
            chunks = chunks[:settings.rag_max_chunks]

        return {
            "rag_chunks": chunks,
            "rag_query_count": query_count,
        }

    except Exception as e:
        logger.error(f"RAG search failed: {e}")
        # Graceful degradation — continue without RAG
        return {
            "rag_chunks": [],
            "rag_query_count": 0,
            "error": f"RAG unavailable: {str(e)}",
            "error_stage": "rag_search",
        }


# ═══════════════════════════════════════════════════════════════
# NODE 5: ASSEMBLE PROMPT
# ═══════════════════════════════════════════════════════════════

async def assemble(state: ChatState) -> dict[str, Any]:
    """
    Assemble the final prompt using persona, chunks, history, and compliance rules.
    Injects escalation prefix if needed.
    """
    # If escalation detected, modify the system prompt
    escalation_prefix = state.get("escalation_prefix")
    system_prompt = state.get("system_prompt", "")

    if escalation_prefix:
        # Add escalation instruction to system prompt
        escalation_level = state.get("escalation_level", "none")
        if escalation_level == "urgent":
            system_prompt += (
                "\n\nURGENT: The user appears to be in distress. "
                "Lead with empathy and provide helpline numbers. "
                "Do NOT provide financial advice in this response."
            )
        elif escalation_level == "recommend":
            system_prompt += (
                "\n\nIMPORTANT: This topic requires professional guidance. "
                "Provide general educational information but strongly recommend "
                "consulting a SEBI-registered adviser."
            )

    messages = assemble_prompt(
        system_prompt=system_prompt,
        persona=state.get("persona", {}),
        chunks=state.get("rag_chunks", []),
        history=state.get("history", []),
        user_message=state.get("user_message", ""),
        affiliates_context=state.get("affiliates_context", ""),
        include_disclaimer=True,
    )

    token_estimate = sum(estimate_tokens(m["content"]) for m in messages)

    return {
        "assembled_messages": messages,
        "token_estimate": token_estimate,
    }
