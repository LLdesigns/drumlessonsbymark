-- Migration: Fix infinite recursion in user_roles RLS policies
-- Description: Replaces direct user_roles queries in policies with SECURITY DEFINER function
-- Date: 2025-11-02

-- Step 1: Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Step 2: Replace function body in place (do NOT DROP — other tables' RLS policies depend on is_admin)
-- Step 3: Create the new function with SECURITY DEFINER
-- This bypasses RLS, preventing infinite recursion when checking admin status
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- SECURITY DEFINER allows this function to bypass RLS
  -- This is safe because it only reads, not modifies data
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'admin'::user_role
  );
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- Step 5: Recreate policies using the function (no recursion!)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

