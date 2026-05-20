"""
Application configuration loaded from environment variables.
All settings use free-tier services (Gemini API, Supabase PostgreSQL + pgvector).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Gemini API (free tier) ──────────────────────────────────
    gemini_api_key: str
    gemini_model: str = "gemma-4-31b-it"
    gemini_embedding_model: str = "models/text-embedding-004"

    # ── Database ────────────────────────────────────────────────
    database_url: str

    # ── Supabase (for fetching system settings / affiliates) ───
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # ── CORS ────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ── Embedding ───────────────────────────────────────────────
    embedding_dimension: int = 768

    # ── RAG Pipeline ────────────────────────────────────────────
    rag_top_k: int = 10
    rag_score_threshold: float = 0.35
    rag_max_chunks: int = 5

    # ── Token Budget (within 32k context) ───────────────────────
    max_context_tokens: int = 32000
    system_persona_budget: int = 1600  # never trim
    knowledge_budget: int = 2400       # trim 2nd
    products_budget: int = 600
    history_budget: int = 4800         # trim 1st

    # ── Rate Limiting (in-memory for Phase 1) ──────────────────
    rate_limit_window: int = 60        # seconds
    rate_limit_max_requests: int = 10

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
