-- Run in Supabase SQL Editor if migration 20250529000000 was not applied via CLI

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived'));

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher_active
  ON public.teacher_students(teacher_id)
  WHERE status = 'active';

DROP POLICY IF EXISTS "Teachers can update own assignments" ON public.teacher_students;
CREATE POLICY "Teachers can update own assignments"
  ON public.teacher_students FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Then re-run policy updates from supabase/migrations/20250529000000_teacher_students_archive.sql
