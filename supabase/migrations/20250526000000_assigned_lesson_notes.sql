-- Per-student assigned lesson notes (private or shared with teacher/student)

CREATE TABLE IF NOT EXISTS assigned_lesson_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_lesson_id UUID NOT NULL REFERENCES assigned_lessons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assigned_lesson_notes_lesson ON assigned_lesson_notes(assigned_lesson_id, created_at DESC);

DROP TRIGGER IF EXISTS update_assigned_lesson_notes_updated_at ON assigned_lesson_notes;
CREATE TRIGGER update_assigned_lesson_notes_updated_at BEFORE UPDATE ON assigned_lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE assigned_lesson_notes ENABLE ROW LEVEL SECURITY;

-- Teachers: own studio lessons only; see own notes + student notes marked shared
CREATE POLICY "Teachers read assigned lesson notes"
  ON assigned_lesson_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assigned_lessons al
      WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
    )
    AND (
      author_id = auth.uid()
      OR visibility = 'shared'
    )
  );

CREATE POLICY "Teachers insert assigned lesson notes"
  ON assigned_lesson_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM assigned_lessons al
      WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers update own assigned lesson notes"
  ON assigned_lesson_notes FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Teachers delete own assigned lesson notes"
  ON assigned_lesson_notes FOR DELETE
  USING (author_id = auth.uid());

-- Students: only their assigned lesson; own notes + teacher notes marked shared
CREATE POLICY "Students read assigned lesson notes"
  ON assigned_lesson_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assigned_lessons al
      WHERE al.id = assigned_lesson_id AND al.student_id = auth.uid()
    )
    AND (
      author_id = auth.uid()
      OR (
        visibility = 'shared'
        AND author_id = (
          SELECT teacher_id FROM assigned_lessons al2 WHERE al2.id = assigned_lesson_id
        )
      )
    )
  );

CREATE POLICY "Students insert assigned lesson notes"
  ON assigned_lesson_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM assigned_lessons al
      WHERE al.id = assigned_lesson_id AND al.student_id = auth.uid()
    )
  );

CREATE POLICY "Students update own assigned lesson notes"
  ON assigned_lesson_notes FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Students delete own assigned lesson notes"
  ON assigned_lesson_notes FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "Admins manage all assigned lesson notes"
  ON assigned_lesson_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
