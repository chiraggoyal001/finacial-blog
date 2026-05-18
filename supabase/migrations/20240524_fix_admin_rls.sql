-- =====================================================
-- Migration: Fix is_admin function to include email fallback
-- Date: 2024-05-24
-- =====================================================

-- Update the is_admin function to also check admin emails
-- This makes the backend consistent with the frontend's getEffectiveRole
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.name = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_uuid AND email IN ('goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;