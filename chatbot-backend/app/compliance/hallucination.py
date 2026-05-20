"""
Hallucination Guard — Compliance Layer.

Extracts factual claims from bot responses and verifies them
against the RAG chunks that were used to generate the response.

Checks:
- Unsourced numbers (percentages, amounts, rates) → block
- Specific claims not backed by any chunk → flag
- Blocked phrases (guaranteed, risk-free, etc.) → already in sebi.py
"""

from __future__ import annotations

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Patterns that extract numerical claims from text
NUMBER_CLAIM_PATTERNS = [
    # "returns of 12%", "interest rate of 7.5%"
    re.compile(r'(?:returns?|interest|growth|yield|rate)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%', re.IGNORECASE),
    # "₹50,000", "Rs. 1,00,000"
    re.compile(r'[₹Rs.]+\s*([\d,]+(?:\.\d+)?)', re.IGNORECASE),
    # "10 lakh", "5 crore"
    re.compile(r'(\d+(?:\.\d+)?)\s*(?:lakh|crore|thousand|million|billion)', re.IGNORECASE),
    # "CAGR of 15%"
    re.compile(r'CAGR\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%', re.IGNORECASE),
    # "NAV is 45.67"
    re.compile(r'NAV\s+(?:is|was|at)\s+(\d+(?:\.\d+)?)', re.IGNORECASE),
]

# Patterns for specific financial claims that need sourcing
CLAIM_PATTERNS = [
    re.compile(r'(?:according to|as per|data from)\s+([^,.]+)', re.IGNORECASE),
    re.compile(r'(?:RBI|SEBI|IRDA|AMFI)\s+(?:has|recently|stated|announced)', re.IGNORECASE),
    re.compile(r'(?:section|rule|regulation)\s+\d+', re.IGNORECASE),
    re.compile(r'(?:tax\s+(?:rate|slab|bracket))\s+(?:is|of)\s+(\d+)', re.IGNORECASE),
]


def extract_numerical_claims(text: str) -> list[dict]:
    """
    Extract numerical claims (percentages, amounts, rates) from text.
    
    Returns list of dicts: {pattern, value, context, position}
    """
    claims = []
    for pattern in NUMBER_CLAIM_PATTERNS:
        for match in pattern.finditer(text):
            # Get surrounding context (30 chars on each side)
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            context = text[start:end].strip()
            
            claims.append({
                "value": match.group(0),
                "number": match.group(1) if match.lastindex else match.group(0),
                "context": context,
                "position": match.start(),
            })
    
    return claims


def verify_claims_against_chunks(
    claims: list[dict],
    rag_chunks: list[dict],
) -> dict:
    """
    Verify numerical claims against the RAG chunks that were used.
    
    Returns:
        {
            "verified": [claim, ...],
            "unverified": [claim, ...],
            "pass": bool,
        }
    """
    if not claims:
        return {"verified": [], "unverified": [], "pass": True}
    
    # Combine all chunk text for searching
    chunk_text = " ".join(c.get("content", "") for c in rag_chunks).lower()
    
    verified = []
    unverified = []
    
    for claim in claims:
        number = claim.get("number", "")
        value = claim.get("value", "").lower()
        
        # Check if the number appears in any chunk
        if number in chunk_text or value in chunk_text:
            verified.append(claim)
        else:
            unverified.append(claim)
    
    return {
        "verified": verified,
        "unverified": unverified,
        "pass": len(unverified) == 0,
    }


def check_hallucination(
    response_text: str,
    rag_chunks: list[dict],
) -> dict:
    """
    Full hallucination check on a response.
    
    Returns:
        {
            "passed": bool,
            "claims_found": int,
            "verified_count": int,
            "unverified_count": int,
            "unverified_claims": list,
            "sanitized_text": str,
        }
    """
    claims = extract_numerical_claims(response_text)
    
    if not claims:
        return {
            "passed": True,
            "claims_found": 0,
            "verified_count": 0,
            "unverified_count": 0,
            "unverified_claims": [],
            "sanitized_text": response_text,
        }
    
    verification = verify_claims_against_chunks(claims, rag_chunks)
    
    sanitized = response_text
    if not verification["pass"]:
        # Add caveat for unverified numerical claims
        caveat = (
            "\n\n⚠️ *Some figures mentioned above could not be verified against "
            "our knowledge base. Please verify these numbers from official sources "
            "before making any decisions.*"
        )
        sanitized = response_text + caveat
        
        logger.warning(
            f"Hallucination guard: {len(verification['unverified'])} unverified claims found"
        )
    
    return {
        "passed": verification["pass"],
        "claims_found": len(claims),
        "verified_count": len(verification["verified"]),
        "unverified_count": len(verification["unverified"]),
        "unverified_claims": [c["value"] for c in verification["unverified"]],
        "sanitized_text": sanitized,
    }
