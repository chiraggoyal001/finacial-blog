"""
Centralized Bot Configuration — fetches all bot management settings
from system_settings with a short TTL cache.

All backend modules that previously hardcoded prompts, rules, or templates
now call bot_config.get(key, fallback) instead.

Cache strategy:
- Bulk-fetches all 'bot_*' keys on first access
- Caches for 60 seconds (configurable)
- Cache is invalidated on admin update via invalidate()
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Default cache TTL in seconds
_CACHE_TTL = 60

# ── In-memory cache ────────────────────────────────────────────
_cache: dict[str, Any] = {}
_cache_timestamp: float = 0.0
_cache_loaded: bool = False


# ══════════════════════════════════════════════════════════════
# HARDCODED DEFAULTS — used as fallback when DB has no value
# ══════════════════════════════════════════════════════════════

DEFAULTS: dict[str, Any] = {
    "bot_default_system_prompt": {
        "text": (
            "You are Gyaan, a friendly and knowledgeable financial literacy "
            "assistant for an Indian finance education blog. You help users "
            "understand personal finance, investing, taxation, and money "
            "management in the Indian context. Be warm, clear, and educational."
        ),
    },
    "bot_compliance_rules": {
        "rules": [
            "Never provide specific investment advice or guaranteed returns.",
            "Never use words like 'guaranteed', 'risk-free', 'assured returns'.",
            "Always clarify that information is educational, not personalized advice.",
            "If asked about specific stocks/funds to buy, redirect to a SEBI-registered adviser.",
            "Never fabricate financial data, statistics, or regulatory information.",
            "If you're unsure, say so honestly rather than guessing.",
        ],
    },
    "bot_sebi_disclaimer": {
        "text": (
            "\n\n---\n"
            "⚠️ **Disclaimer**: This information is for educational purposes only "
            "and does not constitute financial advice. Please consult a SEBI-registered "
            "investment adviser before making investment decisions."
        ),
    },
    "bot_blocked_phrases": {
        "patterns": [
            "guaranteed returns",
            "risk-free",
            "assured returns",
            "100% safe",
            "no risk",
            "certain profit",
            "sure-shot",
            "doubt-free",
            "can't lose",
            "will definitely go up",
        ],
    },
    "bot_advice_patterns": {
        "patterns": [
            "you should buy",
            "you should sell",
            "you should invest in",
            "I recommend buying",
            "I recommend selling",
            "I recommend investing",
            "buy this stock",
            "buy this fund",
            "sell this stock",
            "sell this fund",
            "invest all your money in",
            "this is the best investment",
            "this is the best stock",
            "this is the best fund",
        ],
    },
    "bot_escalation_responses": {
        "urgent": (
            "🆘 I can see you're going through a very difficult time. "
            "Please reach out to these helplines immediately:\n\n"
            "📞 **iCall**: 9152987821\n"
            "📞 **Vandrevala Foundation**: 1860-2662-345\n"
            "📞 **AASRA**: 9820466726\n\n"
            "For your financial situation, I strongly recommend speaking with "
            "a qualified financial adviser who can provide personalized guidance.\n\n"
        ),
        "recommend": (
            "This sounds like a situation where professional guidance would be really valuable. "
            "I'd recommend connecting with a SEBI-registered investment adviser or a certified "
            "financial planner (CFP) who can review your specific circumstances.\n\n"
        ),
        "suggest": (
            "💡 For a decision of this complexity, you might benefit from consulting "
            "a qualified financial adviser. I can share some general information, "
            "but personalized advice requires understanding your full financial picture.\n\n"
        ),
    },
    "bot_nudge_templates": {
        "article_goal": (
            "I noticed you've been reading about {topic}. Would you like me to help "
            "you understand how this applies to your financial goals?"
        ),
        "calc_use": (
            "I see you were exploring the {calc_type} calculator. Would you like me "
            "to explain what those numbers mean for your situation?"
        ),
        "return_visit": (
            "You've visited '{article_title}' a few times. Is there something specific "
            "about {topic} you'd like to discuss?"
        ),
        "deadline": "Tax filing season is approaching! Would you like some guidance on {topic}?",
        "general": (
            "Hi! Based on your recent reading, I thought I might be able to help with "
            "some financial questions. What would you like to know?"
        ),
    },
    "bot_fallback_response": {
        "text": (
            "I'm experiencing technical difficulties right now. Here are some helpful resources:\n\n"
            "📚 **Modules** — Check out our learning modules for structured courses\n"
            "📰 **Newsletter** — Subscribe to our newsletter for weekly updates\n"
            "🎓 **Junior Section** — Fun financial lessons for young learners\n"
            "📅 **Events** — Join our community events and bootcamps\n\n"
            "Please try again in a few moments!"
        ),
    },
}


# ══════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════

async def get(key: str, fallback: Any = None) -> Any:
    """
    Get a bot configuration value.

    Priority:
    1. Cached DB value (if fresh)
    2. Fresh DB fetch (if cache expired)
    3. Hardcoded default from DEFAULTS
    4. Provided fallback parameter
    """
    global _cache, _cache_timestamp, _cache_loaded

    # Check if cache needs refresh
    now = time.time()
    if not _cache_loaded or (now - _cache_timestamp) > _CACHE_TTL:
        await _refresh_cache()

    # Return from cache, or fall back
    if key in _cache:
        return _cache[key]

    # Fall back to hardcoded defaults
    if key in DEFAULTS:
        return DEFAULTS[key]

    return fallback


def get_sync(key: str, fallback: Any = None) -> Any:
    """
    Synchronous access to cached config. Returns cached value or default.
    Does NOT trigger a DB fetch — use this only when you know the cache
    has been populated (e.g., after startup or after an async get() call).
    """
    if key in _cache:
        return _cache[key]
    if key in DEFAULTS:
        return DEFAULTS[key]
    return fallback


async def get_text(key: str, field: str = "text", fallback: str = "") -> str:
    """
    Convenience: get a text field from a bot config dict.
    e.g., await get_text("bot_sebi_disclaimer") → the disclaimer string
    """
    val = await get(key)
    if isinstance(val, dict):
        return val.get(field, fallback)
    return fallback


async def get_list(key: str, field: str = "patterns", fallback: list | None = None) -> list:
    """
    Convenience: get a list field from a bot config dict.
    e.g., await get_list("bot_blocked_phrases") → ["guaranteed returns", ...]
    """
    val = await get(key)
    if isinstance(val, dict):
        return val.get(field, fallback or [])
    return fallback or []


def invalidate() -> None:
    """Invalidate the cache so the next get() triggers a fresh DB fetch."""
    global _cache_loaded, _cache_timestamp
    _cache_loaded = False
    _cache_timestamp = 0.0
    logger.info("Bot config cache invalidated")


# ══════════════════════════════════════════════════════════════
# INTERNAL
# ══════════════════════════════════════════════════════════════

async def _refresh_cache() -> None:
    """Bulk-fetch all bot_* settings from system_settings."""
    global _cache, _cache_timestamp, _cache_loaded

    try:
        from app.db.connection import get_pool
        pool = get_pool()

        rows = await pool.fetch(
            "SELECT key, value FROM system_settings WHERE key LIKE 'bot_%'"
        )

        new_cache: dict[str, Any] = {}
        for row in rows:
            val = row["value"]
            if not isinstance(val, dict):
                try:
                    val = json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    val = {"text": str(val)}
            new_cache[row["key"]] = val

        _cache = new_cache
        _cache_timestamp = time.time()
        _cache_loaded = True

        logger.debug(f"Bot config cache refreshed: {len(new_cache)} keys loaded")

    except Exception as e:
        logger.warning(f"Bot config cache refresh failed (using defaults): {e}")
        # Mark as loaded with empty cache so we don't hammer the DB
        _cache_loaded = True
        _cache_timestamp = time.time()
