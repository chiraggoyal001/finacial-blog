"""
Working Memory Manager — Token Budget Optimization.

Manages the 32k context window by allocating token budgets across:
- System prompt + persona (1,600 tokens, never trimmed)
- Knowledge / RAG chunks (2,400 tokens, trimmed 2nd)
- Products / offers (600 tokens)
- Conversation history (4,800 tokens, trimmed 1st)

Total usable ≈ 10,600 tokens (out of 32k, rest reserved for output + overhead).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TokenBudget:
    """Tracks token allocation across context sections."""
    system_persona: int = 0
    knowledge: int = 0
    products: int = 0
    history: int = 0
    user_message: int = 0
    
    @property
    def total(self) -> int:
        return self.system_persona + self.knowledge + self.products + self.history + self.user_message
    
    @property
    def remaining(self) -> int:
        return settings.max_context_tokens - self.total
    
    @property
    def is_over_budget(self) -> bool:
        return self.total > settings.max_context_tokens


def estimate_tokens(text: str) -> int:
    """Rough token estimation (~1.3 tokens per word)."""
    return int(len(text.split()) * 1.3)


def build_budget(
    system_prompt: str,
    persona_text: str,
    knowledge_text: str,
    products_text: str,
    history: list[dict],
    user_message: str,
) -> tuple[TokenBudget, list[dict], str, str]:
    """
    Build a token budget and trim content to fit.
    
    Returns:
        (budget, trimmed_history, trimmed_knowledge, trimmed_products)
    
    Trimming priority:
    1. Products (trimmed first, least critical)
    2. History (trimmed second, oldest messages removed)
    3. Knowledge (trimmed third, lowest-score chunks removed)
    4. System + persona (NEVER trimmed)
    """
    budget = TokenBudget()
    
    # System + persona — never trimmed
    system_tokens = estimate_tokens(system_prompt + persona_text)
    budget.system_persona = min(system_tokens, settings.system_persona_budget + 200)  # small overflow okay
    
    # User message — never trimmed
    budget.user_message = estimate_tokens(user_message)
    
    # Calculate remaining budget for dynamic content
    remaining = settings.max_context_tokens - budget.system_persona - budget.user_message - 2000  # 2k output buffer
    
    # Allocate knowledge
    knowledge_tokens = estimate_tokens(knowledge_text)
    trimmed_knowledge = knowledge_text
    if knowledge_tokens > settings.knowledge_budget:
        # Trim to budget — keep beginning (highest-scored chunks are first)
        words = knowledge_text.split()
        word_limit = int(settings.knowledge_budget / 1.3)
        trimmed_knowledge = " ".join(words[:word_limit])
        knowledge_tokens = settings.knowledge_budget
        logger.info(f"Knowledge trimmed: {estimate_tokens(knowledge_text)} → {knowledge_tokens} tokens")
    budget.knowledge = knowledge_tokens
    remaining -= knowledge_tokens
    
    # Allocate products
    products_tokens = estimate_tokens(products_text)
    trimmed_products = products_text
    if products_tokens > settings.products_budget:
        words = products_text.split()
        word_limit = int(settings.products_budget / 1.3)
        trimmed_products = " ".join(words[:word_limit])
        products_tokens = settings.products_budget
    budget.products = products_tokens
    remaining -= products_tokens
    
    # Allocate history — trim oldest first
    history_budget = min(remaining, settings.history_budget)
    trimmed_history: list[dict] = []
    history_tokens = 0
    
    for msg in reversed(history):
        msg_tokens = estimate_tokens(msg.get("content", ""))
        if history_tokens + msg_tokens > history_budget:
            break
        trimmed_history.insert(0, msg)
        history_tokens += msg_tokens
    
    budget.history = history_tokens
    
    if len(trimmed_history) < len(history):
        logger.info(f"History trimmed: {len(history)} → {len(trimmed_history)} messages")
    
    logger.info(
        f"Token budget: system={budget.system_persona} knowledge={budget.knowledge} "
        f"products={budget.products} history={budget.history} user={budget.user_message} "
        f"total={budget.total} remaining={budget.remaining}"
    )
    
    return budget, trimmed_history, trimmed_knowledge, trimmed_products
