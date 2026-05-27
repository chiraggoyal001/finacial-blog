-- =====================================================
-- REMOVE UNRELIABLE pg_net EMAIL WEBHOOK TRIGGERS
-- =====================================================
-- These triggers used net.http_post to call /api/send-email
-- but failed due to:
--   1. pg_net async worker limitations on Supabase
--   2. The /api/send-email route was never registered in routes.ts (404)
--   3. RLS on system_settings blocked reading api_base_url
--
-- Email dispatch is now handled directly from application code.
-- =====================================================

-- Remove triggers
DROP TRIGGER IF EXISTS trg_profile_signup ON profiles;
DROP TRIGGER IF EXISTS trg_profile_subscription ON profiles;
DROP TRIGGER IF EXISTS trg_event_registration ON event_registrations;

-- Remove the trigger function
DROP FUNCTION IF EXISTS trigger_send_email_webhook();

-- Clean up the system_settings row that was only used by the trigger
DELETE FROM system_settings WHERE key = 'api_base_url';
