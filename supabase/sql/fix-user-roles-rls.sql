-- SQL script to fix RLS policies for user_roles table
-- This allows admins to view all user roles
-- Run this in Supabase SQL Editor

-- First, check if user_roles table has RLS enabled
-- If not, enable it:
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
    AND policyname = 'Users can view own role'
  ) THEN
    CREATE POLICY "Users can view own role"
      ON user_roles FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Policy: Admins can view all roles (THIS IS CRITICAL FOR THE USERS PAGE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
    AND policyname = 'Admins can view all roles'
  ) THEN
    CREATE POLICY "Admins can view all roles"
      ON user_roles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;

-- Policy: Admins can insert roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
    AND policyname = 'Admins can insert roles'
  ) THEN
    CREATE POLICY "Admins can insert roles"
      ON user_roles FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;

-- Policy: Admins can update roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
    AND policyname = 'Admins can update roles'
  ) THEN
    CREATE POLICY "Admins can update roles"
      ON user_roles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

