"""
LangGraph state definition for the chat orchestration pipeline.
"""

from __future__ import annotations

from typing import Optional
from typing_extensions import TypedDict


class ChatState(TypedDict, total=False):
    """
    Shared state flowing through the LangGraph pipeline.
    
    Each node reads from and writes to this state.
    v2 flow: validate → escalation_check → fetch_context → rag_search → assemble → (stream)
    """

    # ── Input (set by API layer) ────────────────────────────────
    user_message: str
    session_id: str
    user_id: Optional[str]
    history: list[dict]          # [{role, content}, ...]
    article_slug: Optional[str]  # current page context

    # ── Validation ──────────────────────────────────────────────
    is_valid: bool
    validation_error: Optional[str]

    # ── Escalation (populated by escalation_check node) ─────────
    escalation_level: str        # none | suggest | recommend | urgent
    escalation_signals: list[str]
    escalation_prefix: Optional[str]  # response prefix for escalation

    # ── Context (populated by fetch_context node) ───────────────
    persona: dict                # user persona snapshot
    system_prompt: str           # from system_settings table
    affiliates_context: str      # affiliate links context

    # ── RAG (populated by rag_search node) ──────────────────────
    rag_chunks: list[dict]       # retrieved & ranked chunks
    rag_query_count: int         # number of queries used

    # ── Assembly (populated by assemble node) ───────────────────
    assembled_messages: list[dict]  # final messages for LLM
    token_estimate: int

    # ── Error handling ──────────────────────────────────────────
    error: Optional[str]
    error_stage: Optional[str]   # which node failed
