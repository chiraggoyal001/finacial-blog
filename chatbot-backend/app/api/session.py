"""
Session signal API — POST /api/session-signal

Receives browsing signals from the frontend (scroll depth, page views,
calculator usage, search queries) and stores them for the 48h context window.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.session.bridge import store_signal, build_context_window

logger = logging.getLogger(__name__)
router = APIRouter()


class SignalRequest(BaseModel):
    """Incoming session signal from the frontend."""
    user_id: str
    signal_type: str  # page_view | scroll_depth | calc_use | search | return_visit
    payload: dict = Field(default_factory=dict)


@router.post("/session-signal")
async def receive_signal(request: Request):
    """
    Store a browsing signal for the session context window.
    Called by the frontend scroll tracker, calculator widget, etc.
    """
    try:
        body = await request.json()
        signal = SignalRequest(**body)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        success = await store_signal(
            user_id=signal.user_id,
            signal_type=signal.signal_type,
            payload=signal.payload,
        )

        if success:
            return JSONResponse(content={"status": "stored"})
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid signal"},
            )
    except Exception as e:
        logger.error(f"Signal storage error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to store signal"},
        )


@router.get("/session-context/{user_id}")
async def get_session_context(user_id: str):
    """
    Get the 48-hour behavioral context window for a user.
    Used by the proactive nudge engine and for debugging.
    """
    try:
        context = await build_context_window(user_id)
        return JSONResponse(content=context)
    except Exception as e:
        logger.error(f"Context build error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to build context"},
        )
