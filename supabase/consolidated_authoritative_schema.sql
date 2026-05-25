-- =====================================================
-- CONSOLIDATED AUTHORITATIVE SCHEMA
-- =====================================================
-- Includes all migrations up to 20240522
-- Admin emails: goyalchirag721@gmail.com, anuraggoyal231@gmail.com
-- =====================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing objects (for clean setup)
DROP VIEW IF EXISTS user_engagement_summary CASCADE;
DROP VIEW IF EXISTS content_performance CASCADE;
DROP VIEW IF EXISTS daily_active_users CASCADE;

DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS user_bookmarks CASCADE;
DROP TABLE IF EXISTS affiliate_links CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS ab_test_assignments CASCADE;
DROP TABLE IF EXISTS ab_test_variants CASCADE;
DROP TABLE IF EXISTS ab_tests CASCADE;
DROP TABLE IF EXISTS user_likes CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS content_ratings CASCADE;
DROP TABLE IF EXISTS module_chapters CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS video_chapters CASCADE;
DROP TABLE IF EXISTS video_series CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS junior_chapters CASCADE;
DROP TABLE IF EXISTS junior_modules CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS is_profile_complete CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS submit_quiz_and_get_stats CASCADE;
DROP FUNCTION IF EXISTS get_personalized_recommendations CASCADE;
DROP FUNCTION IF EXISTS track_affiliate_click CASCADE;
DROP FUNCTION IF EXISTS register_for_event CASCADE;
DROP FUNCTION IF EXISTS unregister_from_event CASCADE;
DROP FUNCTION IF EXISTS search_content CASCADE;
DROP FUNCTION IF EXISTS increment_variant_views CASCADE;
DROP FUNCTION IF EXISTS increment_variant_clicks CASCADE;
DROP FUNCTION IF EXISTS increment_variant_conversions CASCADE;
DROP FUNCTION IF EXISTS increment CASCADE;
DROP FUNCTION IF EXISTS rate_content CASCADE;
DROP FUNCTION IF EXISTS track_content_view CASCADE;
DROP FUNCTION IF EXISTS get_chatbot_affiliates CASCADE;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Simple increment
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER LANGUAGE sql AS $$
  SELECT x + 1;
$$;

-- =====================================================
-- ROLES & PERMISSIONS
-- =====================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"can_manage_content": true, "can_manage_users": true, "can_manage_ab_tests": true, "can_view_analytics": true}'::jsonb),
  ('user', '{"can_read_content": true, "can_like_content": true, "can_comment": true}'::jsonb);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

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

-- =====================================================
-- PROFILES & USER DATA
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL, -- REMOVED UNIQUE to prevent OAuth collision
  
  -- Extended persona fields
  age INTEGER CHECK (age >= 1 AND age <= 120),
  region TEXT,
  interests TEXT[] DEFAULT '{}',
  profession TEXT,
  hobbies TEXT,
  description TEXT,
  
  -- Gamification
  xp INTEGER DEFAULT 0,
  
  -- Newsletter & Notifications
  is_subscribed BOOLEAN DEFAULT false,
  mail_preference TEXT DEFAULT 'non-intrusive',
  notify_launches BOOLEAN DEFAULT false,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_skipped_at TIMESTAMP WITH TIME ZONE,
  
  -- Avatar
  avatar_url TEXT,
  
  -- Signup tracking
  signup_method TEXT DEFAULT 'email',
  signup_ip INET,
  signup_user_agent TEXT,
  signup_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle new user signup with OAuth support
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
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Admin role assignment
  IF NEW.email IN ('goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, admin_role_id);
  ELSE
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, user_role_id);
  END IF;
  
  -- Detect provider
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  
  -- Extract name metadata
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  
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
    first_name_val := COALESCE(NEW.raw_user_meta_data->>'firstName', '');
    last_name_val := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
  END IF;
  
  -- Extract avatar
  avatar_val := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );
  
  -- Create profile
  INSERT INTO public.profiles (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- CONTENT TABLES
-- =====================================================

-- Articles (Blog/Newsletter)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'Editorial Team',
  image TEXT,
  read_time TEXT,
  tags JSONB DEFAULT '[]',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  tag JSONB,
  total_read_time TEXT,
  youtube_playlist TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE module_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read_time TEXT,
  tags JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  quiz_questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos
CREATE TABLE video_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  tag JSONB,
  total_duration TEXT,
  linked_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE video_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES video_series(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  quiz_questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  image TEXT,
  tags JSONB DEFAULT '[]',
  is_upcoming BOOLEAN DEFAULT true,
  registration_url TEXT,
  virtual_lobby_url TEXT,
  recording_url TEXT,
  capacity INTEGER,
  registered INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junior Content
CREATE TABLE junior_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  tag JSONB,
  content_type TEXT DEFAULT 'video',
  total_duration TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE junior_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES junior_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'video',
  content TEXT,
  video_url TEXT,
  duration TEXT,
  tags JSONB DEFAULT '[]',
  illustration TEXT,
  sort_order INTEGER DEFAULT 0,
  quiz_questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RATINGS SYSTEM
-- =====================================================

CREATE TABLE content_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- =====================================================
-- INTERACTION & TRACKING TABLES
-- =====================================================

CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_title TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  xp_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, quiz_id)
);

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- =====================================================
-- SYSTEM & EXTERNAL TABLES
-- =====================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'Other',
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  -- Visibility & targeting rules
  visibility_rules JSONB DEFAULT '{}',
  scheduling JSONB DEFAULT '{}',
  targeting_rules JSONB DEFAULT '{}',
  chatbot_controlled BOOLEAN DEFAULT false,
  chatbot_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- A/B TESTING TABLES
-- =====================================================

CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT DEFAULT 'cta',
  status TEXT DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  traffic_percentage INTEGER DEFAULT 50,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES ab_test_variants(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  page_path TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS (Auto-update updated_at)
-- =====================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_chapters_updated_at BEFORE UPDATE ON module_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_series_updated_at BEFORE UPDATE ON video_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_chapters_updated_at BEFORE UPDATE ON video_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_junior_modules_updated_at BEFORE UPDATE ON junior_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_junior_chapters_updated_at BEFORE UPDATE ON junior_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- 1. Submit quiz and update XP
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

  -- Record the result (Unique constraint handles one attempt per quiz)
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

-- 2. Personalized recommendations
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
    SELECT 
      a.id, a.title, a.excerpt, a.category, a.image, 
      (SELECT jsonb_agg(t) FROM jsonb_array_elements(a.tags) t) as tags,
      a.views, a.likes, a.created_at, 'article' as content_type,
      (SELECT COUNT(*) FROM jsonb_array_elements(a.tags) t WHERE t->>'name' = ANY(p_user_interests))::INTEGER as match_count
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
    
    UNION ALL
    
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

-- 3. Affiliate click tracking
CREATE OR REPLACE FUNCTION track_affiliate_click(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = p_id;
END;
$$;

-- 4. Event registration logic
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

  SELECT capacity INTO v_capacity FROM events WHERE id = p_event_id;
  
  SELECT COUNT(*) INTO v_current_count 
  FROM event_registrations 
  WHERE event_id = p_event_id AND status = 'registered';

  IF v_current_count < v_capacity THEN
    v_status := 'registered';
  ELSE
    v_status := 'waitlisted';
  END IF;

  INSERT INTO event_registrations (event_id, user_id, status)
  VALUES (p_event_id, v_user_id, v_status)
  ON CONFLICT (event_id, user_id) 
  DO UPDATE SET status = v_status, created_at = NOW();

  IF v_status = 'registered' THEN
    UPDATE events SET registered = registered + 1 WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'message', CASE WHEN v_status = 'registered' THEN 'Successfully registered!' ELSE 'Event is full. You are on the waitlist.' END
  );
END;
$$;

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
  
  SELECT status INTO v_old_status 
  FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  DELETE FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  IF v_old_status = 'registered' THEN
    UPDATE events SET registered = GREATEST(0, registered - 1) WHERE id = p_event_id;
  END IF;
END;
$$;

-- 5. Search Engine with GIN indexes
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

-- 6. A/B Testing Increments
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

-- 7. Profile completeness checker
CREATE OR REPLACE FUNCTION is_profile_complete(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  IF profile_record IS NULL THEN RETURN false; END IF;
  
  RETURN (
    (CASE WHEN profile_record.age IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN profile_record.region IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN profile_record.interests IS NOT NULL AND array_length(profile_record.interests, 1) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN profile_record.profession IS NOT NULL AND profile_record.profession <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN profile_record.hobbies IS NOT NULL AND profile_record.hobbies <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN profile_record.description IS NOT NULL AND profile_record.description <> '' THEN 1 ELSE 0 END)
  ) >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Rate content RPC
CREATE OR REPLACE FUNCTION rate_content(
  p_content_type TEXT,
  p_content_id UUID,
  p_rating INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_avg DECIMAL(3,2);
  v_count INTEGER;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Upsert the rating
  INSERT INTO content_ratings (user_id, content_type, content_id, rating)
  VALUES (v_user_id, p_content_type, p_content_id, p_rating)
  ON CONFLICT (user_id, content_type, content_id)
  DO UPDATE SET rating = p_rating, created_at = NOW();

  -- Recalculate average and count
  SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*)
  INTO v_avg, v_count
  FROM content_ratings
  WHERE content_type = p_content_type AND content_id = p_content_id;

  -- Update the appropriate content table
  IF p_content_type = 'article' THEN
    UPDATE articles SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  ELSIF p_content_type = 'module' THEN
    UPDATE modules SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  ELSIF p_content_type = 'video' THEN
    UPDATE video_series SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  ELSIF p_content_type = 'junior' THEN
    UPDATE junior_modules SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  END IF;

  RETURN jsonb_build_object(
    'avg_rating', v_avg,
    'rating_count', v_count,
    'user_rating', p_rating
  );
END;
$$;

-- 9. Track content view RPC
CREATE OR REPLACE FUNCTION track_content_view(
  p_content_type TEXT,
  p_content_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_name TEXT;
BEGIN
  v_table_name := CASE p_content_type
    WHEN 'article' THEN 'articles'
    WHEN 'module' THEN 'modules'
    WHEN 'video' THEN 'video_series'
    WHEN 'junior' THEN 'junior_modules'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Invalid content type: %', p_content_type;
  END IF;

  EXECUTE format('UPDATE %I SET views = views + 1 WHERE id = $1', v_table_name)
  USING p_content_id;
END;
$$;

-- 10. Chatbot affiliate fetching
CREATE OR REPLACE FUNCTION get_chatbot_affiliates()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', al.id,
      'name', al.name,
      'url', al.url,
      'logo_url', al.logo_url,
      'description', al.description,
      'category', al.category,
      'chatbot_prompt', al.chatbot_prompt
    )
  ) INTO v_result
  FROM affiliate_links al
  WHERE al.is_active = true AND al.chatbot_controlled = true;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE junior_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE junior_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin(auth.uid()));

-- Roles
CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (is_admin(auth.uid()));

-- Activities
CREATE POLICY "Users can read own activities" ON user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all activities" ON user_activities FOR SELECT USING (is_admin(auth.uid()));

-- Content (Public Read)
CREATE POLICY "Public can read published articles" ON articles FOR SELECT USING (is_published = true AND (scheduled_for IS NULL OR scheduled_for <= NOW()));
CREATE POLICY "Public can read published modules" ON modules FOR SELECT USING (is_published = true AND (scheduled_for IS NULL OR scheduled_for <= NOW()));
CREATE POLICY "Public can read published video series" ON video_series FOR SELECT USING (is_published = true AND (scheduled_for IS NULL OR scheduled_for <= NOW()));
CREATE POLICY "Public can read published events" ON events FOR SELECT USING (is_published = true AND (scheduled_for IS NULL OR scheduled_for <= NOW()));
CREATE POLICY "Public can read published junior modules" ON junior_modules FOR SELECT USING (is_published = true AND (scheduled_for IS NULL OR scheduled_for <= NOW()));

-- Content Chapters
CREATE POLICY "Public can read chapters of published content" ON module_chapters FOR SELECT USING (EXISTS (SELECT 1 FROM modules WHERE id = module_id AND is_published = true));
CREATE POLICY "Public can read video chapters of published series" ON video_chapters FOR SELECT USING (EXISTS (SELECT 1 FROM video_series WHERE id = series_id AND is_published = true));
CREATE POLICY "Public can read junior chapters of published modules" ON junior_chapters FOR SELECT USING (EXISTS (SELECT 1 FROM junior_modules WHERE id = module_id AND is_published = true));

-- Admin Content Management
CREATE POLICY "Admins can manage articles" ON articles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage modules" ON modules FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage module chapters" ON module_chapters FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage video series" ON video_series FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage video chapters" ON video_chapters FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage junior modules" ON junior_modules FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage junior chapters" ON junior_chapters FOR ALL USING (is_admin(auth.uid()));

-- User Interactions
CREATE POLICY "Users can manage own likes" ON user_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read own quiz results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ratings" ON content_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all ratings" ON content_ratings FOR SELECT USING (is_admin(auth.uid()));

-- A/B Testing
CREATE POLICY "Admins can manage AB tests" ON ab_tests FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage AB test variants" ON ab_test_variants FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can read own AB assignments" ON ab_test_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AB assignments" ON ab_test_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System Settings (Whitelisted keys for public)
CREATE POLICY "Public can read whitelisted settings" ON system_settings FOR SELECT USING (key IN ('system_banner'));
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL USING (is_admin(auth.uid()));

-- Affiliates
CREATE POLICY "Public can read active affiliate links" ON affiliate_links FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage affiliate links" ON affiliate_links FOR ALL USING (is_admin(auth.uid()));

-- Analytics
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all analytics" ON analytics_events FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed) WHERE onboarding_completed = false;
CREATE INDEX idx_profiles_signup_method ON profiles(signup_method);
CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(is_published);
CREATE INDEX idx_articles_scheduled_for ON articles(scheduled_for);
CREATE INDEX idx_modules_published ON modules(is_published);
CREATE INDEX idx_modules_scheduled_for ON modules(scheduled_for);
CREATE INDEX idx_video_series_scheduled_for ON video_series(scheduled_for);
CREATE INDEX idx_events_upcoming ON events(is_upcoming);
CREATE INDEX idx_events_scheduled_for ON events(scheduled_for);
CREATE INDEX idx_junior_modules_scheduled_for ON junior_modules(scheduled_for);
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  p.id, p.first_name, p.last_name, p.email, p.xp, p.onboarding_completed, p.created_at,
  r.name as role,
  COUNT(DISTINCT ua.session_id) as total_sessions,
  COUNT(ua.id) as total_activities,
  MAX(ua.created_at) as last_active_at
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_activities ua ON p.id = ua.user_id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.xp, p.onboarding_completed, p.created_at, r.name;

CREATE OR REPLACE VIEW content_performance AS
SELECT 
  'article' as content_type, a.id, a.title, a.views, a.likes, a.avg_rating, a.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, a.created_at
FROM articles a
LEFT JOIN user_likes ul ON ul.content_type = 'article' AND ul.content_id = a.id
GROUP BY a.id, a.title, a.views, a.likes, a.avg_rating, a.rating_count, a.created_at
UNION ALL
SELECT 
  'module' as content_type, m.id, m.title, m.views, m.likes, m.avg_rating, m.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, m.created_at
FROM modules m
LEFT JOIN user_likes ul ON ul.content_type = 'module' AND ul.content_id = m.id
GROUP BY m.id, m.title, m.views, m.likes, m.avg_rating, m.rating_count, m.created_at
UNION ALL
SELECT 
  'video' as content_type, v.id, v.title, v.views, v.likes, v.avg_rating, v.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, v.created_at
FROM video_series v
LEFT JOIN user_likes ul ON ul.content_type = 'video' AND ul.content_id = v.id
GROUP BY v.id, v.title, v.views, v.likes, v.avg_rating, v.rating_count, v.created_at
UNION ALL
SELECT 
  'junior' as content_type, j.id, j.title, j.views, j.likes, j.avg_rating, j.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, j.created_at
FROM junior_modules j
LEFT JOIN user_likes ul ON ul.content_type = 'junior' AND ul.content_id = j.id
GROUP BY j.id, j.title, j.views, j.likes, j.avg_rating, j.rating_count, j.created_at;

CREATE OR REPLACE VIEW daily_active_users AS
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as unique_users, COUNT(*) as total_activities
FROM user_activities GROUP BY DATE(created_at) ORDER BY date DESC;

-- =====================================================
-- INITIAL DATA
-- =====================================================

INSERT INTO system_settings (key, value) VALUES
  ('ai_prompt', '{"text": "You are a friendly and knowledgeable financial literacy assistant for the blog Dhaani. Your goal is to explain complex financial concepts in simple, easy-to-understand terms for both adults and children. Always maintain a helpful, encouraging tone and avoid giving direct financial advice. Emphasize learning and understanding."}'::jsonb),
  ('system_banner', '{"text": "", "isActive": false, "backgroundColor": "bg-primary", "textColor": "text-primary-foreground", "visiblePages": ["all"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;