-- Migration: Add partner_platforms to whitelisted system settings
DROP POLICY IF EXISTS "Public can read whitelisted settings" ON system_settings;
DROP POLICY IF EXISTS "Public can read only non-sensitive settings" ON system_settings;
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON system_settings;

CREATE POLICY "Public can read whitelisted settings" 
  ON system_settings 
  FOR SELECT 
  USING (key IN ('system_banner', 'partner_platforms'));
