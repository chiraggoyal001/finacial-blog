-- =====================================================
-- USER PERSONA & ACTIVITY TRACKING SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- =====================================================
-- PROFILES TABLE: Extended user persona data
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info (from signup)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
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
  
  -- Technical metadata
  signup_ip INET,
  signup_user_agent TEXT,
  signup_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own profile
CREATE POLICY "Users can read own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Profiles: Users can update own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Profiles: Users can insert own profile (during signup)
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER ACTIVITIES TABLE: Track all user actions
-- =====================================================
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'page_view', 'article_read', 'quiz_completed', etc.
  
  -- Entity being interacted with
  entity_type TEXT, -- 'article', 'video', 'module', 'event', 'quiz', 'page'
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

-- Enable RLS on user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- User activities: Users can read own activities
CREATE POLICY "Users can read own activities" 
  ON user_activities FOR SELECT 
  USING (auth.uid() = user_id);

-- User activities: Users can insert own activities
CREATE POLICY "Users can insert own activities" 
  ON user_activities FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed) 
  WHERE onboarding_completed = false;

CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_activities_action_type ON user_activities(action_type);
CREATE INDEX idx_activities_user_entity ON user_activities(user_id, entity_type, entity_id);

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

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
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
  
  -- Profile is considered complete if at least 3 of the extended fields are filled
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
-- ADMIN VIEWS (Optional - for dashboard analytics)
-- =====================================================

-- View: User engagement summary
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.onboarding_completed,
  p.created_at,
  COUNT(DISTINCT ua.session_id) as total_sessions,
  COUNT(ua.id) as total_activities,
  MAX(ua.created_at) as last_active_at
FROM profiles p
LEFT JOIN user_activities ua ON p.id = ua.user_id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.onboarding_completed, p.created_at;

-- View: Daily active users
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
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the optional onboarding flow';
COMMENT ON COLUMN user_activities.metadata IS 'Flexible JSON storage for action-specific data';

-- =====================================================
-- AVATAR STORAGE BUCKET SETUP
-- =====================================================

-- Note: Create the 'avatars' bucket manually in Supabase Dashboard
-- Storage > Buckets > New Bucket > Name: avatars, Public: true

-- Storage policies for avatars bucket (run after bucket creation)
-- These policies ensure users can only manage their own avatars

-- Policy: Allow authenticated users to upload avatars
-- CREATE POLICY "Users can upload own avatar" 
--   ON storage.objects FOR INSERT 
--   TO authenticated 
--   WITH CHECK (bucket_id = 'avatars' AND (storage.filename(name)) = auth.uid() || '.webp');

-- Policy: Allow users to update their own avatar
-- CREATE POLICY "Users can update own avatar" 
--   ON storage.objects FOR UPDATE 
--   TO authenticated 
--   USING (bucket_id = 'avatars' AND (storage.filename(name)) = auth.uid() || '.webp');

-- Policy: Allow users to delete their own avatar
-- CREATE POLICY "Users can delete own avatar" 
--   ON storage.objects FOR DELETE 
--   TO authenticated 
--   USING (bucket_id = 'avatars' AND (storage.filename(name)) = auth.uid() || '.webp');

-- Policy: Allow public access to read avatars
-- CREATE POLICY "Public can read avatars" 
--   ON storage.objects FOR SELECT 
--   TO anon, authenticated 
--   USING (bucket_id = 'avatars');

-- =====================================================
-- PROFILE AVATAR URL COLUMN
-- =====================================================

-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
