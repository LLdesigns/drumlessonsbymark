-- Run in Supabase Dashboard → SQL Editor AFTER apply-all-migrations-once.sql (or supabase db push).
-- Fixes: (1) users who existed in auth.users before migrations may lack a profiles row;
--        (2) every account needs a row in user_roles or the app will not redirect by role.

-- 1) Ensure every auth user has a profile (trigger only runs for new signups after migrations).
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- 2) Grant your first login an admin role — replace the email with your real account email.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE lower(email) = lower('your-email@example.com')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- Optional: grant teacher or student instead of admin:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'teacher'::user_role FROM auth.users WHERE lower(email) = lower('teacher@example.com')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
