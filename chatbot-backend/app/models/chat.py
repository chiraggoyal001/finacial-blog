"""
Pydantic models for chat API request/response schemas.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ───────────────────────────────────────────────────────

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ── Request Models ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat request from the frontend."""
    message: str = Field(..., max_length=2000, description="User message text")
    session_id: Optional[str] = Field(None, description="Existing session ID to continue")
    user_id: Optional[str] = Field(None, description="Authenticated user ID")
    history: list[HistoryMessage] = Field(default_factory=list, description="Recent chat history")
    article_slug: Optional[str] = Field(None, description="Current article being read")


class HistoryMessage(BaseModel):
    """A single message from chat history."""
    role: str  # "user" or "bot"
    content: str


# ── Response Models ─────────────────────────────────────────────

class ChatStreamEvent(BaseModel):
    """SSE event payload."""
    event: str  # "token", "done", "error", "metadata"
    data: str = ""
    metadata: Optional[dict] = None


class ChatResponse(BaseModel):
    """Full chat response (non-streaming fallback)."""
    response: str
    session_id: str
    sources: list[SourceReference] = Field(default_factory=list)
    compliance_flags: dict = Field(default_factory=dict)


class SourceReference(BaseModel):
    """Reference to a RAG source chunk."""
    doc_title: str = ""
    source_url: str = ""
    namespace: str = ""
    relevance_score: float = 0.0


# ── Internal Models ─────────────────────────────────────────────

class PersonaSnapshot(BaseModel):
    """Point-in-time copy of user persona for a session."""
    user_id: Optional[str] = None
    first_name: str = ""
    interests: list[str] = Field(default_factory=list)
    profession: str = ""
    age: Optional[int] = None
    region: str = ""
    goals: list[str] = Field(default_factory=list)
    risk_profile: str = ""
    literacy_level: str = "beginner"  # beginner | intermediate | advanced
    life_stage: str = ""


class RAGChunk(BaseModel):
    """A retrieved document chunk with metadata."""
    id: str
    content: str
    namespace: str = ""
    doc_title: str = ""
    source_url: str = ""
    source_date: Optional[datetime] = None
    similarity_score: float = 0.0
    trust_level: int = 3


# Fix forward reference
ChatRequest.model_rebuild()
