-- Verification queries for the infinite recursion fix

-- 1. Check that is_admin function exists and is SECURITY DEFINER
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Verify all policies on user_roles table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 3. Test the function (this should work without recursion)
-- Note: This will only work if you're logged in as an admin
SELECT is_admin(auth.uid()) as current_user_is_admin;

-- 4. Count roles visible (should show all if you're admin)
SELECT COUNT(*) as total_roles_visible FROM user_roles;

