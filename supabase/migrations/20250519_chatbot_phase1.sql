-- =====================================================
-- CHATBOT SCHEMA MIGRATION — Phase 1
-- =====================================================
-- Run this in Supabase SQL Editor to add chatbot tables
-- This extends the existing schema with vector search,
-- chat sessions, personas, and source document tracking.
-- =====================================================

-- 1. Enable pgvector extension (Supabase supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT DEFAULT 'reactive',       -- reactive | proactive
    initiation_type TEXT DEFAULT 'user_message', -- user_message | nudge_article | nudge_calc
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    message_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Index for quick user session lookup
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user 
    ON chat_sessions(user_id, started_at DESC);

-- 3. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,                          -- user | assistant | system
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    model_used TEXT DEFAULT '',
    rag_chunks_used UUID[] DEFAULT '{}',
    compliance_flags JSONB DEFAULT '{}',
    feedback TEXT,                               -- like | dislike | null
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching session history
CREATE INDEX IF NOT EXISTS idx_chat_messages_session 
    ON chat_messages(session_id, created_at);

-- 4. User personas (persistent, versioned)
CREATE TABLE IF NOT EXISTS user_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    version INT DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}',
    confidence_scores JSONB DEFAULT '{}',
    last_enriched_at TIMESTAMPTZ,
    consent_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Source documents registry
CREATE TABLE IF NOT EXISTS source_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE,
    title TEXT,
    namespace TEXT NOT NULL,
    doc_hash TEXT,
    last_crawled_at TIMESTAMPTZ,
    chunk_count INT DEFAULT 0,
    trust_level INT DEFAULT 3,                  -- 1=user, 3=news, 5=internal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Document chunks with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
    namespace TEXT NOT NULL,                     -- regulations | concepts | news | tax | products
    content TEXT NOT NULL,
    content_hash TEXT UNIQUE NOT NULL,
    embedding vector(768),                      -- Gemini text-embedding-004 = 768 dims
    metadata JSONB DEFAULT '{}',
    source_date TIMESTAMPTZ,
    ttl_days INT,                               -- NULL = no expiry, 90 = news
    superseded_by UUID REFERENCES document_chunks(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
    ON document_chunks 
    USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 128);

-- Index for namespace filtering
CREATE INDEX IF NOT EXISTS idx_chunks_namespace 
    ON document_chunks(namespace);

-- Index for TTL expiry checks
CREATE INDEX IF NOT EXISTS idx_chunks_ttl 
    ON document_chunks(created_at, ttl_days) 
    WHERE ttl_days IS NOT NULL;

-- 7. RLS Policies (allow service role full access, anon limited)
-- Chat sessions: users can only see their own
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to sessions" ON chat_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Chat messages: users can only see messages in their sessions
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
    );
CREATE POLICY "Service role full access to messages" ON chat_messages
    FOR ALL USING (auth.role() = 'service_role');

-- User personas: users can only see their own
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own persona" ON user_personas
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to personas" ON user_personas
    FOR ALL USING (auth.role() = 'service_role');

-- Document chunks: public read access (for RAG)
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read chunks" ON document_chunks
    FOR SELECT USING (true);
CREATE POLICY "Service role full access to chunks" ON document_chunks
    FOR ALL USING (auth.role() = 'service_role');

-- Source documents: public read
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read source docs" ON source_documents
    FOR SELECT USING (true);
CREATE POLICY "Service role full access to source docs" ON source_documents
    FOR ALL USING (auth.role() = 'service_role');

-- 8. Triggers for updated_at
CREATE TRIGGER update_user_personas_updated_at 
    BEFORE UPDATE ON user_personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_chunks_updated_at 
    BEFORE UPDATE ON document_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
