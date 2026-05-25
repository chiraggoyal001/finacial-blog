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
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Check if email is in admin list
  IF NEW.email IN ('goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, admin_role_id);
  ELSE
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, user_role_id);
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

-- Add index for signup_method (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_signup_method ON profiles(signup_method);

-- Comment for documentation
COMMENT ON COLUMN profiles.signup_method IS 'Tracks how the user signed up: email, google, or twitter';
