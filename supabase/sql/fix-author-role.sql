-- SQL script to fix author users who don't have roles assigned
-- Run this in Supabase SQL Editor

-- First, find authors without roles
-- SELECT 
--   p.user_id,
--   p.first_name,
--   p.last_name,
--   p.email,
--   ur.role
-- FROM profiles p
-- LEFT JOIN user_roles ur ON p.user_id = ur.user_id
-- WHERE ur.role IS NULL
-- ORDER BY p.created_at DESC;

-- If you know the user_id of the author, replace 'USER_ID_HERE' below:
-- UPDATE: You'll need to manually identify which users should be authors

-- To add author role to a specific user (replace USER_ID_HERE and ADMIN_USER_ID):
-- INSERT INTO user_roles (user_id, role, granted_by, granted_at)
-- VALUES (
--   'USER_ID_HERE',
--   'author'::user_role,
--   'ADMIN_USER_ID',
--   NOW()
-- )
-- ON CONFLICT (user_id) DO UPDATE SET 
--   role = 'author'::user_role,
--   granted_by = 'ADMIN_USER_ID',
--   granted_at = NOW();

-- To find users without roles that might need author role:
SELECT 
  p.user_id,
  p.first_name,
  p.last_name,
  p.email,
  p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.role IS NULL
ORDER BY p.created_at DESC;

