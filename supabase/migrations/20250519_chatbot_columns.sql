-- =====================================================
-- CHATBOT SCHEMA — Column additions (safe to re-run)
-- =====================================================
-- Run if user_personas is missing confidence_scores

ALTER TABLE user_personas ADD COLUMN IF NOT EXISTS confidence_scores JSONB DEFAULT '{}';
ALTER TABLE user_personas ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;
ALTER TABLE source_documents ADD COLUMN IF NOT EXISTS chunk_count INT DEFAULT 0;
