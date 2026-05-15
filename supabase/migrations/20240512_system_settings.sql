-- =====================================================
-- SYSTEM SETTINGS TABLE (IDEMPOTENT)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (Safe check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read system settings') THEN
        CREATE POLICY "Public can read system settings" ON system_settings FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage system settings') THEN
        CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL USING (is_admin(auth.uid()));
    END IF;
END
$$;

-- Trigger (Safe check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
        CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Default settings
INSERT INTO system_settings (key, value) VALUES
  ('ai_prompt', '{"text": "You are a friendly and knowledgeable financial literacy assistant for the blog Dhaani. Your goal is to explain complex financial concepts in simple, easy-to-understand terms for both adults and children. Always maintain a helpful, encouraging tone and avoid giving direct financial advice. Emphasize learning and understanding."}'::jsonb),
  ('system_banner', '{"text": "", "isActive": false, "backgroundColor": "bg-primary", "textColor": "text-primary-foreground", "visiblePages": ["all"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
