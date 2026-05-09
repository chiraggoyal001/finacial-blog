-- =====================================================
-- FIX: Trigger with Explicit Schema Reference
-- =====================================================

-- Step 1: First verify roles table exists
SELECT 'Checking roles table...' as status;
SELECT * FROM public.roles;

-- Step 2: Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 3: Recreate function with EXPLICIT public schema references
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
  admin_role_id UUID;
BEGIN
  -- Use public.roles explicitly
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Check if email is in admin list
  IF NEW.email IN ('goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, admin_role_id);
  ELSE
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, user_role_id);
  END IF;
  
  -- Create profile with explicit public schema
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 5: Verify
SELECT 'Trigger recreated with explicit schema references' as status;
