-- Lesson Planning: templates, assigned lessons, blocks, session notes

-- Extend notification types for lesson planning
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lesson_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'session_note_added';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'practice_task_completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'practice_note_added';

-- Reusable lesson templates (Lesson Library)
CREATE TABLE IF NOT EXISTS lesson_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT,
  category TEXT NOT NULL DEFAULT 'Technique',
  skill_level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER DEFAULT 60,
  lesson_goal TEXT,
  teacher_notes TEXT,
  student_instructions TEXT,
  practice_assignment TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_templates_teacher ON lesson_templates(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_category ON lesson_templates(teacher_id, category);

-- Modular content blocks on templates
CREATE TABLE IF NOT EXISTS lesson_template_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES lesson_templates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'text', 'notation_image', 'video', 'audio', 'tempo', 'rudiment', 'checklist', 'resource_link'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_template_blocks_template ON lesson_template_blocks(template_id, sort_order);

-- Student-specific assigned lessons (copy of template, customizable)
CREATE TABLE IF NOT EXISTS assigned_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  template_id UUID REFERENCES lesson_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  category TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER,
  lesson_goal TEXT,
  teacher_notes TEXT,
  student_instructions TEXT,
  practice_assignment TEXT,
  custom_student_instructions TEXT,
  custom_teacher_notes TEXT,
  target_bpm INTEGER,
  current_bpm INTEGER,
  student_progress_notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'needs_review', 'completed', 'archived'
  )),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assigned_lessons_student ON assigned_lessons(student_id, status);
CREATE INDEX IF NOT EXISTS idx_assigned_lessons_teacher ON assigned_lessons(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_assigned_lessons_template ON assigned_lessons(template_id);

-- Blocks on assigned lessons (copied from template, editable per student)
CREATE TABLE IF NOT EXISTS assigned_lesson_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_lesson_id UUID NOT NULL REFERENCES assigned_lessons(id) ON DELETE CASCADE,
  source_block_id UUID REFERENCES lesson_template_blocks(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'text', 'notation_image', 'video', 'audio', 'tempo', 'rudiment', 'checklist', 'resource_link'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assigned_lesson_blocks_lesson ON assigned_lesson_blocks(assigned_lesson_id, sort_order);

-- Session notes from actual lessons
CREATE TABLE IF NOT EXISTS lesson_session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assigned_lesson_id UUID REFERENCES assigned_lessons(id) ON DELETE SET NULL,
  scheduled_lesson_id UUID REFERENCES scheduled_lessons(id) ON DELETE SET NULL,
  lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
  what_covered TEXT,
  what_improved TEXT,
  what_needs_work TEXT,
  teacher_private_notes TEXT,
  student_summary TEXT,
  homework_assigned TEXT,
  next_lesson_focus TEXT,
  resource_links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_session_notes_student ON lesson_session_notes(student_id, lesson_date DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_session_notes_teacher ON lesson_session_notes(teacher_id, lesson_date DESC);

-- Student checklist task completions
CREATE TABLE IF NOT EXISTS practice_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_lesson_id UUID NOT NULL REFERENCES assigned_lessons(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES assigned_lesson_blocks(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  practice_note TEXT,
  media_url TEXT,
  UNIQUE (assigned_lesson_id, block_id, item_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_task_completions_lesson ON practice_task_completions(assigned_lesson_id);

-- Student practice notes on assigned lessons
CREATE TABLE IF NOT EXISTS student_practice_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_lesson_id UUID NOT NULL REFERENCES assigned_lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  block_id UUID REFERENCES assigned_lesson_blocks(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_practice_notes_lesson ON student_practice_notes(assigned_lesson_id, created_at DESC);

-- updated_at triggers
DROP TRIGGER IF EXISTS update_lesson_templates_updated_at ON lesson_templates;
CREATE TRIGGER update_lesson_templates_updated_at BEFORE UPDATE ON lesson_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_template_blocks_updated_at ON lesson_template_blocks;
CREATE TRIGGER update_lesson_template_blocks_updated_at BEFORE UPDATE ON lesson_template_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assigned_lessons_updated_at ON assigned_lessons;
CREATE TRIGGER update_assigned_lessons_updated_at BEFORE UPDATE ON assigned_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assigned_lesson_blocks_updated_at ON assigned_lesson_blocks;
CREATE TRIGGER update_assigned_lesson_blocks_updated_at BEFORE UPDATE ON assigned_lesson_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_session_notes_updated_at ON lesson_session_notes;
CREATE TRIGGER update_lesson_session_notes_updated_at BEFORE UPDATE ON lesson_session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE lesson_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_template_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_practice_notes ENABLE ROW LEVEL SECURITY;

-- lesson_templates
CREATE POLICY "Teachers manage own lesson templates"
  ON lesson_templates FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins manage all lesson templates"
  ON lesson_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- lesson_template_blocks (via template ownership)
CREATE POLICY "Teachers manage own template blocks"
  ON lesson_template_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM lesson_templates t
    WHERE t.id = template_id AND t.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM lesson_templates t
    WHERE t.id = template_id AND t.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all template blocks"
  ON lesson_template_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- assigned_lessons
CREATE POLICY "Teachers manage own assigned lessons"
  ON assigned_lessons FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view own assigned lessons"
  ON assigned_lessons FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students update own assigned lesson progress"
  ON assigned_lessons FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins manage all assigned lessons"
  ON assigned_lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- assigned_lesson_blocks
CREATE POLICY "Teachers manage assigned lesson blocks"
  ON assigned_lesson_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM assigned_lessons al
    WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM assigned_lessons al
    WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
  ));

CREATE POLICY "Students view own assigned lesson blocks"
  ON assigned_lesson_blocks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assigned_lessons al
    WHERE al.id = assigned_lesson_id AND al.student_id = auth.uid()
  ));

CREATE POLICY "Admins manage all assigned lesson blocks"
  ON assigned_lesson_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- lesson_session_notes
CREATE POLICY "Teachers manage own session notes"
  ON lesson_session_notes FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students view session notes with student summary"
  ON lesson_session_notes FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins manage all session notes"
  ON lesson_session_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- practice_task_completions
CREATE POLICY "Students manage own task completions"
  ON practice_task_completions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view student task completions"
  ON practice_task_completions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assigned_lessons al
    WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all task completions"
  ON practice_task_completions FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- student_practice_notes
CREATE POLICY "Students manage own practice notes"
  ON student_practice_notes FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view student practice notes"
  ON student_practice_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assigned_lessons al
    WHERE al.id = assigned_lesson_id AND al.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all student practice notes"
  ON student_practice_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
