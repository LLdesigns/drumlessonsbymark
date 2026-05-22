-- Run after LESSON_PLANNING_RUN_IN_SUPABASE.sql to confirm setup.
-- Expected: one row per table name, no errors.

SELECT 'lesson_templates' AS table_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'lesson_templates'
       ) AS exists;

SELECT 'lesson_template_blocks' AS table_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'lesson_template_blocks'
       ) AS exists;

SELECT 'assigned_lessons' AS table_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'assigned_lessons'
       ) AS exists;
