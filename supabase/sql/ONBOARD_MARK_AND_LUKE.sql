-- One-time setup: Luke (admin) + Mark (teacher)
-- Run in Supabase Dashboard → SQL Editor after FIX_AUTH_USER_CREATE_TRIGGER.sql if needed.
--
-- 1) Ensure Luke has admin (replace email if different)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE lower(email) = lower('lukelibbydesigns@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.profiles (user_id, email, first_name, last_name, active)
SELECT id, email, 'Luke', 'Libby', true
FROM auth.users
WHERE lower(email) = lower('lukelibbydesigns@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- 2) If Mark already exists in Authentication, grant teacher role (use Mark's real email):
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'teacher'::user_role FROM auth.users WHERE lower(email) = lower('mark@EXAMPLE.com')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
--
-- INSERT INTO public.teachers (user_id, status)
-- SELECT id, 'active' FROM auth.users WHERE lower(email) = lower('mark@EXAMPLE.com')
-- ON CONFLICT DO NOTHING;

-- Prefer: Studio → Students → Add teacher (admin only) or use the app while logged in as Luke.
