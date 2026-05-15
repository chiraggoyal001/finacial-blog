-- =====================================================
-- COMPLETE SCHEMA WITH ROLES, CONTENT TABLES & A/B TESTING
-- Run this in your Supabase SQL Editor
-- Admin emails: goyalchirag721@gmail.com, anuraggoyal231@gmail.com
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects (for clean setup)
DROP TABLE IF EXISTS ab_test_assignments CASCADE;
DROP TABLE IF EXISTS ab_test_variants CASCADE;
DROP TABLE IF EXISTS ab_tests CASCADE;
DROP TABLE IF EXISTS user_likes CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
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
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS is_profile_complete CASCADE;

-- =====================================================
-- ROLES TABLE
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

-- =====================================================
-- USER ROLES MAPPING
-- =====================================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Function to auto-assign 'user' role on signup and create profile with OAuth data
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

-- Trigger to auto-assign role and create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- PROFILES TABLE: Extended user persona data
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info (from signup)
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  
  -- Extended persona fields (all optional)
  age INTEGER CHECK (age >= 1 AND age <= 120),
  region TEXT,
  interests TEXT[] DEFAULT '{}',
  profession TEXT,
  hobbies TEXT,
  description TEXT,
  
  -- Newsletter preferences
  is_subscribed BOOLEAN DEFAULT false,
  mail_preference TEXT DEFAULT 'non-intrusive',
  notify_launches BOOLEAN DEFAULT false,
  
  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_skipped_at TIMESTAMP WITH TIME ZONE,
  
  -- Avatar (can be from OAuth providers)
  avatar_url TEXT,
  
  -- Signup tracking
  signup_method TEXT DEFAULT 'email',  -- 'email' | 'google' | 'twitter'
  signup_ip INET,
  signup_user_agent TEXT,
  signup_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER ACTIVITIES TABLE: Track all user actions
-- =====================================================
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  
  -- Entity being interacted with
  entity_type TEXT,
  entity_id TEXT,
  entity_title TEXT,
  
  -- Flexible metadata storage
  metadata JSONB DEFAULT '{}',
  
  -- Session tracking
  session_id TEXT,
  
  -- Technical metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ARTICLES TABLE (Blog Posts)
-- =====================================================
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
  
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MODULES TABLE
-- =====================================================
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
  
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MODULE CHAPTERS TABLE
-- =====================================================
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

-- =====================================================
-- VIDEO SERIES TABLE
-- =====================================================
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
  
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VIDEO CHAPTERS TABLE
-- =====================================================
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

-- =====================================================
-- EVENTS TABLE
-- =====================================================
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
  capacity INTEGER,
  registered INTEGER DEFAULT 0,
  
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- JUNIOR MODULES TABLE
-- =====================================================
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
  
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- JUNIOR CHAPTERS TABLE
-- =====================================================
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
-- USER LIKES TABLE
-- =====================================================
CREATE TABLE user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- =====================================================
-- A/B TESTS TABLE
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

-- =====================================================
-- A/B TEST VARIANTS TABLE
-- =====================================================
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

-- =====================================================
-- A/B TEST ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES ab_test_variants(id),
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(test_id, user_id)
);

-- =====================================================
-- ANALYTICS EVENTS TABLE (Backup for external analytics)
-- =====================================================
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
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
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

-- =====================================================
-- HELPER FUNCTION: Check if user profile is complete
-- =====================================================
CREATE OR REPLACE FUNCTION is_profile_complete(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  IF profile_record IS NULL THEN
    RETURN false;
  END IF;
  
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

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
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

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL
  USING (is_admin(auth.uid()));

-- User activities policies
CREATE POLICY "Users can read own activities" ON user_activities FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all activities" ON user_activities FOR SELECT
  USING (is_admin(auth.uid()));

-- Articles policies
CREATE POLICY "Public can read published articles" ON articles FOR SELECT
  USING (is_published = true);
CREATE POLICY "Admins can manage articles" ON articles FOR ALL
  USING (is_admin(auth.uid()));

-- Modules policies
CREATE POLICY "Public can read published modules" ON modules FOR SELECT
  USING (is_published = true);
CREATE POLICY "Admins can manage modules" ON modules FOR ALL
  USING (is_admin(auth.uid()));

-- Module chapters policies
CREATE POLICY "Public can read chapters of published modules" ON module_chapters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_chapters.module_id AND modules.is_published = true
  ));
CREATE POLICY "Admins can manage module chapters" ON module_chapters FOR ALL
  USING (is_admin(auth.uid()));

-- Video series policies
CREATE POLICY "Public can read published video series" ON video_series FOR SELECT
  USING (is_published = true);
CREATE POLICY "Admins can manage video series" ON video_series FOR ALL
  USING (is_admin(auth.uid()));

-- Video chapters policies
CREATE POLICY "Public can read chapters of published series" ON video_chapters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM video_series WHERE video_series.id = video_chapters.series_id AND video_series.is_published = true
  ));
CREATE POLICY "Admins can manage video chapters" ON video_chapters FOR ALL
  USING (is_admin(auth.uid()));

-- Events policies
CREATE POLICY "Public can read published events" ON events FOR SELECT
  USING (is_published = true);
CREATE POLICY "Admins can manage events" ON events FOR ALL
  USING (is_admin(auth.uid()));

-- Junior modules policies
CREATE POLICY "Public can read published junior modules" ON junior_modules FOR SELECT
  USING (is_published = true);
CREATE POLICY "Admins can manage junior modules" ON junior_modules FOR ALL
  USING (is_admin(auth.uid()));

-- Junior chapters policies
CREATE POLICY "Public can read chapters of published junior modules" ON junior_chapters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM junior_modules WHERE junior_modules.id = junior_chapters.module_id AND junior_modules.is_published = true
  ));
CREATE POLICY "Admins can manage junior chapters" ON junior_chapters FOR ALL
  USING (is_admin(auth.uid()));

-- User likes policies
CREATE POLICY "Users can manage own likes" ON user_likes FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all likes" ON user_likes FOR SELECT
  USING (is_admin(auth.uid()));

-- A/B tests policies (admin only)
CREATE POLICY "Admins can manage AB tests" ON ab_tests FOR ALL
  USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage AB test variants" ON ab_test_variants FOR ALL
  USING (is_admin(auth.uid()));

-- A/B test assignments (users can read own, insert own)
CREATE POLICY "Users can read own AB assignments" ON ab_test_assignments FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AB assignments" ON ab_test_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all AB assignments" ON ab_test_assignments FOR SELECT
  USING (is_admin(auth.uid()));

-- Analytics events policies
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all analytics" ON analytics_events FOR SELECT
  USING (is_admin(auth.uid()));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed) 
  WHERE onboarding_completed = false;
CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_activities_action_type ON user_activities(action_type);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(is_published);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_modules_published ON modules(is_published);
CREATE INDEX idx_module_chapters_module_id ON module_chapters(module_id);
CREATE INDEX idx_events_upcoming ON events(is_upcoming);
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_likes_content ON user_likes(content_type, content_id);
CREATE INDEX idx_ab_assignments_user ON ab_test_assignments(user_id);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- User engagement summary
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.onboarding_completed,
  p.created_at,
  r.name as role,
  COUNT(DISTINCT ua.session_id) as total_sessions,
  COUNT(ua.id) as total_activities,
  MAX(ua.created_at) as last_active_at
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_activities ua ON p.id = ua.user_id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.onboarding_completed, p.created_at, r.name;

-- Content performance summary
CREATE OR REPLACE VIEW content_performance AS
SELECT 
  'article' as content_type,
  a.id,
  a.title,
  a.views,
  a.likes,
  COUNT(DISTINCT ul.user_id) as unique_likes,
  a.created_at
FROM articles a
LEFT JOIN user_likes ul ON ul.content_type = 'article' AND ul.content_id = a.id
GROUP BY a.id, a.title, a.views, a.likes, a.created_at

UNION ALL

SELECT 
  'module' as content_type,
  m.id,
  m.title,
  m.views,
  m.likes,
  COUNT(DISTINCT ul.user_id) as unique_likes,
  m.created_at
FROM modules m
LEFT JOIN user_likes ul ON ul.content_type = 'module' AND ul.content_id = m.id
GROUP BY m.id, m.title, m.views, m.likes, m.created_at;

-- Daily active users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_activities
FROM user_activities
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE profiles IS 'Extended user profiles with persona data. Created automatically on signup.';
COMMENT ON TABLE user_activities IS 'Audit log of all user actions on the platform.';
COMMENT ON TABLE articles IS 'Blog posts and newsletter content.';
COMMENT ON TABLE modules IS 'Learning modules with chapters.';
COMMENT ON TABLE ab_tests IS 'A/B testing configuration for CTAs and avatars.';
COMMENT ON TABLE user_likes IS 'Tracks user likes across all content types.';
COMMENT ON FUNCTION handle_new_user IS 'Automatically assigns roles and creates profiles for new users.';
