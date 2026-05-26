"""
FastAPI application entry point.
Initializes database, CORS, and mounts all API routes.
"""

from __future__ import annotations

# Monkeypatch langchain_google_genai to remove max_retries when calling gemma models
try:
    import langchain_google_genai.chat_models as genai_chat
    orig_achat = genai_chat._achat_with_retry
    orig_chat = genai_chat._chat_with_retry

    async def patched_achat(generation_method, **kwargs):
        clean_kwargs = {k: v for k, v in kwargs.items() if k not in ("max_retries", "wait_exponential_multiplier", "wait_exponential_min", "wait_exponential_max")}
        return await orig_achat(generation_method, **clean_kwargs)

    def patched_chat(generation_method, **kwargs):
        clean_kwargs = {k: v for k, v in kwargs.items() if k not in ("max_retries", "wait_exponential_multiplier", "wait_exponential_min", "wait_exponential_max")}
        return orig_chat(generation_method, **clean_kwargs)

    genai_chat._achat_with_retry = patched_achat
    genai_chat._chat_with_retry = patched_chat
except Exception as patch_err:
    import logging
    logging.getLogger(__name__).error(f"Failed to apply langchain monkeypatch: {patch_err}")


import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.connection import init_db, close_db
from app.api import chat, health, session, nudge, ingest
from app.api import admin_bot_config
from app import bot_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    # ── Startup ─────────────────────────────────────────────────
    logger.info("🚀 Starting Financial Chatbot Backend (Phase 1)")
    logger.info(f"   LLM: {settings.gemini_model}")
    logger.info(f"   Embedding: {settings.gemini_embedding_model}")
    logger.info(f"   Vector dim: {settings.embedding_dimension}")

    try:
        await init_db()
        logger.info("   ✅ Database connected")

        # Warm the bot_config cache on startup
        try:
            await bot_config.get("bot_default_system_prompt")
            logger.info("   ✅ Bot config cache warmed")
        except Exception as e:
            logger.warning(f"   ⚠️  Bot config cache warm failed (using defaults): {e}")

    except Exception as e:
        logger.error(f"   ❌ Database connection failed: {e}")
        logger.warning("   ⚠️  Running in degraded mode (no DB)")

    yield

    # ── Shutdown ────────────────────────────────────────────────
    logger.info("🛑 Shutting down...")
    await close_db()


# ── Create App ──────────────────────────────────────────────────

app = FastAPI(
    title="Financial Chatbot API",
    description="RAG-powered financial literacy chatbot with LangGraph orchestration",
    version="1.0.0-phase1",
    lifespan=lifespan,
)

# ── CORS Middleware ─────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Routes ────────────────────────────────────────────────

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(session.router, prefix="/api", tags=["Session Signals"])
app.include_router(nudge.router, prefix="/api", tags=["Proactive Nudge"])
app.include_router(ingest.router, prefix="/api", tags=["Ingestion"])
app.include_router(admin_bot_config.router, prefix="/api/admin", tags=["Admin Bot Config"])


@app.get("/")
async def root():
    return {
        "service": "Financial Chatbot API",
        "version": "1.0.0-phase1",
        "docs": "/docs",
    }
