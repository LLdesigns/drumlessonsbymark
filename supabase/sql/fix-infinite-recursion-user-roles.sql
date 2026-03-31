-- SQL script to fix infinite recursion in user_roles RLS policies
-- The issue: Policy queries user_roles to check admin, which triggers policy again
-- Solution: Use a SECURITY DEFINER function that bypasses RLS

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Drop existing function if it exists (try different signatures)
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin(uuid);
-- Also try with parameter name 'uid' if it was created that way
DO $$ 
BEGIN
  DROP FUNCTION IF EXISTS is_admin(uid UUID);
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if doesn't exist
END $$;

-- Create a function that checks if user is admin (bypasses RLS)
CREATE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = user_id_param
    AND user_roles.role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create policies using the function (avoids recursion)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

