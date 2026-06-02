
      -- =====================================================
      -- CONSOLIDATED SCHEMA AUTO-GENERATED
      -- =====================================================
      
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    

-- Migration: 20240512_system_settings.sql
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
  ('ai_prompt', '{"text": "You are a friendly and knowledgeable financial literacy assistant for the blog KAMADA. Your goal is to explain complex financial concepts in simple, easy-to-understand terms for both adults and children. Always maintain a helpful, encouraging tone and avoid giving direct financial advice. Emphasize learning and understanding."}'::jsonb),
  ('system_banner', '{"text": "", "isActive": false, "backgroundColor": "bg-primary", "textColor": "text-primary-foreground", "visiblePages": ["all"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- Migration: 20240513_gamification_seo.sql
-- =====================================================
-- GAMIFICATION & SEO SCHEMA UPDATES
-- =====================================================

-- 1. Add XP to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- 2. Create Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  xp_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own quiz results') THEN
        CREATE POLICY "Users can read own quiz results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own quiz results') THEN
        CREATE POLICY "Users can insert own quiz results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- 3. Function to submit quiz and get live stats (Percentile, XP)
CREATE OR REPLACE FUNCTION submit_quiz_and_get_stats(
  p_quiz_id TEXT,
  p_score INTEGER,
  p_total INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_xp_to_add INTEGER;
  v_new_total_xp INTEGER;
  v_percentile FLOAT;
  v_total_users INTEGER;
  v_users_below INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate XP: 10 per correct answer, bonus 50 for perfect score
  v_xp_to_add := (p_score * 10);
  IF p_score = p_total AND p_total > 0 THEN
    v_xp_to_add := v_xp_to_add + 50;
  END IF;

  -- Record the result
  INSERT INTO quiz_results (user_id, quiz_id, score, total, xp_awarded)
  VALUES (v_user_id, p_quiz_id, p_score, p_total, v_xp_to_add);

  -- Update profile XP
  UPDATE profiles 
  SET xp = xp + v_xp_to_add 
  WHERE id = v_user_id
  RETURNING xp INTO v_new_total_xp;

  -- Calculate percentile rank
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_users_below FROM profiles WHERE xp < v_new_total_xp;
  
  IF v_total_users > 1 THEN
    v_percentile := (v_users_below::FLOAT / (v_total_users - 1)::FLOAT) * 100;
  ELSE
    v_percentile := 100;
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded', v_xp_to_add,
    'total_xp', v_new_total_xp,
    'percentile', ROUND(v_percentile::numeric, 1)
  );
END;
$$;

-- 4. SEO Metadata Columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE modules ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE video_series ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE video_series ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS seo_description TEXT;


-- Migration: 20240514_scheduled_publishing.sql
-- =====================================================
-- SCHEDULED PUBLISHING UPDATES
-- =====================================================

-- Add scheduled_for column to all content tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE video_series ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_for ON articles(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_modules_scheduled_for ON modules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_video_series_scheduled_for ON video_series(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_events_scheduled_for ON events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_junior_modules_scheduled_for ON junior_modules(scheduled_for);

-- Comment for documentation
COMMENT ON COLUMN articles.scheduled_for IS 'Optional date/time for the content to automatically go live.';

-- =====================================================
-- PERSONALIZED RECOMMENDATIONS RPC
-- =====================================================

CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_interests TEXT[],
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  excerpt TEXT,
  category TEXT,
  image TEXT,
  tags JSONB,
  views INTEGER,
  likes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  content_type TEXT,
  relevance_score INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH all_content AS (
    -- Articles
    SELECT 
      a.id, a.title, a.excerpt, a.category, a.image, 
      (SELECT jsonb_agg(t) FROM jsonb_array_elements(a.tags) t) as tags,
      a.views, a.likes, a.created_at, 'article' as content_type,
      (SELECT COUNT(*) FROM jsonb_array_elements(a.tags) t WHERE t->>'name' = ANY(p_user_interests))::INTEGER as match_count
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
    
    UNION ALL
    
    -- Modules
    SELECT 
      m.id, m.title, m.description as excerpt, 'Modules' as category, m.image, 
      jsonb_build_array(m.tag) as tags,
      m.views, m.likes, m.created_at, 'module' as content_type,
      (CASE WHEN m.tag->>'name' = ANY(p_user_interests) THEN 1 ELSE 0 END)::INTEGER as match_count
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
  )
  SELECT 
    ac.id, ac.title, ac.excerpt, ac.category, ac.image, ac.tags, 
    ac.views, ac.likes, ac.created_at, ac.content_type,
    (ac.match_count * 100 + (ac.views / 100) + ac.likes)::INTEGER as relevance_score
  FROM all_content ac
  WHERE ac.match_count > 0 OR p_user_interests IS NULL OR array_length(p_user_interests, 1) = 0
  ORDER BY relevance_score DESC, ac.created_at DESC
  LIMIT p_limit;
END;
$$;


-- Migration: 20240515_affiliates_bookmarks.sql
-- =====================================================
-- AFFILIATE & BOOKMARKS MIGRATION
-- =====================================================

-- 1. Affiliate Links Table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'Other',
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Bookmarks Table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, -- 'article' | 'module' | 'video'
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read active affiliate links') THEN
        CREATE POLICY "Public can read active affiliate links" ON affiliate_links FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage affiliate links') THEN
        CREATE POLICY "Admins can manage affiliate links" ON affiliate_links FOR ALL USING (is_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own bookmarks') THEN
        CREATE POLICY "Users can manage own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_affiliate_links_updated_at') THEN
        CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- RPC to track affiliate clicks safely
CREATE OR REPLACE FUNCTION track_affiliate_click(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = p_id;
END;
$$;


-- Migration: 20240516_events_upgrade.sql
-- =====================================================
-- EVENTS SYSTEM UPGRADE
-- =====================================================

-- 1. Add new columns to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS virtual_lobby_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- 2. Create Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own registrations') THEN
        CREATE POLICY "Users can view their own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all registrations') THEN
        CREATE POLICY "Admins can view all registrations" ON event_registrations FOR SELECT USING (is_admin(auth.uid()));
    END IF;
END
$$;

-- 3. RPC to register for an event (handles capacity and waitlist)
CREATE OR REPLACE FUNCTION register_for_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_capacity INTEGER;
  v_current_count INTEGER;
  v_status TEXT;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get event capacity
  SELECT capacity INTO v_capacity FROM events WHERE id = p_event_id;
  
  -- Get current active registrations
  SELECT COUNT(*) INTO v_current_count 
  FROM event_registrations 
  WHERE event_id = p_event_id AND status = 'registered';

  -- Determine status
  IF v_current_count < v_capacity THEN
    v_status := 'registered';
  ELSE
    v_status := 'waitlisted';
  END IF;

  -- Insert or Update (if previously cancelled)
  INSERT INTO event_registrations (event_id, user_id, status)
  VALUES (p_event_id, v_user_id, v_status)
  ON CONFLICT (event_id, user_id) 
  DO UPDATE SET status = v_status, created_at = NOW();

  -- Increment the 'registered' count in events table for quick caching if it's not waitlisted
  IF v_status = 'registered' THEN
    UPDATE events SET registered = registered + 1 WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'message', CASE WHEN v_status = 'registered' THEN 'Successfully registered!' ELSE 'Event is full. You are on the waitlist.' END
  );
END;
$$;

-- 4. RPC to unregister
CREATE OR REPLACE FUNCTION unregister_from_event(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_status TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Get old status before deleting
  SELECT status INTO v_old_status 
  FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- Delete the registration
  DELETE FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- If was registered, decrement the counter
  IF v_old_status = 'registered' THEN
    UPDATE events SET registered = GREATEST(0, registered - 1) WHERE id = p_event_id;
    
    -- Potential: Promote first person from waitlist
    -- For simplicity in this v1, we just decrement.
  END IF;
END;
$$;


-- Migration: 20240517_critical_fixes.sql
-- =====================================================
-- CRITICAL FIXES MIGRATION
-- =====================================================

-- 1. XP RACE CONDITION & INTEGRITY
-- Prevent duplicate submissions for the same quiz (users can only get XP once per quiz)
ALTER TABLE quiz_results ADD CONSTRAINT unique_user_quiz UNIQUE (user_id, quiz_id);

-- 2. SYSTEM SETTINGS SECURITY
-- Drop broad public read policy
DROP POLICY IF EXISTS "Public can read system settings" ON system_settings;

-- New targeted policy: Public can only see NON-sensitive keys (like banners)
CREATE POLICY "Public can read non-sensitive settings" ON system_settings
  FOR SELECT USING (key != 'ai_prompt');

-- Admins can still see everything (existing policy "Admins can manage system settings" covers this)

-- 3. RECURSIVE DELETION (CASCADE)
-- Ensure deleting a module deletes its chapters
ALTER TABLE module_chapters 
  DROP CONSTRAINT IF EXISTS module_chapters_module_id_fkey,
  ADD CONSTRAINT module_chapters_module_id_fkey 
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

-- Ensure deleting a video series deletes its videos
ALTER TABLE video_chapters 
  DROP CONSTRAINT IF EXISTS video_chapters_series_id_fkey,
  ADD CONSTRAINT video_chapters_series_id_fkey 
    FOREIGN KEY (series_id) REFERENCES video_series(id) ON DELETE CASCADE;

-- 4. SERVER-SIDE SEARCH ENGINE
CREATE OR REPLACE FUNCTION search_content(p_query TEXT, p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  image TEXT,
  tags JSONB,
  link TEXT,
  read_time TEXT,
  views INTEGER,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    -- Articles
    SELECT 
      a.id, a.title, a.category, a.image, a.tags,
      CASE WHEN a.category = 'Newsletter' THEN '/newsletter/' || a.id ELSE '/post/' || a.id END as link,
      a.read_time, a.views,
      ts_rank(to_tsvector('english', a.title || ' ' || a.excerpt), plainto_tsquery('english', p_query)) as rank
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
    
    UNION ALL
    
    -- Modules
    SELECT 
      m.id, m.title, 'Modules' as category, m.image, jsonb_build_array(m.tag) as tags,
      '/modules/' || m.id as link,
      m.total_read_time as read_time, m.views,
      ts_rank(to_tsvector('english', m.title || ' ' || m.description), plainto_tsquery('english', p_query)) as rank
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
    
    UNION ALL
    
    -- Video Series
    SELECT 
      v.id, v.title, 'Videos' as category, v.thumbnail as image, jsonb_build_array(v.tag) as tags,
      '/videos/' || v.id as link,
      v.total_duration as read_time, v.views,
      ts_rank(to_tsvector('english', v.title || ' ' || v.description), plainto_tsquery('english', p_query)) as rank
    FROM video_series v
    WHERE v.is_published = true AND (v.scheduled_for IS NULL OR v.scheduled_for <= NOW())
  )
  SELECT sr.id, sr.title, sr.category, sr.image, sr.tags, sr.link, sr.read_time, sr.views, sr.rank::REAL as search_rank
  FROM search_results sr
  WHERE sr.rank > 0
  ORDER BY sr.rank DESC, sr.views DESC
  LIMIT p_limit;
END;
$$;


-- Migration: 20240518_missing_elements.sql
-- =====================================================
-- FINAL CRITICAL SCHEMA FIXES
-- =====================================================

-- 1. Ensure user_bookmarks exists
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, 
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own bookmarks') THEN
        CREATE POLICY "Users can manage own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 2. Increment Variant RPCs (for A/B Testing)
CREATE OR REPLACE FUNCTION increment_variant_views(variant_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ab_test_variants SET views = views + 1 WHERE id = variant_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_clicks(variant_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ab_test_variants SET clicks = clicks + 1 WHERE id = variant_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_conversions(variant_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ab_test_variants SET conversions = conversions + 1 WHERE id = variant_id;
END;
$$;

-- 3. Utility Function (if missing)
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER LANGUAGE sql AS $$
  SELECT x + 1;
$$;


-- Migration: 20240519_hardening.sql
-- =====================================================
-- HARDENING & INTEGRITY MIGRATION
-- =====================================================

-- 1. SEARCH PERFORMANCE (GIN INDEXES)
-- Setup full-text search columns and indexes for lightning fast search
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vector);

ALTER TABLE modules ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_modules_search ON modules USING GIN(search_vector);

ALTER TABLE video_series ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_video_series_search ON video_series USING GIN(search_vector);

-- Update search_content RPC to use the indexes (replaces plainto_tsquery with indexed @@ match)
CREATE OR REPLACE FUNCTION search_content(p_query TEXT, p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  image TEXT,
  tags JSONB,
  link TEXT,
  read_time TEXT,
  views INTEGER,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_query tsquery;
BEGIN
  -- Format query for partial matches (e.g. "inv" matches "investing")
  v_query := websearch_to_tsquery('english', p_query);
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      a.id, a.title, a.category, a.image, a.tags,
      CASE WHEN a.category = 'Newsletter' THEN '/newsletter/' || a.id ELSE '/post/' || a.id END as link,
      a.read_time, a.views,
      ts_rank(a.search_vector, v_query) as rank
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
      AND a.search_vector @@ v_query
    
    UNION ALL
    
    SELECT 
      m.id, m.title, 'Modules' as category, m.image, jsonb_build_array(m.tag) as tags,
      '/modules/' || m.id as link,
      m.total_read_time as read_time, m.views,
      ts_rank(m.search_vector, v_query) as rank
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
      AND m.search_vector @@ v_query
    
    UNION ALL
    
    SELECT 
      v.id, v.title, 'Videos' as category, v.thumbnail as image, jsonb_build_array(v.tag) as tags,
      '/videos/' || v.id as link,
      v.total_duration as read_time, v.views,
      ts_rank(v.search_vector, v_query) as rank
    FROM video_series v
    WHERE v.is_published = true AND (v.scheduled_for IS NULL OR v.scheduled_for <= NOW())
      AND v.search_vector @@ v_query
  )
  SELECT sr.id, sr.title, sr.category, sr.image, sr.tags, sr.link, sr.read_time, sr.views, sr.rank::REAL as search_rank
  FROM search_results sr
  ORDER BY sr.rank DESC, sr.views DESC
  LIMIT p_limit;
END;
$$;

-- 2. SYSTEM SETTINGS SECURITY
-- Explicit whitelist for public settings
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON system_settings;
CREATE POLICY "Public can read only non-sensitive settings" ON system_settings
  FOR SELECT USING (key IN ('system_banner'));
-- =====================================================
-- HARDENING & INTEGRITY MIGRATION
-- =====================================================

-- 1. SEARCH PERFORMANCE (GIN INDEXES)
-- Setup full-text search columns and indexes for lightning fast search
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vector);

ALTER TABLE modules ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_modules_search ON modules USING GIN(search_vector);

ALTER TABLE video_series ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_video_series_search ON video_series USING GIN(search_vector);

-- Update search_content RPC to use the indexes (replaces plainto_tsquery with indexed @@ match)
CREATE OR REPLACE FUNCTION search_content(p_query TEXT, p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  image TEXT,
  tags JSONB,
  link TEXT,
  read_time TEXT,
  views INTEGER,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_query tsquery;
BEGIN
  -- Format query for partial matches (e.g. "inv" matches "investing")
  v_query := websearch_to_tsquery('english', p_query);
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      a.id, a.title, a.category, a.image, a.tags,
      CASE WHEN a.category = 'Newsletter' THEN '/newsletter/' || a.id ELSE '/post/' || a.id END as link,
      a.read_time, a.views,
      ts_rank(a.search_vector, v_query) as rank
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
      AND a.search_vector @@ v_query
    
    UNION ALL
    
    SELECT 
      m.id, m.title, 'Modules' as category, m.image, jsonb_build_array(m.tag) as tags,
      '/modules/' || m.id as link,
      m.total_read_time as read_time, m.views,
      ts_rank(m.search_vector, v_query) as rank
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
      AND m.search_vector @@ v_query
    
    UNION ALL
    
    SELECT 
      v.id, v.title, 'Videos' as category, v.thumbnail as image, jsonb_build_array(v.tag) as tags,
      '/videos/' || v.id as link,
      v.total_duration as read_time, v.views,
      ts_rank(v.search_vector, v_query) as rank
    FROM video_series v
    WHERE v.is_published = true AND (v.scheduled_for IS NULL OR v.scheduled_for <= NOW())
      AND v.search_vector @@ v_query
  )
  SELECT sr.id, sr.title, sr.category, sr.image, sr.tags, sr.link, sr.read_time, sr.views, sr.rank::REAL as search_rank
  FROM search_results sr
  ORDER BY sr.rank DESC, sr.views DESC
  LIMIT p_limit;
END;
$$;

-- 2. SYSTEM SETTINGS SECURITY
-- Explicit whitelist for public settings
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON system_settings;
CREATE POLICY "Public can read only non-sensitive settings" ON system_settings
  FOR SELECT USING (key IN ('system_banner'));

-- 3. CROSS-DEVICE PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Migration: oauth_improvements.sql
-- =====================================================
-- MIGRATION: OAuth Flow Improvements
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add signup_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'signup_method'
  ) THEN
    ALTER TABLE profiles ADD COLUMN signup_method TEXT DEFAULT 'email';
  END IF;
END $$;

-- Update existing profiles to set signup_method to 'email' where null
UPDATE profiles SET signup_method = 'email' WHERE signup_method IS NULL;

-- Update handle_new_user function to capture OAuth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
  admin_role_id UUID;
  provider TEXT;
  full_name TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  avatar_val TEXT;
  space_idx INTEGER;
BEGIN
  -- Get role IDs
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Check if email is in admin list
  IF NEW.email IN ('goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com') THEN
    INSERT INTO user_roles (user_id, role_id) VALUES (NEW.id, admin_role_id);
  ELSE
    INSERT INTO user_roles (user_id, role_id) VALUES (NEW.id, user_role_id);
  END IF;
  
  -- Detect OAuth provider from identities or app_metadata
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  
  -- Extract full name from OAuth providers (Google, Twitter provide full_name)
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  
  -- Parse full_name into first_name and last_name
  IF full_name <> '' THEN
    space_idx := position(' ' in full_name);
    IF space_idx > 0 THEN
      first_name_val := substring(full_name from 1 for space_idx - 1);
      last_name_val := substring(full_name from space_idx + 1);
    ELSE
      first_name_val := full_name;
      last_name_val := '';
    END IF;
  ELSE
    -- Fallback to separate firstName/lastName fields
    first_name_val := COALESCE(NEW.raw_user_meta_data->>'firstName', '');
    last_name_val := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
  END IF;
  
  -- Extract avatar URL from OAuth providers
  avatar_val := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',  -- Google sometimes uses 'picture'
    NULL
  );
  
  -- Create profile with OAuth data
  INSERT INTO profiles (
    id, 
    first_name, 
    last_name, 
    email, 
    avatar_url,
    signup_method,
    created_at
  ) VALUES (
    NEW.id, 
    first_name_val,
    last_name_val,
    NEW.email,
    avatar_val,
    provider,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for signup_method (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_signup_method ON profiles(signup_method);

-- Comment for documentation
COMMENT ON COLUMN profiles.signup_method IS 'Tracks how the user signed up: email, google, or twitter';
