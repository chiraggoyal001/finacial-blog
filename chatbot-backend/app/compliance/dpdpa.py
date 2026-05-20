"""
DPDPA Consent Checker — Digital Personal Data Protection Act compliance.

Ensures the bot only uses data categories the user has explicitly consented to.
Phase 1: Simple opt-in/opt-out tracking.
Phase 3: Granular field-level consent with purpose limitation.

Data categories:
- browsing: page views, scroll depth, time on page
- financial: calculator inputs, investment preferences
- personal: name, age, region, profession
- behavioral: reading patterns, engagement metrics
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from app.db.connection import get_pool

logger = logging.getLogger(__name__)

# Data categories and their descriptions (shown to user)
DATA_CATEGORIES = {
    "browsing": {
        "label": "Browsing Activity",
        "description": "Pages visited, scroll depth, time spent on articles",
        "purpose": "Personalize content recommendations and proactive suggestions",
        "required": False,
    },
    "financial": {
        "label": "Financial Interests",
        "description": "Calculator inputs, investment topics discussed in chat",
        "purpose": "Provide relevant financial education and product suggestions",
        "required": False,
    },
    "personal": {
        "label": "Profile Information",
        "description": "Name, age, region, profession from your profile",
        "purpose": "Personalize responses to your life stage and context",
        "required": False,
    },
    "behavioral": {
        "label": "Engagement Patterns",
        "description": "Reading patterns, return visits, topic preferences",
        "purpose": "Improve proactive nudge relevance and timing",
        "required": False,
    },
    "chat_history": {
        "label": "Chat History",
        "description": "Previous conversations with the chatbot",
        "purpose": "Maintain conversation context and improve responses",
        "required": True,  # Required for basic functionality
    },
}

CURRENT_CONSENT_VERSION = "1.0"


async def get_user_consent(user_id: str) -> dict[str, bool]:
    """
    Get the user's current consent status for each data category.
    
    Returns:
        {"browsing": True, "financial": False, ...}
    """
    pool = get_pool()
    uid = uuid.UUID(user_id)

    rows = await pool.fetch(
        """
        SELECT data_category, consent_given, withdrawn_at
        FROM consent_log
        WHERE user_id = $1 AND version = $2
        ORDER BY granted_at DESC
        """,
        uid,
        CURRENT_CONSENT_VERSION,
    )

    # Build consent map (latest entry per category wins)
    consent: dict[str, bool] = {}
    seen: set[str] = set()
    for row in rows:
        cat = row["data_category"]
        if cat not in seen:
            consent[cat] = row["consent_given"] and row["withdrawn_at"] is None
            seen.add(cat)

    # Default: required categories are always True, others are False
    for cat, info in DATA_CATEGORIES.items():
        if cat not in consent:
            consent[cat] = info["required"]

    return consent


async def grant_consent(
    user_id: str,
    category: str,
    purpose: str = "",
) -> bool:
    """Grant consent for a data category."""
    if category not in DATA_CATEGORIES:
        logger.warning(f"Invalid consent category: {category}")
        return False

    pool = get_pool()
    try:
        await pool.execute(
            """
            INSERT INTO consent_log (user_id, data_category, consent_given, purpose, version)
            VALUES ($1, $2, true, $3, $4)
            """,
            uuid.UUID(user_id),
            category,
            purpose or DATA_CATEGORIES[category]["purpose"],
            CURRENT_CONSENT_VERSION,
        )
        logger.info(f"Consent granted: user={user_id}, category={category}")
        return True
    except Exception as e:
        logger.error(f"Consent grant failed: {e}")
        return False


async def withdraw_consent(user_id: str, category: str) -> bool:
    """Withdraw consent for a data category."""
    if category not in DATA_CATEGORIES:
        return False

    if DATA_CATEGORIES[category]["required"]:
        logger.warning(f"Cannot withdraw required consent: {category}")
        return False

    pool = get_pool()
    try:
        # Mark existing consent as withdrawn
        await pool.execute(
            """
            UPDATE consent_log 
            SET withdrawn_at = NOW()
            WHERE user_id = $1 AND data_category = $2 AND withdrawn_at IS NULL
            """,
            uuid.UUID(user_id),
            category,
        )
        # Insert withdrawal record
        await pool.execute(
            """
            INSERT INTO consent_log (user_id, data_category, consent_given, purpose, version)
            VALUES ($1, $2, false, 'user_withdrawal', $3)
            """,
            uuid.UUID(user_id),
            category,
            CURRENT_CONSENT_VERSION,
        )
        logger.info(f"Consent withdrawn: user={user_id}, category={category}")
        return True
    except Exception as e:
        logger.error(f"Consent withdrawal failed: {e}")
        return False


def filter_by_consent(data: dict, consent: dict[str, bool]) -> dict:
    """
    Filter persona/context data based on consent status.
    Removes fields that belong to non-consented categories.
    """
    # Map persona fields to consent categories
    field_to_category = {
        "first_name": "personal",
        "age": "personal",
        "region": "personal",
        "profession": "personal",
        "hobbies": "personal",
        "interests": "personal",
        "goals": "financial",
        "risk_profile": "financial",
        "income_bracket": "financial",
        "investment_experience": "financial",
        "preferred_products": "financial",
        "literacy_level": "behavioral",
        "life_stage": "behavioral",
    }

    filtered = {}
    for key, value in data.items():
        category = field_to_category.get(key)
        if category is None:
            # Unknown field — include by default
            filtered[key] = value
        elif consent.get(category, False):
            filtered[key] = value
        else:
            logger.debug(f"Field '{key}' filtered out — no consent for '{category}'")

    return filtered


async def check_and_filter_persona(user_id: str, persona: dict) -> dict:
    """
    Check consent and filter persona data accordingly.
    Returns the filtered persona.
    """
    try:
        consent = await get_user_consent(user_id)
        return filter_by_consent(persona, consent)
    except Exception as e:
        logger.warning(f"Consent check failed, returning minimal persona: {e}")
        # On failure, return only the name (minimal)
        return {"first_name": persona.get("first_name", "")}
