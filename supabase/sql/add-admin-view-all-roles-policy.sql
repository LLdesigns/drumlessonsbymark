-- SQL script to add RLS policy allowing admins to view all user roles
-- This fixes the issue where the Users page can't display roles
-- Run this in Supabase SQL Editor

-- IMPORTANT: The "No write by default" policy blocks everything
-- We need to ensure admin policies are created AFTER checking they don't exist

-- Policy: Admins can view all roles (CRITICAL for Users page)
-- This policy allows admins to SELECT all rows from user_roles
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::user_role
    )
  );

-- Also add policies for admins to insert/update roles (for future use)
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

-- Verify the new policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

