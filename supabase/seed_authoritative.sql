-- =====================================================
-- AUTHORITATIVE SEED DATA SQL
-- Consolidates data from seed_data.sql, seed.js, and seed-direct.mjs
-- Includes System Settings and Affiliate Links
-- =====================================================

-- 1. Insert Articles
INSERT INTO articles (title, excerpt, content, category, author_name, image, read_time, tags, views, likes, is_published) VALUES
(
  'Understanding Market Dynamics in 2025',
  'A deep dive into the forces shaping global markets this year.',
  '<p>The global financial markets in 2025 are defined by a complex interplay of geopolitical tensions, central bank policies, and technological disruption.</p><h2>Key Drivers</h2><p>Interest rates across major economies have begun a cautious descent.</p><h2>Our Outlook</h2><p>We maintain a cautiously optimistic stance for H2 2025.</p>',
  'Newsletter',
  'Editorial Team',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
  '5 min',
  '[{"name": "Markets", "type": "major"}, {"name": "Analysis", "type": "minor"}]'::jsonb,
  1240,
  89,
  true
),
(
  'Beginner''s Guide to Financial Planning',
  'Everything you need to know to start your financial planning journey.',
  '<p>Financial planning is the cornerstone of building long-term wealth.</p><h2>Step 1: Assess Your Position</h2><p>List all your assets, liabilities, income sources.</p><h2>Step 2: Set SMART Goals</h2><p>Specific, Measurable, Achievable goals.</p><h2>Step 3: Create a Budget</h2><p>The 50/30/20 rule.</p>',
  'Modules',
  'Editorial Team',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  '8 min',
  '[{"name": "Planning", "type": "major"}, {"name": "Beginners", "type": "minor"}]'::jsonb,
  980,
  124,
  true
),
(
  'Weekly Market Wrap: Key Takeaways',
  'This week''s top market movements and earnings reports.',
  '<p>Markets ended the week on a positive note, with the S&P 500 gaining 1.2%.</p><h2>Earnings Highlights</h2><p>Tech giants reported better-than-expected earnings.</p>',
  'Newsletter',
  'Editorial Team',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
  '4 min',
  '[{"name": "Markets", "type": "major"}, {"name": "Weekly", "type": "minor"}]'::jsonb,
  2100,
  156,
  true
),
(
  'Investment Strategies for Young Professionals',
  'How to build a strong portfolio even when you''re just starting your career.',
  '<p>Starting to invest early is one of the most powerful financial decisions you can make. Compound interest works best with time on your side.</p><h2>Start with Index Funds</h2><p>Low-cost index funds provide instant diversification and have historically outperformed most actively managed funds.</p><h2>The Power of SIP</h2><p>Systematic Investment Plans allow you to invest fixed amounts regularly, averaging out market volatility.</p>',
  'Modules',
  'Editorial Team',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop',
  '6 min',
  '[{"name": "Investing", "type": "major"}, {"name": "Career", "type": "minor"}]'::jsonb,
  760,
  95,
  true
),
(
  'The Rise of Digital Banking',
  'How fintech is reshaping the banking landscape and what it means for consumers.',
  '<p>Digital banking has transformed from a convenience to a necessity. Neo-banks and fintech platforms are challenging traditional banking models.</p><h2>Key Trends</h2><p>Open banking APIs, embedded finance, and AI-driven credit scoring are reshaping how financial services are delivered.</p><h2>Impact on Consumers</h2><p>Lower fees, faster transactions, and more personalized financial products are benefiting consumers.</p>',
  'Videos',
  'Editorial Team',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
  '7 min',
  '[{"name": "Fintech", "type": "major"}, {"name": "Banking", "type": "minor"}]'::jsonb,
  1560,
  210,
  true
);

-- 2. Insert Modules
INSERT INTO modules (title, description, image, tag, total_read_time, youtube_playlist, views, likes, is_published) VALUES
(
  'Stock Market Fundamentals',
  'Learn the basics of stock markets and how to start investing.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
  '{"name": "Investing", "type": "major"}'::jsonb,
  '45 min',
  'https://youtube.com/playlist?list=example1',
  3200,
  245,
  true
),
(
  'Personal Finance Mastery',
  'A guide to managing money, budgeting, and planning.',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  '{"name": "Planning", "type": "major"}'::jsonb,
  '35 min',
  'https://youtube.com/playlist?list=example2',
  2800,
  312,
  true
);

-- 3. Insert Module Chapters
INSERT INTO module_chapters (module_id, title, content, read_time, tags, sort_order)
SELECT 
  id,
  'What is a Stock Market?',
  '<p>A stock market is a marketplace where shares are traded.</p><h2>How It Works</h2><p>Companies list shares through an IPO.</p>',
  '8 min',
  '[{"name": "Investing", "type": "major"}, {"name": "Beginners", "type": "minor"}]'::jsonb,
  0
FROM modules WHERE title = 'Stock Market Fundamentals';

INSERT INTO module_chapters (module_id, title, content, read_time, tags, sort_order)
SELECT 
  id,
  'Types of Stocks',
  '<p>Stocks can be classified by market cap, growth potential.</p><h2>By Market Cap</h2><p>Large-cap, mid-cap, small-cap.</p>',
  '10 min',
  '[{"name": "Investing", "type": "major"}, {"name": "Analysis", "type": "minor"}]'::jsonb,
  1
FROM modules WHERE title = 'Stock Market Fundamentals';

INSERT INTO module_chapters (module_id, title, content, read_time, tags, sort_order)
SELECT 
  id,
  'Budgeting 101',
  '<p>Budgeting is the foundation of personal finance.</p><h2>The 50/30/20 Rule</h2><p>50% needs, 30% wants, 20% savings.</p>',
  '8 min',
  '[{"name": "Planning", "type": "major"}, {"name": "Beginners", "type": "minor"}]'::jsonb,
  0
FROM modules WHERE title = 'Personal Finance Mastery';

-- 4. Insert Video Series
INSERT INTO video_series (title, description, thumbnail, tag, total_duration, views, likes, is_published) VALUES
(
  'Stock Market Fundamentals — Video Course',
  'Visual walkthroughs of stock market concepts.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
  '{"name": "Investing", "type": "major"}'::jsonb,
  '1h 15min',
  5400,
  320,
  true
);

-- 5. Insert Video Chapters
INSERT INTO video_chapters (series_id, title, video_url, duration, description, tags, sort_order)
SELECT 
  id,
  'Introduction to Stock Markets',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  '14:32',
  'Overview of stock markets.',
  '[{"name": "Investing", "type": "major"}, {"name": "Beginners", "type": "minor"}]'::jsonb,
  0
FROM video_series WHERE title = 'Stock Market Fundamentals — Video Course';

INSERT INTO video_chapters (series_id, title, video_url, duration, description, tags, sort_order)
SELECT 
  id,
  'Understanding Stock Prices',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  '18:45',
  'What drives stock prices.',
  '[{"name": "Investing", "type": "major"}, {"name": "Analysis", "type": "minor"}]'::jsonb,
  1
FROM video_series WHERE title = 'Stock Market Fundamentals — Video Course';

-- 6. Insert Events
INSERT INTO events (title, description, type, date, time, location, image, tags, is_upcoming, capacity, registered, is_published) VALUES
(
  'Market Outlook 2026 — Community Meetup',
  'Open discussion on global market trends.',
  'community',
  '2026-04-20',
  '18:00 - 20:00',
  'Mumbai',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
  '[{"name": "Markets", "type": "major"}, {"name": "Trends", "type": "minor"}]'::jsonb,
  true,
  100,
  67,
  true
),
(
  'Personal Finance Quiz Night',
  'Test your financial literacy in a fun quiz.',
  'quiz',
  '2026-04-25',
  '19:00 - 21:00',
  'Online',
  'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600',
  '[{"name": "Planning", "type": "major"}, {"name": "Beginners", "type": "minor"}]'::jsonb,
  true,
  500,
  312,
  true
);

-- 7. Insert Junior Modules
INSERT INTO junior_modules (title, description, image, tag, content_type, total_duration, views, likes, is_published) VALUES
(
  'What is Money? 💰',
  'A fun journey into how money works.',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600',
  '{"name": "Basics", "type": "major"}'::jsonb,
  'video',
  '25 min',
  2400,
  380,
  true
);

-- 8. Insert Junior Chapters
INSERT INTO junior_chapters (module_id, title, content_type, content, video_url, duration, tags, illustration, sort_order)
SELECT 
  id,
  '🪙 Barter to Coins',
  'video',
  'How people traded before money existed.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  '8:00',
  '[{"name": "Basics", "type": "major"}, {"name": "History", "type": "minor"}]'::jsonb,
  'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',
  0
FROM junior_modules WHERE title = 'What is Money? 💰';

INSERT INTO junior_chapters (module_id, title, content_type, content, video_url, duration, tags, illustration, sort_order)
SELECT 
  id,
  '💳 Paper to Plastic',
  'video',
  'How payment evolved over centuries.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  '9:30',
  '[{"name": "Basics", "type": "major"}, {"name": "Trends", "type": "minor"}]'::jsonb,
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
  1
FROM junior_modules WHERE title = 'What is Money? 💰';

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
