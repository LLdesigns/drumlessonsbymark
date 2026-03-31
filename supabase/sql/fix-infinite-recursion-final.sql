-- SQL script to fix infinite recursion - RUN THIS EXACTLY AS IS
-- Step 1: Drop policies
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Step 2: Drop the function using the exact signature (with 'uid' parameter)
DROP FUNCTION IF EXISTS is_admin(uid UUID);

-- Step 3: Create new function with different parameter name
CREATE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
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
$$;

-- Step 4: Recreate policies
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

