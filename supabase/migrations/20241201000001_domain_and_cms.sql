-- ============================================
-- MULTI-ROLE CMS SYSTEM - DATABASE SCHEMA
-- ADAPTED FOR EXISTING DATABASE STRUCTURE
-- ============================================

-- ============================================
-- EXISTING TABLES (Already Created)
-- ============================================
-- contact_messages table already exists
-- profiles table already exists (user_id is primary key)
-- user_roles table already exists
-- teacher_students table already exists

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add first_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;

  -- Add last_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;

  -- Add email if it doesn't exist (get from auth.users)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    -- Update email from auth.users if possible
    UPDATE profiles p
    SET email = au.email
    FROM auth.users au
    WHERE p.user_id = au.id AND p.email IS NULL;
  END IF;

  -- Add must_change_password if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;

  -- Add active status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;

  -- Add created_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON profiles(created_by);

-- Use existing user_role enum (already exists with: 'admin', 'teacher', 'student', 'author')
-- No need to create - it's already in your database

-- ============================================
-- TEACHERS TABLE (Extended profile info)
-- ============================================

CREATE TABLE IF NOT EXISTS teachers (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTENT LIBRARY - COURSES
-- ============================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTENT LIBRARY - COURSE LESSONS
-- ============================================

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_storage_path TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(course_id, order_index)
);

-- Indexes for course_lessons
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(course_id, order_index);

-- Enable RLS on course_lessons
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT COURSE ENROLLMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS student_course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, course_id)
);

-- Indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON student_course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON student_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON student_course_enrollments(status);

-- Enable RLS on enrollments
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LESSON COMPLETION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(student_id, lesson_id)
);

-- Indexes for lesson completions
CREATE INDEX IF NOT EXISTS idx_lesson_completions_student_id ON lesson_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- Enable RLS on lesson completions
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Enable RLS on assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT ASSIGNMENTS (Junction table)
-- ============================================

CREATE TABLE IF NOT EXISTS student_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(assignment_id, student_id)
);

-- Indexes for student assignments
CREATE INDEX IF NOT EXISTS idx_student_assignments_assignment_id ON student_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_status ON student_assignments(status);

-- Enable RLS on student assignments
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON course_lessons;
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_assignments_updated_at ON student_assignments;
CREATE TRIGGER update_student_assignments_updated_at BEFORE UPDATE ON student_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION FOR SAFE POLICY CREATION
-- ============================================

-- Helper function to create policies only if they don't exist
-- PostgreSQL doesn't support CREATE POLICY IF NOT EXISTS, so we use this function
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  p_table_name text,
  p_policy_name text,
  p_cmd text,
  p_qual text,
  p_with_check text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = p_table_name
    AND policyname = p_policy_name
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s USING (%s) %s',
      p_policy_name,
      p_table_name,
      p_cmd,
      p_qual,
      COALESCE('WITH CHECK (' || p_with_check || ')', '')
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ============================================
-- PROFILES POLICIES (Updated for existing table)
-- ============================================

-- NOTE: Existing policies already exist:
-- - "Read own profile" (SELECT, auth.uid() = user_id)
-- - "Read public profiles" (SELECT, is_public = true)
-- - "Insert own profile" (INSERT, auth.uid() = user_id)
-- - "Update own profile" (UPDATE, auth.uid() = user_id)
--
-- We'll ADD additional policies for admin/teacher functionality
-- without dropping existing ones

-- Additional policies for CMS functionality (existing policies remain)
-- Admins can view all profiles (in addition to existing read policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;

-- Teachers can view their students' profiles (via teacher_students junction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Teachers can view their students'
  ) THEN
    CREATE POLICY "Teachers can view their students"
      ON profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM teacher_students
          WHERE teacher_students.student_id = profiles.user_id
          AND teacher_students.teacher_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Admins can insert profiles (in addition to existing insert policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Admins can insert profiles'
  ) THEN
    CREATE POLICY "Admins can insert profiles"
      ON profiles FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;

-- Admins can update all profiles (in addition to existing update policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;

-- ============================================
-- TEACHERS POLICIES
-- ============================================

-- Create policies for teachers table (new table, no conflicts)
-- Since this is a new table, policies shouldn't exist, but we check anyway

CREATE POLICY "Teachers can view own profile"
  ON teachers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all teachers"
  ON teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can update all teachers"
  ON teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- ============================================
-- COURSES POLICIES
-- ============================================

-- Create policies for courses (new table, no conflicts)
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can view all courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can view enrolled courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can insert own courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can insert courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can update own courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can update all courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can delete own courses" ON courses;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can delete all courses" ON courses;

-- Teachers can view their own courses
CREATE POLICY "Teachers can view own courses"
  ON courses FOR SELECT
  USING (teacher_id = auth.uid());

-- Admins can view all courses
CREATE POLICY "Admins can view all courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Students can view published courses they're enrolled in
CREATE POLICY "Students can view enrolled courses"
  ON courses FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM student_course_enrollments
      WHERE course_id = courses.id
      AND student_id = auth.uid()
      AND status = 'active'
    )
  );

-- Teachers can insert their own courses
CREATE POLICY "Teachers can insert own courses"
  ON courses FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Admins can insert courses
CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Teachers can update their own courses
CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  USING (teacher_id = auth.uid());

-- Admins can update all courses
CREATE POLICY "Admins can update all courses"
  ON courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Teachers can delete their own courses
CREATE POLICY "Teachers can delete own courses"
  ON courses FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins can delete all courses
CREATE POLICY "Admins can delete all courses"
  ON courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- ============================================
-- COURSE_LESSONS POLICIES
-- ============================================

-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can view own course lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can view all lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can view enrolled course lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can insert own course lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can insert lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can update own course lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can update all lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can delete own course lessons" ON course_lessons;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can delete all lessons" ON course_lessons;

-- Teachers can view lessons in their courses
CREATE POLICY "Teachers can view own course lessons"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Students can view lessons in enrolled published courses
CREATE POLICY "Students can view enrolled course lessons"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN student_course_enrollments ON courses.id = student_course_enrollments.course_id
      WHERE courses.id = course_lessons.course_id
      AND student_course_enrollments.student_id = auth.uid()
      AND courses.status = 'published'
      AND student_course_enrollments.status = 'active'
    )
  );

-- Teachers can insert lessons in their courses
CREATE POLICY "Teachers can insert own course lessons"
  ON course_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Admins can insert lessons
CREATE POLICY "Admins can insert lessons"
  ON course_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Teachers can update lessons in their courses
CREATE POLICY "Teachers can update own course lessons"
  ON course_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Admins can update all lessons
CREATE POLICY "Admins can update all lessons"
  ON course_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Teachers can delete lessons in their courses
CREATE POLICY "Teachers can delete own course lessons"
  ON course_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_lessons.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Admins can delete all lessons
CREATE POLICY "Admins can delete all lessons"
  ON course_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- ============================================
-- STUDENT_COURSE_ENROLLMENTS POLICIES
-- ============================================

-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can view own enrollments" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can view enrollments for their courses" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can view all enrollments" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can insert enrollments for their courses" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can insert enrollments" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can update own enrollment progress" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can update enrollments for their courses" ON student_course_enrollments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can update all enrollments" ON student_course_enrollments;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON student_course_enrollments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can view enrollments for their courses
CREATE POLICY "Teachers can view enrollments for their courses"
  ON student_course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = student_course_enrollments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
  ON student_course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Teachers can insert enrollments for their courses (check via teacher_students)
CREATE POLICY "Teachers can insert enrollments for their courses"
  ON student_course_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = student_course_enrollments.course_id
      AND courses.teacher_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM teacher_students
      WHERE teacher_students.student_id = student_course_enrollments.student_id
      AND teacher_students.teacher_id = auth.uid()
    )
  );

-- Admins can insert enrollments
CREATE POLICY "Admins can insert enrollments"
  ON student_course_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- Students can update their own enrollment progress
CREATE POLICY "Students can update own enrollment progress"
  ON student_course_enrollments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can update enrollments for their courses
CREATE POLICY "Teachers can update enrollments for their courses"
  ON student_course_enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = student_course_enrollments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Admins can update all enrollments
CREATE POLICY "Admins can update all enrollments"
  ON student_course_enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- ============================================
-- LESSON_COMPLETIONS POLICIES
-- ============================================

-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can view own lesson completions" ON lesson_completions;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can view completions for their courses" ON lesson_completions;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can insert own lesson completions" ON lesson_completions;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can update own lesson completions" ON lesson_completions;

CREATE POLICY "Students can view own lesson completions"
  ON lesson_completions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view completions for their courses"
  ON lesson_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN courses ON course_lessons.course_id = courses.id
      WHERE course_lessons.id = lesson_completions.lesson_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own lesson completions"
  ON lesson_completions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own lesson completions"
  ON lesson_completions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ============================================
-- ASSIGNMENTS POLICIES
-- ============================================

-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can view own assignments" ON assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can view all assignments" ON assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can view assigned assignments" ON assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can insert own assignments" ON assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can insert assignments" ON assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can update own assignments" ON assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can update all assignments" ON assignments;

CREATE POLICY "Teachers can view own assignments"
  ON assignments FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Students can view assigned assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_assignments
      WHERE student_assignments.assignment_id = assignments.id
      AND student_assignments.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert own assignments"
  ON assignments FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can insert assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Teachers can update own assignments"
  ON assignments FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can update all assignments"
  ON assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

-- ============================================
-- STUDENT_ASSIGNMENTS POLICIES
-- ============================================

-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can view own student assignments" ON student_assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can view student assignments for their assignments" ON student_assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can view all student assignments" ON student_assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can insert student assignments for their assignments" ON student_assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Admins can insert student assignments" ON student_assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Students can update own student assignments" ON student_assignments;
-- Using IF NOT EXISTS for all policies to avoid conflicts
-- CREATE POLICY IF NOT EXISTS "Teachers can update student assignments for their assignments" ON student_assignments;

CREATE POLICY "Students can view own student assignments"
  ON student_assignments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student assignments for their assignments"
  ON student_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_assignments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all student assignments"
  ON student_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Teachers can insert student assignments for their assignments"
  ON student_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_assignments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM teacher_students
      WHERE teacher_students.student_id = student_assignments.student_id
      AND teacher_students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert student assignments"
  ON student_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Students can update own student assignments"
  ON student_assignments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can update student assignments for their assignments"
  ON student_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_assignments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

