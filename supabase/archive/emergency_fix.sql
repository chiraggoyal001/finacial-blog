-- =====================================================
-- EMERGENCY FIX: Complete Database Reset & Setup
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Step 1: Check what tables currently exist
SELECT 'EXISTING TABLES:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Step 2: Drop everything cleanly (in correct order to avoid FK issues)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 4: Create ROLES table FIRST (this is what was missing!)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert roles immediately
INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"can_manage_content": true, "can_manage_users": true, "can_manage_ab_tests": true, "can_view_analytics": true}'::jsonb),
  ('user', '{"can_read_content": true, "can_like_content": true, "can_comment": true}'::jsonb);

-- Step 5: Create USER_ROLES table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Step 6: Create PROFILES table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 1 AND age <= 120),
  region TEXT,
  interests TEXT[] DEFAULT '{}',
  profession TEXT,
  hobbies TEXT,
  description TEXT,
  is_subscribed BOOLEAN DEFAULT false,
  mail_preference TEXT DEFAULT 'non-intrusive',
  notify_launches BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_skipped_at TIMESTAMP WITH TIME ZONE,
  signup_ip INET,
  signup_user_agent TEXT,
  signup_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT
);

-- Step 7: Create the trigger function (AFTER roles and profiles exist)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
  admin_role_id UUID;
BEGIN
  -- Get role IDs (these should exist now!)
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Check if email is in admin list
  IF NEW.email IN ('goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com') THEN
    INSERT INTO user_roles (user_id, role_id) VALUES (NEW.id, admin_role_id);
  ELSE
    INSERT INTO user_roles (user_id, role_id) VALUES (NEW.id, user_role_id);
  END IF;
  
  -- Create profile with safe defaults
  INSERT INTO profiles (id, first_name, last_name, email)
  VALUES (NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 9: Verify everything was created
SELECT 'VERIFICATION:' as info;
SELECT 'roles table exists: ' || EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'roles') as check_roles;
SELECT 'user_roles table exists: ' || EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'user_roles') as check_user_roles;
SELECT 'profiles table exists: ' || EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'profiles') as check_profiles;
SELECT 'trigger exists: ' || EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as check_trigger;
SELECT 'roles count: ' || COUNT(*)::text FROM roles;
