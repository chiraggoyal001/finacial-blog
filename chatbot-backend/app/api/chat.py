"""
Chat API endpoint — POST /api/chat

Handles both SSE streaming and non-streaming responses.
Runs the LangGraph pipeline, then streams Gemini's response via SSE.

Flow:
1. Parse request
2. Run LangGraph (validate → fetch_context → RAG → assemble)
3. Stream LLM response via SSE
4. Run compliance check on complete response
5. Save message to database
"""

from __future__ import annotations

import json
import logging
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import settings
from app.graph.builder import get_graph
from app.graph.state import ChatState
from app.compliance.sebi import full_compliance_check
from app.db import repositories
from app.models.chat import ChatRequest
from app import bot_config

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Circuit Breaker (Phase 1 — simple in-memory) ───────────────
_failure_count = 0
_FAILURE_THRESHOLD = 5
_circuit_open = False
_last_failure_time = 0.0

# Static FAQ fallback (loaded from admin config)
def _get_fallback_response() -> str:
    """Get the circuit-breaker fallback response from admin config."""
    cfg = bot_config.get_sync("bot_fallback_response")
    if isinstance(cfg, dict) and cfg.get("text"):
        return cfg["text"]
    return bot_config.DEFAULTS["bot_fallback_response"]["text"]


def _get_llm() -> ChatGoogleGenerativeAI:
    """Get the LLM instance with circuit breaker logic."""
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        streaming=True,
        temperature=0.7,
        max_output_tokens=1024,
    )


async def _stream_llm_response(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Stream tokens from Gemini via LangChain.
    Yields individual text chunks.
    """
    global _failure_count, _circuit_open, _last_failure_time
    import time

    # Circuit breaker check
    if _circuit_open:
        elapsed = time.time() - _last_failure_time
        if elapsed < 30:  # 30s recovery window
            yield _get_fallback_response()
            return
        else:
            _circuit_open = False  # HALF_OPEN — try again
            _failure_count = 0

    try:
        llm = _get_llm()

        # Convert dict messages to LangChain message objects
        lc_messages = []
        for msg in messages:
            if msg["role"] in ("system",):
                lc_messages.append(SystemMessage(content=msg["content"]))
            elif msg["role"] in ("user",):
                lc_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] in ("model", "assistant"):
                lc_messages.append(AIMessage(content=msg["content"]))

        # Stream tokens
        async for chunk in llm.astream(lc_messages):
            content = chunk.content
            if content:
                if isinstance(content, list):
                    for part in content:
                        if isinstance(part, dict):
                            if part.get("type") == "text" and part.get("text"):
                                yield part["text"]
                        elif isinstance(part, str):
                            yield part
                elif isinstance(content, str):
                    yield content

        # Success — reset circuit breaker
        _failure_count = 0

    except Exception as e:
        logger.error(f"LLM streaming error: {e}")
        _failure_count += 1
        if _failure_count >= _FAILURE_THRESHOLD:
            _circuit_open = True
            _last_failure_time = time.time()
            logger.critical(f"Circuit breaker OPEN after {_failure_count} failures")

        yield _get_fallback_response()


# ═══════════════════════════════════════════════════════════════
# POST /api/chat — SSE Streaming Endpoint
# ═══════════════════════════════════════════════════════════════

@router.post("/chat")
async def chat_endpoint(request: Request):
    """
    Main chat endpoint. Accepts a ChatRequest, runs the full pipeline,
    and returns an SSE stream of tokens.

    SSE Events:
    - event: token   → data: "text chunk"
    - event: done    → data: {session_id, sources, compliance_flags}
    - event: error   → data: "error message"
    """
    client_platform = request.headers.get("x-client-platform")
    user_agent = request.headers.get("user-agent", "").lower()
    
    if client_platform != "Web-Kamada-Human":
        return JSONResponse(
            status_code=403,
            content={"error": "Access denied: Invalid origin verification."},
        )
        
    bot_keywords = [
        "gptbot", "chatgpt", "claudebot", "claude-web", "google-extended",
        "applebot-extended", "perplexitybot", "cohere-cohere-ai", "facebookbot",
        "bytesspider", "python-requests", "curl", "wget", "httpclient"
    ]
    if any(keyword in user_agent for keyword in bot_keywords):
        return JSONResponse(
            status_code=403,
            content={"error": "Access denied: Automated agents are not permitted to use the chatbot API."},
        )

    try:
        body = await request.json()
        chat_req = ChatRequest(**body)
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid request: {str(e)}"},
        )

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            # ── Step 1: Create or continue session ──────────────
            session_id = chat_req.session_id
            if not session_id:
                try:
                    session_id = await repositories.create_chat_session(
                        user_id=chat_req.user_id,
                        session_type="reactive",
                    )
                except Exception as e:
                    logger.error(f"Session creation failed: {e}")
                    session_id = "temp-session"

            # Save user message
            try:
                await repositories.save_chat_message(
                    session_id=session_id,
                    role="user",
                    content=chat_req.message,
                )
            except Exception as e:
                logger.error(f"Message save failed: {e}")

            # ── Step 2: Run LangGraph pipeline ──────────────────
            graph = get_graph()

            # Build history from request
            history = [
                {"role": m.role, "content": m.content}
                for m in chat_req.history
            ]

            initial_state: ChatState = {
                "user_message": chat_req.message,
                "session_id": session_id,
                "user_id": chat_req.user_id,
                "history": history,
                "article_slug": chat_req.article_slug,
            }

            result = await graph.ainvoke(initial_state)

            # Check validation result
            if result.get("is_valid") is False:
                yield {
                    "event": "error",
                    "data": result.get("validation_error", "Invalid message"),
                }
                return

            # ── Step 3: Stream escalation prefix if present ────
            escalation_prefix = result.get("escalation_prefix")
            full_response = ""
            
            if escalation_prefix:
                full_response += escalation_prefix
                yield {
                    "event": "token",
                    "data": escalation_prefix,
                }

            # ── Step 4: Stream LLM response ─────────────────────
            assembled_messages = result.get("assembled_messages", [])
            if not assembled_messages:
                yield {
                    "event": "error",
                    "data": "Failed to prepare your question. Please try again.",
                }
                return

            async for token in _stream_llm_response(assembled_messages):
                full_response += token
                yield {
                    "event": "token",
                    "data": token,
                }

            # ── Step 5: Compliance + Hallucination check ────────
            sanitized_response, compliance_flags = full_compliance_check(full_response)

            # Hallucination guard — check numerical claims
            try:
                from app.compliance.hallucination import check_hallucination
                hall_result = check_hallucination(
                    full_response,
                    result.get("rag_chunks", []),
                )
                compliance_flags["hallucination_check"] = {
                    "passed": hall_result["passed"],
                    "claims_found": hall_result["claims_found"],
                    "unverified_count": hall_result["unverified_count"],
                }
                if not hall_result["passed"]:
                    sanitized_response = hall_result["sanitized_text"]
            except Exception as e:
                logger.warning(f"Hallucination check failed (continuing): {e}")

            # Add escalation level to flags
            escalation_level = result.get("escalation_level", "none")
            if escalation_level != "none":
                compliance_flags["escalation"] = {
                    "level": escalation_level,
                    "signals": result.get("escalation_signals", []),
                }

            # If compliance modified the response, send the difference
            if sanitized_response != full_response:
                diff = sanitized_response[len(full_response):]
                if diff:
                    yield {
                        "event": "token",
                        "data": diff,
                    }
                full_response = sanitized_response

            # ── Step 6: Save bot response ───────────────────────
            try:
                await repositories.save_chat_message(
                    session_id=session_id,
                    role="assistant",
                    content=full_response,
                    model_used=settings.gemini_model,
                    compliance_flags=compliance_flags,
                )
            except Exception as e:
                logger.error(f"Bot message save failed: {e}")

            # ── Step 7: Background persona enrichment ───────────
            if chat_req.user_id:
                try:
                    from app.memory.persona import enrich_from_message
                    await enrich_from_message(
                        chat_req.user_id,
                        chat_req.message,
                        full_response,
                    )
                except Exception as e:
                    logger.debug(f"Persona enrichment skipped: {e}")

            # ── Step 8: Send completion event ───────────────────
            sources = []
            for chunk in result.get("rag_chunks", []):
                sources.append({
                    "doc_title": chunk.get("doc_title", ""),
                    "source_url": chunk.get("source_url", ""),
                    "namespace": chunk.get("namespace", ""),
                    "relevance_score": chunk.get("similarity_score", 0),
                })

            yield {
                "event": "done",
                "data": json.dumps({
                    "session_id": session_id,
                    "sources": sources,
                    "compliance_flags": compliance_flags,
                    "escalation_level": escalation_level,
                }),
            }

        except Exception as e:
            logger.exception(f"Chat pipeline error: {e}")
            yield {
                "event": "error",
                "data": "Sorry, something went wrong. Please try again.",
            }

    return EventSourceResponse(event_generator())


# ═══════════════════════════════════════════════════════════════
# POST /api/chat/sync — Non-streaming fallback
# ═══════════════════════════════════════════════════════════════

@router.post("/chat/sync")
async def chat_sync_endpoint(request: Request):
    """
    Non-streaming chat endpoint. Returns the full response at once.
    Used as a fallback when SSE is not supported.
    """
    client_platform = request.headers.get("x-client-platform")
    user_agent = request.headers.get("user-agent", "").lower()
    
    if client_platform != "Web-Kamada-Human":
        return JSONResponse(
            status_code=403,
            content={"error": "Access denied: Invalid origin verification."},
        )
        
    bot_keywords = [
        "gptbot", "chatgpt", "claudebot", "claude-web", "google-extended",
        "applebot-extended", "perplexitybot", "cohere-cohere-ai", "facebookbot",
        "bytesspider", "python-requests", "curl", "wget", "httpclient"
    ]
    if any(keyword in user_agent for keyword in bot_keywords):
        return JSONResponse(
            status_code=403,
            content={"error": "Access denied: Automated agents are not permitted to use the chatbot API."},
        )

    try:
        body = await request.json()
        chat_req = ChatRequest(**body)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        graph = get_graph()
        history = [{"role": m.role, "content": m.content} for m in chat_req.history]

        result = await graph.ainvoke({
            "user_message": chat_req.message,
            "session_id": chat_req.session_id or "temp",
            "user_id": chat_req.user_id,
            "history": history,
            "article_slug": chat_req.article_slug,
        })

        if result.get("is_valid") is False:
            return JSONResponse(
                status_code=400,
                content={"error": result.get("validation_error")},
            )

        # Generate full response
        full_response = ""
        async for token in _stream_llm_response(result.get("assembled_messages", [])):
            full_response += token

        sanitized, flags = full_compliance_check(full_response)

        return JSONResponse(content={
            "response": sanitized,
            "session_id": chat_req.session_id or "temp",
            "compliance_flags": flags,
        })

    except Exception as e:
        logger.exception(f"Sync chat error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"},
        )


# ═══════════════════════════════════════════════════════════════
# POST /api/chat/feedback — Message feedback (like/dislike)
# ═══════════════════════════════════════════════════════════════

@router.post("/chat/feedback")
async def chat_feedback(request: Request):
    """
    Record like/dislike feedback on a bot message.
    Used to improve response quality over time.
    """
    try:
        body = await request.json()
        message_id = body.get("message_id")
        feedback = body.get("feedback")  # "like" or "dislike"
        session_id = body.get("session_id")
        user_id = body.get("user_id")

        if not message_id or feedback not in ("like", "dislike"):
            return JSONResponse(
                status_code=400,
                content={"error": "message_id and feedback (like/dislike) required"},
            )

        # Store feedback in compliance_audit for now
        # (Phase 2 will have a dedicated feedback table)
        try:
            from app.db.connection import get_pool
            import uuid as _uuid

            pool = get_pool()
            await pool.execute(
                """
                INSERT INTO compliance_audit (id, session_id, check_type, result, details)
                VALUES ($1, $2, 'user_feedback', $3, $4)
                """,
                _uuid.uuid4(),
                _uuid.UUID(session_id) if session_id and session_id != "temp-session" else None,
                feedback,
                json.dumps({
                    "message_id": message_id,
                    "user_id": user_id,
                    "feedback_type": feedback,
                }),
            )
        except Exception as e:
            logger.warning(f"Feedback storage failed (non-critical): {e}")

        return JSONResponse(content={"status": "recorded"})

    except Exception as e:
        logger.error(f"Feedback error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ═══════════════════════════════════════════════════════════════
# Consent Management — DPDPA
# ═══════════════════════════════════════════════════════════════

@router.get("/consent/{user_id}")
async def get_consent(user_id: str):
    """Get user's current consent status for all data categories."""
    try:
        from app.compliance.dpdpa import get_user_consent, DATA_CATEGORIES

        consent = await get_user_consent(user_id)
        categories = {
            cat: {
                **info,
                "consented": consent.get(cat, False),
            }
            for cat, info in DATA_CATEGORIES.items()
        }
        return JSONResponse(content={"categories": categories})
    except Exception as e:
        logger.error(f"Consent fetch error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/consent")
async def update_consent(request: Request):
    """Update consent for a data category."""
    try:
        body = await request.json()
        user_id = body.get("user_id")
        category = body.get("category")
        granted = body.get("granted", True)

        if not user_id or not category:
            return JSONResponse(status_code=400, content={"error": "user_id and category required"})

        from app.compliance.dpdpa import grant_consent, withdraw_consent

        if granted:
            success = await grant_consent(user_id, category)
        else:
            success = await withdraw_consent(user_id, category)

        return JSONResponse(content={"status": "updated" if success else "failed"})

    except Exception as e:
        logger.error(f"Consent update error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
