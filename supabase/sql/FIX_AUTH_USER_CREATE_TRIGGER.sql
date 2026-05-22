-- Run in Supabase Dashboard → SQL Editor if "Add user" in Authentication returns 500
-- or if create-user / signup fails after inserting into auth.users.
--
-- Ensures new auth users always get a profiles row without blocking user creation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Do not roll back auth.users insert — log and continue
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
