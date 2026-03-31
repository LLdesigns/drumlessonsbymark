-- ============================================
-- EDGE FUNCTION SETUP AND SQL FUNCTIONS
-- ============================================

-- Note: This file contains SQL functions that can be used by Edge Functions
-- or directly in the database. The actual Edge Function code is in:
-- supabase/functions/create-user/index.ts

-- ============================================
-- HELPER FUNCTION: Check if user has role
-- ============================================

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(
  check_user_id UUID,
  check_role user_role
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get user role
-- ============================================

-- Function to get a user's role
CREATE OR REPLACE FUNCTION get_user_role(
  check_user_id UUID
) RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value
  FROM user_roles
  WHERE user_id = check_user_id
  LIMIT 1;
  
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Create user profile after auth signup
-- ============================================

-- This function automatically creates a profile when a user signs up
-- Only if they don't already have one
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Update email in profiles when auth email changes
-- ============================================

CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_user_email();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION user_has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- ============================================
-- NOTES FOR EDGE FUNCTION DEPLOYMENT
-- ============================================

-- The Edge Function (create-user) needs to be deployed separately:
-- 1. Install Supabase CLI: https://supabase.com/docs/guides/cli
-- 2. Login: supabase login
-- 3. Link project: supabase link --project-ref your-project-ref
-- 4. Deploy function: supabase functions deploy create-user
--
-- OR manually:
-- 1. Go to Supabase Dashboard → Edge Functions
-- 2. Create new function: "create-user"
-- 3. Copy code from supabase/functions/create-user/index.ts
-- 4. Set environment variables:
--    - SUPABASE_URL (your project URL)
--    - SUPABASE_SERVICE_ROLE_KEY (from Settings → API)

