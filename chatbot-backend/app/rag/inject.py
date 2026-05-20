"""
RAG Step 3: Prompt assembly — combines persona, RAG chunks, history, and
compliance instructions into the final prompt sent to the LLM.

Token budget management is handled here.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ── Token estimation (rough, ~1.3 tokens per word) ─────────────

def estimate_tokens(text: str) -> int:
    """Rough token estimation. Good enough for budget management."""
    return int(len(text.split()) * 1.3)


def trim_history(history: list[dict], budget: int) -> list[dict]:
    """Trim oldest messages from history to fit token budget."""
    trimmed: list[dict] = []
    total = 0
    # Keep most recent messages first
    for msg in reversed(history):
        tokens = estimate_tokens(msg["content"])
        if total + tokens > budget:
            break
        trimmed.insert(0, msg)
        total += tokens
    return trimmed


def trim_chunks(chunks: list[dict], budget: int) -> list[dict]:
    """Trim lowest-scoring chunks to fit token budget."""
    trimmed: list[dict] = []
    total = 0
    for chunk in chunks:  # already sorted by score desc
        tokens = estimate_tokens(chunk["content"])
        if total + tokens > budget:
            break
        trimmed.append(chunk)
        total += tokens
    return trimmed


# ── SEBI Compliance Footer ──────────────────────────────────────

SEBI_DISCLAIMER = (
    "\n\n---\n"
    "⚠️ **Disclaimer**: This information is for educational purposes only "
    "and does not constitute financial advice. Please consult a SEBI-registered "
    "investment adviser before making investment decisions."
)


# ── Main Prompt Assembly ────────────────────────────────────────

def assemble_prompt(
    system_prompt: str,
    persona: dict,
    chunks: list[dict],
    history: list[dict],
    user_message: str,
    affiliates_context: str = "",
    include_disclaimer: bool = True,
) -> list[dict]:
    """
    Assemble the final prompt messages for the LLM with token budgeting.
    
    Budget allocation (within 32k context, ~10,600 usable tokens):
    - System + Persona: 1,600 tokens (never trimmed)
    - Knowledge chunks: 2,400 tokens (trimmed 2nd)
    - Products/offers:    600 tokens
    - Conv history:     4,800 tokens (trimmed 1st)
    
    Returns list of message dicts ready for LangChain.
    """

    # ── 1. Build system instruction (never trimmed) ─────────────
    persona_text = _format_persona(persona)
    compliance_instruction = (
        "\n\nCOMPLIANCE RULES:\n"
        "- Never provide specific investment advice or guaranteed returns.\n"
        "- Never use words like 'guaranteed', 'risk-free', 'assured returns'.\n"
        "- Always clarify that information is educational, not personalized advice.\n"
        "- If asked about specific stocks/funds to buy, redirect to a SEBI-registered adviser.\n"
        "- Never fabricate financial data, statistics, or regulatory information.\n"
        "- If you're unsure, say so honestly rather than guessing.\n"
    )

    system_content = f"{system_prompt}\n\n{persona_text}{compliance_instruction}"
    if affiliates_context:
        system_content += f"\n{affiliates_context}"

    system_tokens = estimate_tokens(system_content)
    logger.info(f"System prompt: ~{system_tokens} tokens")

    # ── 2. Format knowledge chunks (trim 2nd) ───────────────────
    trimmed_chunks = trim_chunks(chunks, settings.knowledge_budget)
    knowledge_text = _format_chunks(trimmed_chunks)
    knowledge_tokens = estimate_tokens(knowledge_text)
    logger.info(f"Knowledge: {len(trimmed_chunks)}/{len(chunks)} chunks, ~{knowledge_tokens} tokens")

    # ── 3. Trim conversation history (trim 1st) ─────────────────
    trimmed_history = trim_history(history, settings.history_budget)
    logger.info(f"History: {len(trimmed_history)}/{len(history)} messages kept")

    # ── 4. Assemble final messages ──────────────────────────────
    messages: list[dict] = []

    # System message
    full_system = system_content
    if knowledge_text:
        full_system += f"\n\nRELEVANT KNOWLEDGE:\n{knowledge_text}"
    if include_disclaimer:
        full_system += (
            "\n\nIMPORTANT: End every response with this disclaimer:\n"
            f"{SEBI_DISCLAIMER}"
        )

    messages.append({"role": "user", "content": f"SYSTEM INSTRUCTION: {full_system}"})
    messages.append({"role": "model", "content": "Understood. I will follow all instructions and compliance rules."})

    # History messages
    for msg in trimmed_history:
        role = "model" if msg["role"] in ("assistant", "bot", "model") else "user"
        messages.append({"role": role, "content": msg["content"]})

    # Current user message
    messages.append({"role": "user", "content": user_message})

    total_tokens = sum(estimate_tokens(m["content"]) for m in messages)
    logger.info(f"Total assembled prompt: ~{total_tokens} tokens, {len(messages)} messages")

    return messages


# ── Formatters ──────────────────────────────────────────────────

def _format_persona(persona: dict) -> str:
    """Format persona into a concise text block for the system prompt."""
    if not persona:
        return "USER CONTEXT: Anonymous user, no profile available. Be helpful and general."

    parts = ["USER CONTEXT:"]
    if persona.get("first_name"):
        parts.append(f"- Name: {persona['first_name']}")
    if persona.get("age"):
        parts.append(f"- Age: {persona['age']}")
    if persona.get("region"):
        parts.append(f"- Region: {persona['region']}")
    if persona.get("profession"):
        parts.append(f"- Profession: {persona['profession']}")
    if persona.get("interests"):
        interests = persona["interests"]
        if isinstance(interests, list):
            parts.append(f"- Interests: {', '.join(interests)}")
    if persona.get("literacy_level"):
        parts.append(f"- Financial literacy: {persona['literacy_level']}")
    if persona.get("goals"):
        goals = persona["goals"]
        if isinstance(goals, list) and goals:
            parts.append(f"- Financial goals: {', '.join(goals)}")
    if persona.get("risk_profile"):
        parts.append(f"- Risk profile: {persona['risk_profile']}")

    return "\n".join(parts)


def _format_chunks(chunks: list[dict]) -> str:
    """Format RAG chunks into numbered context blocks."""
    if not chunks:
        return ""

    parts: list[str] = []
    for i, chunk in enumerate(chunks, 1):
        source_info = ""
        if chunk.get("doc_title"):
            source_info += f" (Source: {chunk['doc_title']}"
            if chunk.get("source_date"):
                source_info += f", {chunk['source_date'][:10]}"
            source_info += ")"
        parts.append(f"[{i}]{source_info}:\n{chunk['content']}")

    return "\n\n".join(parts)
