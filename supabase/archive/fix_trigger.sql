-- =====================================================
-- FIX: Recreate trigger after all tables exist
-- =====================================================

-- 1. First, drop the broken trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recreate the function (now profiles table exists)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
  admin_role_id UUID;
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
  
  -- Create profile (profiles table now exists)
  INSERT INTO profiles (id, first_name, last_name, email)
  VALUES (NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Verify it worked
SELECT 
  'Trigger recreated successfully' as status,
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_exists;
