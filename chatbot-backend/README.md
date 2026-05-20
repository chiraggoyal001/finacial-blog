# Financial Chatbot Backend — Phase 1

RAG-powered financial literacy chatbot built with **FastAPI + LangGraph + LangChain + pgvector**.

## Architecture

```
Frontend (React) → FastAPI (SSE) → LangGraph Pipeline → Gemini API
                                          ↓
                                    pgvector (RAG)
                                    Supabase (DB)
```

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Your Supabase project with the chatbot migration applied
- Gemini API key (free tier)

### 2. Run the SQL Migration

Go to your **Supabase Dashboard → SQL Editor** and run the contents of:
```
../supabase/migrations/20250519_chatbot_phase1.sql
```

This adds pgvector, chat tables, persona tables, and document chunks with HNSW indexing.

### 3. Set Up Environment

```bash
cd chatbot-backend
cp .env.example .env
```

Edit `.env` with your actual values:
- `GEMINI_API_KEY` — Get from https://aistudio.google.com/apikey
- `DATABASE_URL` — Supabase Dashboard → Settings → Database → Connection string (URI format)
  - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

### 4. Install & Run

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 5. Ingest Articles

Seed your vector DB with existing blog articles:

```bash
python -m scripts.ingest_articles
```

### 6. Connect Frontend

The frontend is already configured. Just make sure your frontend `.env` has:
```
VITE_CHATBOT_API_URL=http://localhost:8000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | SSE streaming chat (main endpoint) |
| `POST` | `/api/chat/sync` | Non-streaming fallback |
| `GET` | `/api/health` | Health check |
| `GET` | `/docs` | OpenAPI documentation |

## LangGraph Pipeline

```
validate_input → fetch_context → rag_search → assemble_prompt → [SSE Stream]
```

Each node runs as an async function. The graph handles validation routing (invalid messages skip to END).

## Project Structure

```
app/
├── main.py          # FastAPI app + lifecycle
├── config.py        # Settings from .env
├── api/
│   ├── chat.py      # SSE chat endpoint + circuit breaker
│   └── health.py    # Health check
├── graph/
│   ├── state.py     # ChatState TypedDict
│   ├── nodes.py     # 4 pipeline nodes
│   └── builder.py   # Graph construction
├── rag/
│   ├── embed_search.py  # Gemini embeddings + pgvector search
│   └── inject.py        # Prompt assembly + token budgeting
├── compliance/
│   └── sebi.py      # SEBI disclaimer + blocked words
├── db/
│   ├── connection.py    # asyncpg pool + pgvector
│   └── repositories.py # All CRUD operations
└── models/
    └── chat.py      # Pydantic schemas
```

## Free Tier Stack

| Service | Provider | Cost |
|---------|----------|------|
| LLM | Gemini (gemma-4-31b-it) | Free |
| Embeddings | Gemini (text-embedding-004) | Free |
| Vector DB | pgvector (Supabase) | Free tier |
| Database | Supabase PostgreSQL | Free tier |
| Deployment | Render.com | Free tier |
