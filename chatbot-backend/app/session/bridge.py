"""
Session Context Bridge — Layer 1 from the architecture diagram.

Collects browsing signals from the frontend and builds a 48-hour
behavioral context window for personalization and proactive nudging.

Signal types:
- page_view: article slug + read depth + time on page
- calc_use: calculator inputs (amount, rate, years)
- search: search queries (≥3 words only)
- return_visit: repeated visits to the same article
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from app.db.connection import get_pool

logger = logging.getLogger(__name__)

# ── Signal Validation ───────────────────────────────────────────

VALID_SIGNAL_TYPES = {"page_view", "scroll_depth", "calc_use", "search", "return_visit"}


def validate_signal(signal_type: str, payload: dict) -> bool:
    """Validate that a signal has the required fields."""
    if signal_type not in VALID_SIGNAL_TYPES:
        return False

    if signal_type == "page_view":
        return bool(payload.get("slug"))

    if signal_type == "scroll_depth":
        depth = payload.get("depth", 0)
        return isinstance(depth, (int, float)) and 0 <= depth <= 100

    if signal_type == "calc_use":
        return bool(payload.get("calculator_type"))

    if signal_type == "search":
        query = payload.get("query", "")
        return len(query.split()) >= 3  # Only capture meaningful searches

    if signal_type == "return_visit":
        return bool(payload.get("slug"))

    return False


# ── Signal Storage ──────────────────────────────────────────────

async def store_signal(user_id: str, signal_type: str, payload: dict) -> bool:
    """Store a validated session signal."""
    if not validate_signal(signal_type, payload):
        logger.warning(f"Invalid signal rejected: type={signal_type}, payload={payload}")
        return False

    import json
    import uuid

    pool = get_pool()
    try:
        await pool.execute(
            """
            INSERT INTO session_signals (id, user_id, signal_type, payload)
            VALUES ($1, $2, $3, $4)
            """,
            uuid.uuid4(),
            uuid.UUID(user_id),
            signal_type,
            json.dumps(payload),
        )
        return True
    except Exception as e:
        logger.error(f"Failed to store signal: {e}")
        return False


# ── 48-Hour Context Window ──────────────────────────────────────

async def build_context_window(user_id: str) -> dict:
    """
    Build the 48-hour behavioral context window for a user.

    Returns:
        {
            "articles_read": [{"slug": ..., "depth": ..., "time_spent": ...}],
            "avg_depth": float,
            "calculator_inputs": [{"type": ..., "inputs": ...}],
            "search_queries": [...],
            "return_visits": {"slug": count},
            "total_sessions": int,
            "window_hours": 48,
        }
    """
    import json

    pool = get_pool()
    cutoff = datetime.utcnow() - timedelta(hours=48)

    rows = await pool.fetch(
        """
        SELECT signal_type, payload, created_at
        FROM session_signals
        WHERE user_id = $1 AND created_at > $2
        ORDER BY created_at ASC
        """,
        __import__("uuid").UUID(user_id),
        cutoff,
    )

    articles_read: list[dict] = []
    calculator_inputs: list[dict] = []
    search_queries: list[str] = []
    return_visits: dict[str, int] = {}

    for row in rows:
        sig_type = row["signal_type"]
        payload = row["payload"] if isinstance(row["payload"], dict) else json.loads(row["payload"])

        if sig_type == "page_view":
            articles_read.append({
                "slug": payload.get("slug"),
                "depth": payload.get("depth", 0),
                "time_spent": payload.get("time_spent", 0),
                "tags": payload.get("tags", []),
            })

        elif sig_type == "scroll_depth":
            # Update the most recent article read depth
            slug = payload.get("slug")
            for article in reversed(articles_read):
                if article["slug"] == slug:
                    article["depth"] = max(article["depth"], payload.get("depth", 0))
                    break

        elif sig_type == "calc_use":
            calculator_inputs.append({
                "type": payload.get("calculator_type"),
                "inputs": payload.get("inputs", {}),
                "result": payload.get("result"),
            })

        elif sig_type == "search":
            query = payload.get("query", "")
            if query and query not in search_queries:
                search_queries.append(query)

        elif sig_type == "return_visit":
            slug = payload.get("slug", "")
            return_visits[slug] = return_visits.get(slug, 0) + 1

    # Calculate average read depth
    depths = [a["depth"] for a in articles_read if a["depth"] > 0]
    avg_depth = sum(depths) / len(depths) if depths else 0.0

    return {
        "articles_read": articles_read,
        "avg_depth": round(avg_depth, 1),
        "calculator_inputs": calculator_inputs,
        "search_queries": search_queries,
        "return_visits": return_visits,
        "total_sessions": len(articles_read),
        "window_hours": 48,
    }


# ── Read Validation ─────────────────────────────────────────────

def is_valid_read(depth: float, time_seconds: int, velocity_px_s: float = 0) -> bool:
    """
    Determine if a page view counts as a 'valid read'.
    Criteria from architecture:
    - read_depth ≥ 60% AND time ≥ 90 seconds
    - scroll_velocity < 400px/s (reading, not skimming)
    """
    if depth < 60:
        return False
    if time_seconds < 90:
        return False
    if velocity_px_s > 0 and velocity_px_s >= 400:
        return False  # Scrolling too fast — skimming
    return True
