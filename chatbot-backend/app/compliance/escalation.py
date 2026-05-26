"""
Escalation Detector — Compliance Layer.

Detects when a conversation should be escalated to a human adviser.
Triggers on:
- High financial complexity (crore+ amounts, legal terms)
- Emotional distress signals (debt crisis, fear, urgency)
- Explicit requests for professional advice
- Topics beyond the bot's scope (specific stock picks, legal disputes)
"""

from __future__ import annotations

import re
import logging
from enum import Enum
from typing import Optional

from app import bot_config

logger = logging.getLogger(__name__)


class EscalationLevel(str, Enum):
    NONE = "none"
    SUGGEST = "suggest"       # Suggest seeing an adviser
    RECOMMEND = "recommend"   # Strongly recommend, provide booking link
    URGENT = "urgent"         # Immediate escalation (distress detected)


# ── Complexity Signals ──────────────────────────────────────────

COMPLEXITY_PATTERNS = [
    # Large amounts
    re.compile(r'(\d+)\s*crore', re.IGNORECASE),
    re.compile(r'(\d+)\s*lakh.*(?:invest|loan|debt|borrow)', re.IGNORECASE),
    # Legal / regulatory
    re.compile(r'\b(?:lawsuit|litigation|legal\s+notice|court\s+order|arbitration)\b', re.IGNORECASE),
    re.compile(r'\b(?:tax\s+evasion|penalty|prosecution|fraud)\b', re.IGNORECASE),
    # Complex products
    re.compile(r'\b(?:derivative|futures|options|hedge\s+fund|AIF|PMS)\b', re.IGNORECASE),
    re.compile(r'\b(?:NRI\s+tax|DTAA|foreign\s+income|FEMA)\b', re.IGNORECASE),
    # Specific advice requests
    re.compile(r'\b(?:which\s+(?:stock|fund|scheme)\s+should\s+I\s+buy)\b', re.IGNORECASE),
    re.compile(r'\b(?:should\s+I\s+(?:sell|hold|exit))\b', re.IGNORECASE),
    re.compile(r'\b(?:portfolio\s+review|financial\s+plan)\b', re.IGNORECASE),
]

# ── Distress Signals ────────────────────────────────────────────

DISTRESS_PATTERNS = [
    # Debt crisis
    re.compile(r'\b(?:drowning\s+in\s+debt|can\'?t\s+pay|defaulting)\b', re.IGNORECASE),
    re.compile(r'\b(?:bankrupt|insolvency|NCLT|recovery\s+agent)\b', re.IGNORECASE),
    re.compile(r'\b(?:loan\s+shark|harass|threaten)\b', re.IGNORECASE),
    # Emotional distress
    re.compile(r'\b(?:lost\s+everything|wiped\s+out|ruined)\b', re.IGNORECASE),
    re.compile(r'\b(?:desperate|hopeless|scared|panic|terrified)\b', re.IGNORECASE),
    re.compile(r'\b(?:family\s+(?:breaking|suffering|starving))\b', re.IGNORECASE),
    re.compile(r'\b(?:suicide|self[- ]?harm|end\s+(?:my|it\s+all))\b', re.IGNORECASE),
    # Scam victim
    re.compile(r'\b(?:scam|fraud|cheated|tricked|stolen)\b', re.IGNORECASE),
]

# ── Professional Advice Requests ────────────────────────────────

ADVISER_REQUEST_PATTERNS = [
    re.compile(r'\b(?:speak|talk|connect|meet)\s+(?:to|with)\s+(?:an?\s+)?(?:adviser|advisor|expert|planner)\b', re.IGNORECASE),
    re.compile(r'\b(?:need\s+(?:professional|expert)\s+(?:advice|help|guidance))\b', re.IGNORECASE),
    re.compile(r'\b(?:hire|find|recommend)\s+(?:an?\s+)?(?:CA|CFP|financial\s+(?:planner|adviser|advisor))\b', re.IGNORECASE),
]


def detect_escalation(message: str) -> dict:
    """
    Analyze a user message for escalation signals.
    
    Returns:
        {
            "level": EscalationLevel,
            "signals": list[str],
            "response_prefix": str | None,
            "should_block": bool,
        }
    """
    signals: list[str] = []
    level = EscalationLevel.NONE

    # Check for self-harm / severe distress FIRST (highest priority)
    for pattern in DISTRESS_PATTERNS:
        match = pattern.search(message)
        if match:
            matched_text = match.group(0)
            signals.append(f"distress: {matched_text}")

            # Self-harm → URGENT
            if any(kw in matched_text.lower() for kw in ("suicide", "self-harm", "end it")):
                level = EscalationLevel.URGENT
                break
            else:
                level = max_level(level, EscalationLevel.RECOMMEND)

    # Check complexity
    for pattern in COMPLEXITY_PATTERNS:
        match = pattern.search(message)
        if match:
            signals.append(f"complexity: {match.group(0)}")
            level = max_level(level, EscalationLevel.SUGGEST)

    # Check explicit adviser requests
    for pattern in ADVISER_REQUEST_PATTERNS:
        match = pattern.search(message)
        if match:
            signals.append(f"adviser_request: {match.group(0)}")
            level = max_level(level, EscalationLevel.RECOMMEND)

    # Build response prefix based on level (load from admin config)
    escalation_cfg = bot_config.get_sync("bot_escalation_responses")
    if not isinstance(escalation_cfg, dict):
        escalation_cfg = bot_config.DEFAULTS["bot_escalation_responses"]

    response_prefix = None
    if level == EscalationLevel.URGENT:
        response_prefix = escalation_cfg.get("urgent", "")
    elif level == EscalationLevel.RECOMMEND:
        response_prefix = escalation_cfg.get("recommend", "")
    elif level == EscalationLevel.SUGGEST:
        response_prefix = escalation_cfg.get("suggest", "")

    if signals:
        logger.info(f"Escalation detected: level={level.value}, signals={signals}")

    return {
        "level": level.value,
        "signals": signals,
        "response_prefix": response_prefix,
        "should_block": level == EscalationLevel.URGENT,
    }


def max_level(a: EscalationLevel, b: EscalationLevel) -> EscalationLevel:
    """Return the higher escalation level."""
    order = {
        EscalationLevel.NONE: 0,
        EscalationLevel.SUGGEST: 1,
        EscalationLevel.RECOMMEND: 2,
        EscalationLevel.URGENT: 3,
    }
    return a if order[a] >= order[b] else b
