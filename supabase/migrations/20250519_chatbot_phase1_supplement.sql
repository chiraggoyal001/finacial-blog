-- =====================================================
-- CHATBOT SCHEMA MIGRATION — Phase 1 Supplement
-- =====================================================
-- Additional tables for Session Context Bridge and
-- Proactive Nudge Engine.
-- Run AFTER 20250519_chatbot_phase1.sql
-- =====================================================

-- 1. Session signals (browsing context capture)
CREATE TABLE IF NOT EXISTS session_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    signal_type TEXT NOT NULL,  -- page_view | scroll_depth | calc_use | search | return_visit
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for 48h window queries (user + time range)
CREATE INDEX IF NOT EXISTS idx_session_signals_user_time 
    ON session_signals(user_id, created_at DESC);

-- Index for signal type filtering
CREATE INDEX IF NOT EXISTS idx_session_signals_type
    ON session_signals(signal_type);

-- 2. Nudge log (proactive chat tracking)
CREATE TABLE IF NOT EXISTS nudge_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nudge_type TEXT NOT NULL,  -- article_goal | calc_use | return_visit | deadline | general
    score FLOAT NOT NULL,
    opener_text TEXT,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    dismissed BOOLEAN DEFAULT FALSE,
    engaged BOOLEAN DEFAULT FALSE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'
);

-- Index for user nudge history
CREATE INDEX IF NOT EXISTS idx_nudge_log_user
    ON nudge_log(user_id, shown_at DESC);

-- Index for dismissal rate queries
CREATE INDEX IF NOT EXISTS idx_nudge_log_dismissed
    ON nudge_log(user_id, dismissed) WHERE dismissed = true;

-- 3. RLS Policies
ALTER TABLE session_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to signals" ON session_signals
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own signals" ON session_signals
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE nudge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to nudge_log" ON nudge_log
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own nudges" ON nudge_log
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Auto-cleanup: delete signals older than 7 days (run via cron)
-- This can be set up as a Supabase pg_cron job:
-- SELECT cron.schedule('cleanup-old-signals', '0 3 * * *', $$
--   DELETE FROM session_signals WHERE created_at < NOW() - INTERVAL '7 days';
-- $$);
