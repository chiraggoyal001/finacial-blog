-- =====================================================
-- FIX: Add missing INSERT policy for profiles table
-- =====================================================
-- The existing RLS policies only allow SELECT and UPDATE for users on their own profile.
-- There is no INSERT policy, which causes failures when:
--   1. AuthCallback.tsx calls supabase.from('profiles').upsert({...}) for OAuth users
--   2. AuthContext.tsx signup function calls supabase.from('profiles').upsert({...})
--   3. The DB trigger handle_new_user() is delayed and client-side code tries to create the profile
-- =====================================================

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to upsert their own profile (for OAuth flow where row may or may not exist)
-- Note: The existing UPDATE policy already allows updates on own profile.
-- The INSERT policy above combined with ON CONFLICT ... DO UPDATE allows upserts.