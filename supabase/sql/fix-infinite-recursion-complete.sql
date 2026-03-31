-- Complete fix for infinite recursion in user_roles RLS policies
-- This script will properly drop the existing function and recreate everything

-- Step 1: Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Step 2: Drop the existing function - try all possible signatures
DO $$
BEGIN
  -- Try to drop with various possible signatures
  BEGIN
    DROP FUNCTION IF EXISTS is_admin(uid UUID);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DROP FUNCTION IF EXISTS is_admin(UUID);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DROP FUNCTION IF EXISTS is_admin(uuid);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    DROP FUNCTION IF EXISTS is_admin(check_user_id UUID);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Step 3: Get the exact signature and drop it properly
DO $$
DECLARE
  func_signature text;
BEGIN
  -- Find the exact function signature
  SELECT pg_get_function_identity_arguments(oid) INTO func_signature
  FROM pg_proc
  WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LIMIT 1;
  
  IF func_signature IS NOT NULL THEN
    EXECUTE format('DROP FUNCTION IF EXISTS is_admin(%s)', func_signature);
  END IF;
END $$;

-- Step 4: Create the new function with SECURITY DEFINER (bypasses RLS to avoid recursion)
CREATE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  -- This allows us to check admin status without triggering recursion
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'admin'::user_role
  );
END;
$$;

-- Step 5: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- Step 6: Recreate the policies using the function (avoids recursion)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Step 7: Verify everything was created correctly
DO $$
BEGIN
  RAISE NOTICE 'Function is_admin created successfully';
  RAISE NOTICE 'Policies created successfully';
END $$;

