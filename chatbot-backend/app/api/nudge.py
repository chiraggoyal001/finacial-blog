"""
Nudge API — Proactive chat initiation endpoints.

- GET  /api/nudge/{user_id}  — Check if user should be nudged
- POST /api/nudge-dismiss     — Record nudge dismissal
- POST /api/nudge-engage      — Record nudge engagement
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.session.bridge import build_context_window
from app.proactive.engine import (
    calculate_nudge_score,
    should_suppress,
    get_threshold,
    generate_opener,
    log_nudge,
    log_nudge_response,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/nudge/{user_id}")
async def check_nudge(user_id: str):
    """
    Check if a proactive nudge should be shown to the user.
    
    Returns:
        {
            "should_nudge": bool,
            "score": float,
            "threshold": float,
            "opener_text": str,
            "nudge_type": str,
            "nudge_id": str | null,
        }
    """
    try:
        # Check suppression first (fast path)
        suppressed, reason = await should_suppress(user_id)
        if suppressed:
            return JSONResponse(content={
                "should_nudge": False,
                "reason": reason,
            })

        # Build context window
        context = await build_context_window(user_id)

        # Get adaptive threshold
        threshold = await get_threshold(user_id)

        # Calculate score
        score = calculate_nudge_score(context)

        if score < threshold:
            return JSONResponse(content={
                "should_nudge": False,
                "score": round(score, 3),
                "threshold": round(threshold, 3),
            })

        # Determine trigger type
        trigger_type = "general"
        if context.get("calculator_inputs"):
            trigger_type = "calc_use"
        elif any(v >= 2 for v in context.get("return_visits", {}).values()):
            trigger_type = "return_visit"
        elif context.get("articles_read"):
            trigger_type = "article_goal"

        # Generate opener
        opener = generate_opener(context, trigger_type)

        # Log the nudge
        nudge_id = await log_nudge(
            user_id=user_id,
            nudge_type=trigger_type,
            score=score,
            opener_text=opener,
        )

        return JSONResponse(content={
            "should_nudge": True,
            "score": round(score, 3),
            "threshold": round(threshold, 3),
            "opener_text": opener,
            "nudge_type": trigger_type,
            "nudge_id": nudge_id,
        })

    except Exception as e:
        logger.error(f"Nudge check error: {e}")
        return JSONResponse(content={"should_nudge": False, "error": str(e)})


class NudgeResponseRequest(BaseModel):
    nudge_id: str
    user_id: str


@router.post("/nudge-dismiss")
async def dismiss_nudge(request: Request):
    """Record that a user dismissed a nudge."""
    try:
        body = await request.json()
        req = NudgeResponseRequest(**body)
        await log_nudge_response(req.nudge_id, dismissed=True, engaged=False)
        return JSONResponse(content={"status": "recorded"})
    except Exception as e:
        logger.error(f"Nudge dismiss error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/nudge-engage")
async def engage_nudge(request: Request):
    """Record that a user engaged with a nudge (clicked/opened chat)."""
    try:
        body = await request.json()
        req = NudgeResponseRequest(**body)
        await log_nudge_response(req.nudge_id, dismissed=False, engaged=True)
        return JSONResponse(content={"status": "recorded"})
    except Exception as e:
        logger.error(f"Nudge engage error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
