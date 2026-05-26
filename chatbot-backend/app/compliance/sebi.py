"""
SEBI Compliance & Hallucination Guard (Phase 1 — basic version).

Handles:
- Blocked word detection (guaranteed, risk-free, etc.)
- SEBI disclaimer injection
- Basic advice-language detection
"""

from __future__ import annotations

import re
import logging

from app import bot_config

logger = logging.getLogger(__name__)

# ── Hardcoded defaults (used as fallback) ──────────────────────

_DEFAULT_BLOCKED_PHRASES = [
    r"\bguaranteed\s+returns?\b",
    r"\brisk[- ]?free\b",
    r"\bassured\s+returns?\b",
    r"\b100%\s+safe\b",
    r"\bno\s+risk\b",
    r"\bcertain\s+profit\b",
    r"\bsure[- ]?shot\b",
    r"\bdoubt[- ]?free\b",
    r"\bcan'?t\s+lose\b",
    r"\bwill\s+definitely\s+(go\s+up|rise|increase)\b",
]

_DEFAULT_ADVICE_PATTERNS = [
    r"\byou\s+should\s+(buy|sell|invest\s+in)\b",
    r"\bi\s+recommend\s+(buying|selling|investing)\b",
    r"\b(buy|sell)\s+this\s+(stock|fund|share)\b",
    r"\binvest\s+(?:all|your)\s+money\s+in\b",
    r"\bthis\s+is\s+the\s+best\s+(investment|stock|fund)\b",
]


def _phrase_to_regex(phrase: str) -> str:
    """Convert a plain-text phrase to a word-boundary regex pattern."""
    # If it already looks like a regex (contains special chars), use as-is
    if any(c in phrase for c in r"\[]()+*?{}"):
        return phrase
    # Otherwise, escape and wrap in word boundaries
    escaped = re.escape(phrase)
    return rf"\b{escaped}\b"


def _get_blocked_patterns() -> list[re.Pattern]:
    """Get compiled blocked phrase patterns from admin config."""
    cfg = bot_config.get_sync("bot_blocked_phrases")
    if isinstance(cfg, dict) and cfg.get("patterns"):
        raw_patterns = cfg["patterns"]
        regex_patterns = [_phrase_to_regex(p) for p in raw_patterns]
    else:
        regex_patterns = _DEFAULT_BLOCKED_PHRASES
    return [re.compile(p, re.IGNORECASE) for p in regex_patterns]


def _get_advice_patterns() -> list[re.Pattern]:
    """Get compiled advice detection patterns from admin config."""
    cfg = bot_config.get_sync("bot_advice_patterns")
    if isinstance(cfg, dict) and cfg.get("patterns"):
        raw_patterns = cfg["patterns"]
        regex_patterns = [_phrase_to_regex(p) for p in raw_patterns]
    else:
        regex_patterns = _DEFAULT_ADVICE_PATTERNS
    return [re.compile(p, re.IGNORECASE) for p in regex_patterns]


def _get_sebi_disclaimer() -> str:
    """Get SEBI disclaimer from admin config."""
    cfg = bot_config.get_sync("bot_sebi_disclaimer")
    if isinstance(cfg, dict) and cfg.get("text"):
        return cfg["text"]
    return (
        "\n\n---\n"
        "⚠️ **Disclaimer**: This information is for educational purposes only "
        "and does not constitute financial advice. Please consult a SEBI-registered "
        "investment adviser before making investment decisions."
    )


def check_response(response_text: str) -> dict:
    """
    Run compliance checks on a generated response.
    
    Returns:
        dict with keys:
        - passed: bool — True if response is compliant
        - blocked_phrases: list[str] — any blocked phrases found
        - advice_detected: bool — True if specific advice language detected
        - needs_disclaimer: bool — True if disclaimer should be appended
        - sanitized_text: str — cleaned response text
    """
    result = {
        "passed": True,
        "blocked_phrases": [],
        "advice_detected": False,
        "needs_disclaimer": True,  # Always add for financial content
        "sanitized_text": response_text,
    }

    # Load patterns from admin config (cached)
    compiled_blocked = _get_blocked_patterns()
    compiled_advice = _get_advice_patterns()

    # Check for blocked phrases
    for pattern in compiled_blocked:
        matches = pattern.findall(response_text)
        if matches:
            result["blocked_phrases"].extend(matches)
            result["passed"] = False

    # Check for advice language
    for pattern in compiled_advice:
        if pattern.search(response_text):
            result["advice_detected"] = True
            result["passed"] = False
            break

    # If blocked phrases found, sanitize
    if result["blocked_phrases"]:
        sanitized = response_text
        for pattern in compiled_blocked:
            sanitized = pattern.sub("[term removed]", sanitized)
        result["sanitized_text"] = sanitized
        logger.warning(f"Blocked phrases found and removed: {result['blocked_phrases']}")

    # If advice detected, add a stronger caveat
    if result["advice_detected"]:
        result["sanitized_text"] += (
            "\n\n⚠️ **Note**: The above reflects general information, not a personal recommendation. "
            "Individual circumstances vary. Please consult a qualified financial adviser."
        )
        logger.warning("Advice language detected — caveat appended")

    return result


def inject_disclaimer(response_text: str) -> str:
    """Append SEBI disclaimer if not already present."""
    if "Disclaimer" not in response_text and "disclaimer" not in response_text:
        return response_text + _get_sebi_disclaimer()
    return response_text


def full_compliance_check(response_text: str) -> tuple[str, dict]:
    """
    Run full compliance pipeline and return (sanitized_text, flags).
    This is the main entry point used by the orchestrator.
    """
    result = check_response(response_text)
    final_text = result["sanitized_text"]

    # Always inject disclaimer for financial content
    if result["needs_disclaimer"]:
        final_text = inject_disclaimer(final_text)

    flags = {
        "passed": result["passed"],
        "blocked_phrases": result["blocked_phrases"],
        "advice_detected": result["advice_detected"],
    }

    return final_text, flags
