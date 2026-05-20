"""
Persona Engine — Enrichment + Confidence Gating.

Builds and enriches user personas from:
1. Profile data (static: name, age, region, profession)
2. Chat history (dynamic: goals, interests, risk tolerance)
3. Session signals (behavioral: reading patterns, calculator inputs)

Confidence gating ensures only high-confidence persona fields
are used for personalization.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from app.config import settings
from app.db import repositories

logger = logging.getLogger(__name__)

# Fields that can be extracted from conversations
EXTRACTABLE_FIELDS = {
    "goals",              # e.g., ["retirement planning", "child education"]
    "risk_profile",       # conservative | moderate | aggressive
    "literacy_level",     # beginner | intermediate | advanced
    "life_stage",         # student | early_career | mid_career | pre_retirement | retired
    "income_bracket",     # low | medium | high | ultra_high
    "investment_experience",  # none | basic | intermediate | advanced
    "preferred_products", # e.g., ["mutual_funds", "stocks", "fd"]
}

# Minimum confidence to use a field for personalization
CONFIDENCE_THRESHOLD = 0.60


async def get_enriched_persona(user_id: str) -> dict:
    """
    Get the full enriched persona for a user.
    Only returns fields above the confidence threshold.
    """
    raw_persona = await repositories.get_user_persona(user_id)
    if not raw_persona:
        return {}

    # Get confidence scores
    try:
        from app.db.connection import get_pool
        pool = get_pool()
        row = await pool.fetchrow(
            "SELECT confidence_scores FROM user_personas WHERE user_id = $1",
            __import__("uuid").UUID(user_id),
        )
        confidence = {}
        if row and row["confidence_scores"]:
            confidence = row["confidence_scores"] if isinstance(row["confidence_scores"], dict) else json.loads(row["confidence_scores"])
    except Exception:
        confidence = {}

    # Apply confidence gating
    gated_persona = {}
    for key, value in raw_persona.items():
        if key in EXTRACTABLE_FIELDS:
            # Check confidence for enriched fields
            field_confidence = confidence.get(key, 0.5)
            if field_confidence >= CONFIDENCE_THRESHOLD:
                gated_persona[key] = value
            else:
                logger.debug(f"Field '{key}' below confidence threshold ({field_confidence:.2f} < {CONFIDENCE_THRESHOLD})")
        else:
            # Profile fields (name, age, etc.) always included
            gated_persona[key] = value

    return gated_persona


async def enrich_from_message(user_id: str, message: str, response: str) -> None:
    """
    Extract persona signals from a conversation turn.
    Updates the persona with extracted fields at low confidence
    (confidence increases with repeated signals).
    """
    extractions = _extract_persona_signals(message)
    if not extractions:
        return

    try:
        current_persona = await repositories.get_user_persona(user_id)
        if not current_persona:
            current_persona = {}

        # Get current confidence scores
        from app.db.connection import get_pool
        pool = get_pool()
        row = await pool.fetchrow(
            "SELECT confidence_scores FROM user_personas WHERE user_id = $1",
            __import__("uuid").UUID(user_id),
        )
        confidence = {}
        if row and row["confidence_scores"]:
            confidence = row["confidence_scores"] if isinstance(row["confidence_scores"], dict) else json.loads(row["confidence_scores"])

        updated = False
        for field, value in extractions.items():
            current_conf = confidence.get(field, 0.0)

            if field in current_persona:
                # Field exists — increase confidence if same value
                if current_persona[field] == value:
                    new_conf = min(1.0, current_conf + 0.15)
                else:
                    # Different value — lower confidence and update
                    new_conf = 0.40
                    current_persona[field] = value
                confidence[field] = new_conf
            else:
                # New field — add at initial confidence
                current_persona[field] = value
                confidence[field] = 0.45
            updated = True

        if updated:
            await repositories.upsert_user_persona(user_id, current_persona)
            # Update confidence scores
            await pool.execute(
                "UPDATE user_personas SET confidence_scores = $1 WHERE user_id = $2",
                json.dumps(confidence),
                __import__("uuid").UUID(user_id),
            )
            logger.info(f"Persona enriched for user {user_id}: {list(extractions.keys())}")

    except Exception as e:
        logger.error(f"Persona enrichment failed: {e}")


def _extract_persona_signals(message: str) -> dict:
    """
    Extract persona signals from a user message using keyword matching.
    Returns dict of field: value pairs.
    """
    import re
    lower = message.lower()
    extractions = {}

    # Goal detection
    goal_keywords = {
        "retirement": "retirement planning",
        "retire": "retirement planning",
        "child education": "child education fund",
        "children's education": "child education fund",
        "house": "home purchase",
        "home loan": "home purchase",
        "property": "home purchase",
        "emergency fund": "emergency fund",
        "wedding": "wedding fund",
        "marriage": "wedding fund",
        "car": "vehicle purchase",
        "travel": "travel fund",
        "tax saving": "tax optimization",
        "tax planning": "tax optimization",
        "wealth creation": "wealth building",
    }
    goals = []
    for keyword, goal in goal_keywords.items():
        if keyword in lower and goal not in goals:
            goals.append(goal)
    if goals:
        extractions["goals"] = goals

    # Risk profile detection
    if any(w in lower for w in ["conservative", "safe", "low risk", "no risk", "capital protection"]):
        extractions["risk_profile"] = "conservative"
    elif any(w in lower for w in ["aggressive", "high risk", "growth", "maximize returns"]):
        extractions["risk_profile"] = "aggressive"
    elif any(w in lower for w in ["moderate", "balanced", "medium risk"]):
        extractions["risk_profile"] = "moderate"

    # Life stage detection
    if any(w in lower for w in ["student", "college", "studying"]):
        extractions["life_stage"] = "student"
    elif any(w in lower for w in ["just started working", "first job", "fresher"]):
        extractions["life_stage"] = "early_career"
    elif any(w in lower for w in ["retiring soon", "near retirement", "5 years to retire"]):
        extractions["life_stage"] = "pre_retirement"
    elif any(w in lower for w in ["retired", "pension", "senior citizen"]):
        extractions["life_stage"] = "retired"

    # Literacy detection
    if any(w in lower for w in ["don't understand", "what is", "explain", "beginner", "new to investing", "confused"]):
        extractions["literacy_level"] = "beginner"
    elif any(w in lower for w in ["P/E ratio", "sharpe ratio", "alpha", "beta", "NAV", "XIRR"]):
        extractions["literacy_level"] = "advanced"

    return extractions


def format_persona_for_prompt(persona: dict) -> str:
    """Format a gated persona into a concise prompt section."""
    if not persona:
        return "USER CONTEXT: Anonymous user. Provide general, accessible information."

    parts = ["USER CONTEXT:"]
    
    if persona.get("first_name"):
        parts.append(f"- Name: {persona['first_name']}")
    if persona.get("age"):
        parts.append(f"- Age: {persona['age']}")
    if persona.get("region"):
        parts.append(f"- Region: {persona['region']}")
    if persona.get("profession"):
        parts.append(f"- Profession: {persona['profession']}")
    if persona.get("literacy_level"):
        parts.append(f"- Financial literacy: {persona['literacy_level']}")
    if persona.get("goals"):
        goals = persona["goals"]
        if isinstance(goals, list) and goals:
            parts.append(f"- Financial goals: {', '.join(goals)}")
    if persona.get("risk_profile"):
        parts.append(f"- Risk profile: {persona['risk_profile']}")
    if persona.get("life_stage"):
        parts.append(f"- Life stage: {persona['life_stage']}")
    if persona.get("interests"):
        interests = persona["interests"]
        if isinstance(interests, list):
            parts.append(f"- Interests: {', '.join(interests)}")

    return "\n".join(parts)
