-- =====================================================
-- CHATBOT SCHEMA MIGRATION — DPDPA Consent + Compliance Audit
-- =====================================================
-- Run AFTER 20250519_chatbot_phase1_supplement.sql
-- =====================================================

-- 1. Consent log (DPDPA compliance)
CREATE TABLE IF NOT EXISTS consent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_category TEXT NOT NULL,  -- browsing | financial | personal | behavioral | chat_history
    consent_given BOOLEAN NOT NULL,
    purpose TEXT,
    version TEXT DEFAULT '1.0',
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user
    ON consent_log(user_id, data_category, version);

-- 2. Compliance audit log
CREATE TABLE IF NOT EXISTS compliance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    check_type TEXT NOT NULL,  -- sebi | hallucination | dpdpa | escalation
    result TEXT NOT NULL,      -- pass | block | warn | escalate
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_session
    ON compliance_audit(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_type
    ON compliance_audit(check_type, result);

-- 3. RLS Policies
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own consent" ON consent_log
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to consent" ON consent_log
    FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE compliance_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to audit" ON compliance_audit
    FOR ALL USING (auth.role() = 'service_role');
