-- Run in Supabase Dashboard → SQL Editor AFTER schema migrations (apply-all or db push).
-- Safe to re-run: uses ON CONFLICT / IF NOT EXISTS where possible.

-- 1) Auth trigger: new users get profiles row (does not block auth insert on failure)
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
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill profiles for existing auth users
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- 3) Luke — admin (studio owner)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE lower(email) IN (
  lower('lukelibbydesigns@gmail.com'),
  lower('dmi.libbyl@gmail.com')
)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.profiles (user_id, email, first_name, last_name, active)
SELECT id, email, 'Luke', 'Libby', true
FROM auth.users
WHERE lower(email) = lower('lukelibbydesigns@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
  last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
  active = true;

-- 4) Additional admin — edit email or duplicate block for other accounts
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::user_role FROM auth.users WHERE lower(email) = lower('your-email@example.com')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 5) Mark (teacher) — mrkprctr@yahoo.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher'::user_role FROM auth.users WHERE lower(email) = lower('mrkprctr@yahoo.com')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.teachers (user_id, status)
SELECT id, 'active' FROM auth.users WHERE lower(email) = lower('mrkprctr@yahoo.com')
ON CONFLICT DO NOTHING;
