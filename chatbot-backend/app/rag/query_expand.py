"""
RAG Query Expansion — HyDE + Multi-Query.

Expands the user's query into multiple search variants for better recall:
1. HyDE: Generate a hypothetical answer, then search for docs similar to it
2. Multi-query: Rephrase the question from 2 different angles
3. Simple queries bypass expansion (detected by length/complexity)

Uses Gemini (Haiku-equivalent via flash) for fast expansion (~200ms target).
"""

from __future__ import annotations

import logging
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)

# Queries shorter than this skip expansion
SIMPLE_QUERY_THRESHOLD = 5  # words


def is_simple_query(query: str) -> bool:
    """Detect simple queries that don't need expansion."""
    words = query.strip().split()
    if len(words) <= SIMPLE_QUERY_THRESHOLD:
        return True
    # Common greetings / meta-questions
    simple_patterns = [
        "hello", "hi", "hey", "thanks", "thank you",
        "what can you do", "who are you", "help",
    ]
    lower = query.lower().strip()
    return any(lower.startswith(p) or lower == p for p in simple_patterns)


async def expand_query(
    query: str,
    persona_context: str = "",
    skip_if_simple: bool = True,
) -> list[str]:
    """
    Expand a query into multiple search variants.
    
    Returns a list of queries (1-4 items):
    - Original query (always included)
    - HyDE hypothetical answer
    - 1-2 rephrased variants
    
    For simple queries, returns just the original.
    """
    queries = [query]  # Always include original

    if skip_if_simple and is_simple_query(query):
        logger.info(f"Simple query detected, skipping expansion: '{query[:50]}'")
        return queries

    try:
        # Use a fast model for expansion
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",  # Fast model for expansion
            google_api_key=settings.gemini_api_key,
            temperature=0.3,
            max_output_tokens=300,
        )

        # Generate HyDE answer + multi-query in a single call
        expansion_prompt = f"""You are helping expand a search query for a financial knowledge base.

Given this user question: "{query}"
{f'User context: {persona_context}' if persona_context else ''}

Generate exactly 3 lines:
1. A brief hypothetical answer (1-2 sentences) that a good document would contain
2. The question rephrased focusing on the core concept
3. The question rephrased focusing on practical application

Output ONLY the 3 lines, no labels or numbering."""

        response = await llm.ainvoke([HumanMessage(content=expansion_prompt)])
        
        if response.content:
            lines = [line.strip() for line in response.content.strip().split("\n") if line.strip()]
            for line in lines[:3]:  # Take up to 3 expansion lines
                if line and line != query and len(line) > 10:
                    queries.append(line)

        logger.info(f"Query expanded: '{query[:40]}...' → {len(queries)} variants")

    except Exception as e:
        logger.warning(f"Query expansion failed (continuing with original): {e}")
        # Fall through — original query is always in the list

    return queries
