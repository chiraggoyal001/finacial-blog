-- =====================================================
-- AUTHORITATIVE SEED DATA SQL
-- Consolidates data from seed_data.sql, seed.js, and seed-direct.mjs
-- Includes System Settings and Affiliate Links
-- =====================================================

-- 1. System Settings (Sections 1-8 containing hardcoded mock content removed)

-- 9. System Settings
INSERT INTO system_settings (key, value) VALUES
  ('ai_prompt', '{"text": "You are a friendly and knowledgeable financial literacy assistant for the blog KAMADA. Your goal is to explain complex financial concepts in simple, easy-to-understand terms for both adults and children. Always maintain a helpful, encouraging tone and avoid giving direct financial advice. Emphasize learning and understanding."}'::jsonb),
  ('system_banner', '{"text": "Welcome to KAMADA! Start your financial learning journey today.", "isActive": true, "backgroundColor": "bg-primary", "textColor": "text-primary-foreground", "visiblePages": ["all"]}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 10. Affiliate Links
INSERT INTO affiliate_links (
  name, url, logo_url, description, category, is_active, 
  visibility_rules, scheduling, targeting_rules, chatbot_controlled, chatbot_prompt
) VALUES
(
  'Trusted Broker A',
  'https://example.com/broker-a?ref=dhaani',
  '/placeholder.svg',
  'A reliable platform for stock market investments with low fees.',
  'Investing',
  true,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, false, NULL
),
(
  'Savings App B',
  'https://example.com/savings-b?ref=dhaani',
  '/placeholder.svg',
  'Automate your savings and earn better interest rates.',
  'Banking',
  true,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, false, NULL
),
(
  'Tax Planner C',
  'https://example.com/tax-c?ref=dhaani',
  '/placeholder.svg',
  'Simplify your annual tax filings with expert guidance.',
  'Planning',
  true,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, false, NULL
);

-- =====================================================
-- Done! Authoritative seed data inserted.
-- =====================================================
