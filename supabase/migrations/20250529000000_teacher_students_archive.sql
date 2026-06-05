-- Per-teacher student archive (soft hide from roster; student account unchanged)

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived'));

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN public.teacher_students.status IS 'active = on teacher roster; archived = hidden from default lists';
COMMENT ON COLUMN public.teacher_students.archived_at IS 'When the teacher archived this student';

CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher_active
  ON public.teacher_students(teacher_id)
  WHERE status = 'active';

DROP POLICY IF EXISTS "Teachers can update own assignments" ON public.teacher_students;
CREATE POLICY "Teachers can update own assignments"
  ON public.teacher_students FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Self-enroll / library access only for active teacher–student links
DROP POLICY IF EXISTS "Students view teacher active lesson templates" ON lesson_templates;
CREATE POLICY "Students view teacher active lesson templates"
  ON lesson_templates FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM teacher_students ts
      WHERE ts.student_id = auth.uid()
        AND ts.teacher_id = lesson_templates.teacher_id
        AND ts.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Students view blocks on teacher active templates" ON lesson_template_blocks;
CREATE POLICY "Students view blocks on teacher active templates"
  ON lesson_template_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_templates t
      JOIN teacher_students ts ON ts.teacher_id = t.teacher_id AND ts.student_id = auth.uid()
      WHERE t.id = template_id
        AND t.status = 'active'
        AND ts.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Students enroll in teacher lessons" ON assigned_lessons;
CREATE POLICY "Students enroll in teacher lessons"
  ON assigned_lessons FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND enrollment_source = 'student'
    AND EXISTS (
      SELECT 1 FROM teacher_students ts
      WHERE ts.student_id = auth.uid()
        AND ts.teacher_id = assigned_lessons.teacher_id
        AND ts.status = 'active'
    )
    AND (
      template_id IS NULL
      OR EXISTS (
        SELECT 1 FROM lesson_templates t
        WHERE t.id = template_id
          AND t.teacher_id = assigned_lessons.teacher_id
          AND t.status = 'active'
      )
    )
  );
