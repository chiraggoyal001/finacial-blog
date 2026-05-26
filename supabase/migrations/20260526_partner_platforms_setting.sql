-- =====================================================
-- Migration: Partner Platforms & Trust Badges Visibility Settings
-- Adds default settings for partner logos and badges visibility.
-- =====================================================

INSERT INTO system_settings (key, value) VALUES
  ('partner_platforms', '{
    "isVisible": true,
    "logos": {
      "zerodha": true,
      "groww": true,
      "bloomberg": true,
      "moneycontrol": true,
      "upstox": true
    },
    "badges": {
      "factChecked": true,
      "structuredPaths": true,
      "topRated": true
    }
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
