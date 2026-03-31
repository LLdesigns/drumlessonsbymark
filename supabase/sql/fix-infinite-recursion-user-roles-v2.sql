-- SQL script to fix infinite recursion in user_roles RLS policies
-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Step 2: Find and drop any existing is_admin function
-- Check what functions exist first
SELECT 
  proname,
  pg_get_function_identity_arguments(oid) as args
FROM pg_proc 
WHERE proname = 'is_admin';

-- Step 3: Drop the function with exact signature (run this separately if needed)
-- Replace 'uid uuid' with whatever the actual signature is from the query above
-- DROP FUNCTION IF EXISTS is_admin(uid UUID);

-- Step 4: Create the function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate policies using the function (avoids recursion)
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
  cmd
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

