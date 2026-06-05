-- Practice task analytics + block progress for linked block completion

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lesson_started';

CREATE TABLE IF NOT EXISTS student_activity_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assigned_lesson_id UUID REFERENCES assigned_lessons(id) ON DELETE CASCADE,
  block_id UUID REFERENCES assigned_lesson_blocks(id) ON DELETE SET NULL,
  item_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_activity_student_time
  ON student_activity_events(student_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_activity_lesson
  ON student_activity_events(assigned_lesson_id, occurred_at DESC)
  WHERE assigned_lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_activity_event
  ON student_activity_events(event_name, occurred_at DESC);

CREATE TABLE IF NOT EXISTS student_block_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_lesson_id UUID NOT NULL REFERENCES assigned_lessons(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES assigned_lesson_blocks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  progress_kind TEXT NOT NULL CHECK (progress_kind IN ('viewed', 'played', 'completed')),
  payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (assigned_lesson_id, block_id, student_id, progress_kind)
);

CREATE INDEX IF NOT EXISTS idx_student_block_progress_lesson
  ON student_block_progress(assigned_lesson_id, student_id);

ALTER TABLE student_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_block_progress ENABLE ROW LEVEL SECURITY;

-- Students insert own activity
CREATE POLICY "Students insert own activity events"
  ON student_activity_events FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students view own activity events"
  ON student_activity_events FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers view student activity on own lessons"
  ON student_activity_events FOR SELECT
  USING (
    assigned_lesson_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM assigned_lessons al
      WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all activity events"
  ON student_activity_events FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Block progress
CREATE POLICY "Students manage own block progress"
  ON student_block_progress FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view block progress on own lessons"
  ON student_block_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assigned_lessons al
    WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all block progress"
  ON student_block_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
