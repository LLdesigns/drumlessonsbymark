-- Student lesson library + self-enroll (run in Supabase SQL Editor).
-- Same as supabase/migrations/20250528000000_student_lesson_self_enroll.sql

ALTER TABLE assigned_lessons
  ADD COLUMN IF NOT EXISTS enrollment_source TEXT NOT NULL DEFAULT 'teacher'
  CHECK (enrollment_source IN ('teacher', 'student'));

CREATE INDEX IF NOT EXISTS idx_assigned_lessons_student_template
  ON assigned_lessons(student_id, template_id)
  WHERE template_id IS NOT NULL AND status NOT IN ('archived', 'completed');

DROP POLICY IF EXISTS "Students view teacher active lesson templates" ON lesson_templates;
CREATE POLICY "Students view teacher active lesson templates"
  ON lesson_templates FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM teacher_students ts
      WHERE ts.student_id = auth.uid() AND ts.teacher_id = lesson_templates.teacher_id
    )
  );

DROP POLICY IF EXISTS "Students view blocks on teacher active templates" ON lesson_template_blocks;
CREATE POLICY "Students view blocks on teacher active templates"
  ON lesson_template_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_templates t
      JOIN teacher_students ts ON ts.teacher_id = t.teacher_id AND ts.student_id = auth.uid()
      WHERE t.id = template_id AND t.status = 'active'
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
      WHERE ts.student_id = auth.uid() AND ts.teacher_id = assigned_lessons.teacher_id
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

DROP POLICY IF EXISTS "Students insert blocks when self-enrolling" ON assigned_lesson_blocks;
CREATE POLICY "Students insert blocks when self-enrolling"
  ON assigned_lesson_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assigned_lessons al
      WHERE al.id = assigned_lesson_id
        AND al.student_id = auth.uid()
        AND al.enrollment_source = 'student'
    )
  );
