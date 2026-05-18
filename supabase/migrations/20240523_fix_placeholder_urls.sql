-- =====================================================
-- Migration: Fix absolute placeholder URLs in seed data
-- Date: 2024-05-23
-- =====================================================

-- Fix existing affiliate links that have the broken absolute placeholder URL
UPDATE affiliate_links
SET logo_url = '/placeholder.svg'
WHERE logo_url = 'https://placeholder.svg';

-- Fix any articles, modules, or other content that may reference it
UPDATE articles
SET image = '/placeholder.svg'
WHERE image = 'https://placeholder.svg';

UPDATE modules
SET image = '/placeholder.svg'
WHERE image = 'https://placeholder.svg';

UPDATE events
SET image = '/placeholder.svg'
WHERE image = 'https://placeholder.svg';

UPDATE junior_modules
SET image = '/placeholder.svg'
WHERE image = 'https://placeholder.svg';

UPDATE video_series
SET thumbnail = '/placeholder.svg'
WHERE thumbnail = 'https://placeholder.svg';