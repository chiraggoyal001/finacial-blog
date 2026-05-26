"""
Bot Initiation Engine — Proactive nudge scoring and opener generation.

Scores user context signals to decide whether to proactively 
initiate a chat. Uses the scoring weights from the architecture:

  article→goal: +0.25
  calc_use:     +0.20
  return_visit: +0.20
  deadline:     +0.15
  dismiss_history: -0.30
  daily_sent: BLOCK
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from app.db.connection import get_pool
from app import bot_config

logger = logging.getLogger(__name__)

# ── Scoring Weights ─────────────────────────────────────────────

SCORE_WEIGHTS = {
    "article_goal_match": 0.25,
    "calc_use": 0.20,
    "return_visit": 0.20,
    "deadline_proximity": 0.15,
    "deep_read": 0.10,
    "search_activity": 0.10,
}

PENALTY_WEIGHTS = {
    "dismiss_history": -0.30,
    "recent_nudge": -0.20,
}

# Default threshold — lower = more nudges, higher = fewer
DEFAULT_THRESHOLD = 0.50
DAILY_NUDGE_LIMIT = 3
COOLDOWN_HOURS = 72  # After dismiss


# ── Nudge Scoring ───────────────────────────────────────────────

def calculate_nudge_score(context: dict, dismiss_count_7d: int = 0) -> float:
    """
    Calculate a nudge score from 0.0 to 1.0 based on user context.
    
    Args:
        context: The 48h session context window from bridge.build_context_window()
        dismiss_count_7d: Number of nudge dismissals in the last 7 days
    
    Returns:
        Score between 0.0 and 1.0
    """
    score = 0.0

    # Article → Goal match
    articles = context.get("articles_read", [])
    if articles:
        # Check if articles have tags that match financial goals
        goal_tags = {"investing", "tax", "insurance", "retirement", "mutual-funds", "sip", "savings"}
        article_tags = set()
        for article in articles:
            for tag in article.get("tags", []):
                if isinstance(tag, str):
                    article_tags.add(tag.lower())
                elif isinstance(tag, dict):
                    article_tags.add(tag.get("name", "").lower())
        
        goal_overlap = article_tags & goal_tags
        if goal_overlap:
            score += SCORE_WEIGHTS["article_goal_match"]

    # Calculator use
    calc_inputs = context.get("calculator_inputs", [])
    if calc_inputs:
        score += SCORE_WEIGHTS["calc_use"]

    # Return visits (same article visited 2+ times)
    return_visits = context.get("return_visits", {})
    if any(count >= 2 for count in return_visits.values()):
        score += SCORE_WEIGHTS["return_visit"]

    # Deep reading (avg depth > 60%)
    avg_depth = context.get("avg_depth", 0)
    if avg_depth >= 60:
        score += SCORE_WEIGHTS["deep_read"]

    # Search activity (3+ searches)
    searches = context.get("search_queries", [])
    if len(searches) >= 3:
        score += SCORE_WEIGHTS["search_activity"]

    # Deadline proximity (tax season, etc.)
    now = datetime.utcnow()
    # Indian tax deadlines: March 31 (FY end), July 31 (ITR filing)
    tax_deadlines = [
        datetime(now.year, 3, 31),
        datetime(now.year, 7, 31),
    ]
    for deadline in tax_deadlines:
        days_until = (deadline - now).days
        if 0 < days_until <= 30:
            score += SCORE_WEIGHTS["deadline_proximity"]
            break

    # Penalties
    if dismiss_count_7d > 0:
        score += PENALTY_WEIGHTS["dismiss_history"] * min(dismiss_count_7d, 3)

    # Clamp to [0, 1]
    return max(0.0, min(1.0, score))


# ── Suppression Checks ─────────────────────────────────────────

async def should_suppress(user_id: str) -> tuple[bool, str]:
    """
    Check if nudge should be suppressed for this user.
    
    Returns:
        (should_suppress: bool, reason: str)
    """
    pool = get_pool()
    uid = uuid.UUID(user_id)

    # Check daily limit
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily_count = await pool.fetchval(
        """
        SELECT COUNT(*) FROM nudge_log
        WHERE user_id = $1 AND shown_at >= $2
        """,
        uid,
        today_start,
    )
    if daily_count and daily_count >= DAILY_NUDGE_LIMIT:
        return True, "daily_limit_reached"

    # Check cooldown after dismissal
    last_dismiss = await pool.fetchrow(
        """
        SELECT shown_at FROM nudge_log
        WHERE user_id = $1 AND dismissed = true
        ORDER BY shown_at DESC
        LIMIT 1
        """,
        uid,
    )
    if last_dismiss:
        cooldown_end = last_dismiss["shown_at"] + timedelta(hours=COOLDOWN_HOURS)
        if datetime.utcnow() < cooldown_end.replace(tzinfo=None):
            return True, f"cooldown_until_{cooldown_end.isoformat()}"

    return False, ""


# ── Adaptive Threshold ──────────────────────────────────────────

async def get_threshold(user_id: str) -> float:
    """
    Get the adaptive nudge threshold for a user.
    Based on their 7-day dismissal rate.
    """
    pool = get_pool()
    uid = uuid.UUID(user_id)
    cutoff = datetime.utcnow() - timedelta(days=7)

    row = await pool.fetchrow(
        """
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE dismissed = true) as dismissed
        FROM nudge_log
        WHERE user_id = $1 AND shown_at >= $2
        """,
        uid,
        cutoff,
    )

    if not row or row["total"] == 0:
        return DEFAULT_THRESHOLD

    dismiss_rate = row["dismissed"] / row["total"]

    # Higher dismiss rate → higher threshold (harder to trigger)
    adjusted = DEFAULT_THRESHOLD + (dismiss_rate * 0.3)
    return min(0.90, adjusted)


# ── Opener Generation ───────────────────────────────────────────

# ── Hardcoded default templates (fallback) ──────────────────────

_DEFAULT_OPENER_TEMPLATES = {
    "article_goal": "I noticed you've been reading about {topic}. Would you like me to help you understand how this applies to your financial goals?",
    "calc_use": "I see you were exploring the {calc_type} calculator. Would you like me to explain what those numbers mean for your situation?",
    "return_visit": "You've visited '{article_title}' a few times. Is there something specific about {topic} you'd like to discuss?",
    "deadline": "Tax filing season is approaching! Would you like some guidance on {topic}?",
    "general": "Hi! Based on your recent reading, I thought I might be able to help with some financial questions. What would you like to know?",
}


def _get_opener_templates() -> dict:
    """Get nudge opener templates from admin config."""
    cfg = bot_config.get_sync("bot_nudge_templates")
    if isinstance(cfg, dict) and any(k in cfg for k in _DEFAULT_OPENER_TEMPLATES):
        # Merge admin config with defaults (so missing keys still work)
        merged = {**_DEFAULT_OPENER_TEMPLATES, **cfg}
        return merged
    return _DEFAULT_OPENER_TEMPLATES


def generate_opener(context: dict, trigger_type: str = "general") -> str:
    """Generate a contextual opener message for proactive chat."""
    templates = _get_opener_templates()
    template = templates.get(trigger_type, templates.get("general", ""))

    # Extract context for template filling
    topic = "personal finance"
    article_title = ""
    calc_type = "financial"

    articles = context.get("articles_read", [])
    if articles:
        last_article = articles[-1]
        tags = last_article.get("tags", [])
        if tags:
            tag = tags[0]
            topic = tag if isinstance(tag, str) else tag.get("name", topic)
        article_title = last_article.get("slug", "").replace("-", " ")

    calc_inputs = context.get("calculator_inputs", [])
    if calc_inputs:
        calc_type = calc_inputs[-1].get("type", "financial")

    return template.format(
        topic=topic,
        article_title=article_title,
        calc_type=calc_type,
    )


# ── Log Nudge ───────────────────────────────────────────────────

async def log_nudge(
    user_id: str,
    nudge_type: str,
    score: float,
    opener_text: str,
    session_id: Optional[str] = None,
) -> str:
    """Log a nudge event and return the nudge ID."""
    pool = get_pool()
    nudge_id = uuid.uuid4()

    await pool.execute(
        """
        INSERT INTO nudge_log (id, user_id, nudge_type, score, opener_text, session_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        nudge_id,
        uuid.UUID(user_id),
        nudge_type,
        score,
        opener_text,
        uuid.UUID(session_id) if session_id else None,
    )
    return str(nudge_id)


async def log_nudge_response(nudge_id: str, dismissed: bool, engaged: bool) -> None:
    """Update a nudge log with user response."""
    pool = get_pool()
    await pool.execute(
        """
        UPDATE nudge_log SET dismissed = $1, engaged = $2
        WHERE id = $3
        """,
        dismissed,
        engaged,
        uuid.UUID(nudge_id),
    )
