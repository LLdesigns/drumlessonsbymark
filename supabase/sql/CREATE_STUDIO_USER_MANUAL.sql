-- Manual studio user setup when Supabase Dashboard → Authentication → Add user fails
-- ("Failed to add user" is often SMTP/email confirmation — use this flow instead).
--
-- OPTION A (recommended): Use the app — Studio → Students → Add student, or deploy create-user:
--   cd play-it-pro-platform
--   npx supabase login
--   npx supabase link --project-ref cfzvnrlmbgtkltbzovte
--   npx supabase functions deploy create-user
--
-- OPTION B: Create auth user in Dashboard with "Auto Confirm User" ON, then run section 2 below.
--
-- OPTION C: Invite via SQL (requires service role in SQL editor — run as postgres / service role only)

-- ——— 1) After auth user exists, ensure profile row ———
INSERT INTO public.profiles (user_id, email, first_name, last_name, must_change_password, active)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'last_name',
  true,
  true
FROM auth.users u
WHERE lower(u.email) = lower('NEW_USER_EMAIL@example.com')  -- ← change email
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
  last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name);

-- ——— 2) Grant role (pick one) ———
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher'::user_role
FROM auth.users
WHERE lower(email) = lower('NEW_USER_EMAIL@example.com')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- For students, also link to teacher (replace teacher email):
-- INSERT INTO public.teacher_students (teacher_id, student_id)
-- SELECT t.id, s.id
-- FROM auth.users t, auth.users s
-- WHERE lower(t.email) = lower('mark@example.com')
--   AND lower(s.email) = lower('NEW_USER_EMAIL@example.com')
-- ON CONFLICT DO NOTHING;

-- For teachers, ensure teachers row:
-- INSERT INTO public.teachers (user_id, status)
-- SELECT id, 'active' FROM auth.users WHERE lower(email) = lower('NEW_USER_EMAIL@example.com')
-- ON CONFLICT DO NOTHING;

-- ——— 3) Fix ALL auth users missing profiles (safe to re-run) ———
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
