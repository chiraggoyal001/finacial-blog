"""
FastAPI application entry point.
Initializes database, CORS, and mounts all API routes.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.connection import init_db, close_db
from app.api import chat, health, session, nudge, ingest

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


@app.get("/")
async def root():
    return {
        "service": "Financial Chatbot API",
        "version": "1.0.0-phase1",
        "docs": "/docs",
    }
