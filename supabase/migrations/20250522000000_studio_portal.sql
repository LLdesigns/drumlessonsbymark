-- Mark's Drum Studio Portal — teaching workspace tables

-- Student teaching notebook (extends profiles for studio-specific fields)
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  age INTEGER,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
  favorite_music TEXT,
  goals TEXT,
  private_notes TEXT,
  practice_streak INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_teacher ON student_profiles(teacher_id);

-- Scheduled in-person / virtual lessons
CREATE TABLE IF NOT EXISTS scheduled_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60 NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  location TEXT,
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  recurrence_rule TEXT,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  rescheduled_from_id UUID REFERENCES scheduled_lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_teacher ON scheduled_lessons(teacher_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_student ON scheduled_lessons(student_id, starts_at);

-- Shared practice journal entries after lessons
CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  scheduled_lesson_id UUID REFERENCES scheduled_lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  practice_focus TEXT,
  songs TEXT[] DEFAULT '{}',
  rudiments TEXT[] DEFAULT '{}',
  resource_links JSONB DEFAULT '[]',
  visible_to_student BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student ON lesson_notes(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_teacher ON lesson_notes(teacher_id, created_at DESC);

-- Practice assignments (studio-focused, not tied to courses)
CREATE TABLE IF NOT EXISTS practice_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  lesson_note_id UUID REFERENCES lesson_notes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  songs TEXT[] DEFAULT '{}',
  rudiments TEXT[] DEFAULT '{}',
  video_url TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_practice_assignments_student ON practice_assignments(student_id, status);

-- Direct messaging
CREATE TABLE IF NOT EXISTS studio_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'reminder', 'encouragement', 'lesson_note', 'link')),
  link_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_messages_recipient ON studio_messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_messages_sender ON studio_messages(sender_id, created_at DESC);

-- Lightweight milestones for progress
CREATE TABLE IF NOT EXISTS student_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT DEFAULT 'lesson' CHECK (milestone_type IN ('lesson', 'song', 'rudiment', 'streak', 'custom')),
  achieved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_milestones_student ON student_milestones(student_id, achieved_at DESC);

-- updated_at triggers
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_lessons_updated_at ON scheduled_lessons;
CREATE TRIGGER update_scheduled_lessons_updated_at BEFORE UPDATE ON scheduled_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_notes_updated_at ON lesson_notes;
CREATE TRIGGER update_lesson_notes_updated_at BEFORE UPDATE ON lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_assignments_updated_at ON practice_assignments;
CREATE TRIGGER update_practice_assignments_updated_at BEFORE UPDATE ON practice_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_milestones ENABLE ROW LEVEL SECURITY;

-- student_profiles policies
CREATE POLICY "Teachers manage own student profiles"
  ON student_profiles FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view own profile"
  ON student_profiles FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins manage all student profiles"
  ON student_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- scheduled_lessons policies
CREATE POLICY "Teachers manage own scheduled lessons"
  ON scheduled_lessons FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view own scheduled lessons"
  ON scheduled_lessons FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins manage all scheduled lessons"
  ON scheduled_lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- lesson_notes policies
CREATE POLICY "Teachers manage own lesson notes"
  ON lesson_notes FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view published lesson notes"
  ON lesson_notes FOR SELECT
  USING (student_id = auth.uid() AND visible_to_student = TRUE);

CREATE POLICY "Admins manage all lesson notes"
  ON lesson_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- practice_assignments policies
CREATE POLICY "Teachers manage own practice assignments"
  ON practice_assignments FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view and update own practice assignments"
  ON practice_assignments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students complete own practice assignments"
  ON practice_assignments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins manage all practice assignments"
  ON practice_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- studio_messages policies
CREATE POLICY "Users send messages"
  ON studio_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users read own messages"
  ON studio_messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Recipients mark messages read"
  ON studio_messages FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "Admins read all messages"
  ON studio_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- student_milestones policies
CREATE POLICY "Teachers manage milestones"
  ON student_milestones FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view own milestones"
  ON student_milestones FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins manage all milestones"
  ON student_milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
