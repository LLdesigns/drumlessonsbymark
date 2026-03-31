-- ============================================
-- MULTI-ROLE CMS SYSTEM - DATABASE SCHEMA
-- ============================================

-- ============================================
-- EXISTING TABLES (Already Created)
-- ============================================
-- contact_messages table already exists (see supabase-setup.sql)

-- ============================================
-- USER PROFILES & ROLES
-- ============================================

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- User profiles table - extends Supabase auth.users
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  must_change_password BOOLEAN DEFAULT TRUE NOT NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_by ON user_profiles(created_by);
CREATE INDEX idx_user_profiles_active ON user_profiles(active);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TEACHERS TABLE (Extended profile info)
-- ============================================

CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  bio TEXT,
  specialization TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENTS TABLE (Extended profile info)
-- ============================================

CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for students
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_students_status ON students(status);

-- Enable RLS on students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTENT LIBRARY - COURSES
-- ============================================

CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for courses
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTENT LIBRARY - COURSE LESSONS
-- ============================================

CREATE TABLE course_lessons (
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
CREATE INDEX idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX idx_course_lessons_order ON course_lessons(course_id, order_index);

-- Enable RLS on course_lessons
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT COURSE ENROLLMENTS
-- ============================================

CREATE TABLE student_course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, course_id)
);

-- Indexes for enrollments
CREATE INDEX idx_enrollments_student_id ON student_course_enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON student_course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON student_course_enrollments(status);

-- Enable RLS on enrollments
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LESSON COMPLETION TRACKING
-- ============================================

CREATE TABLE lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(student_id, lesson_id)
);

-- Indexes for lesson completions
CREATE INDEX idx_lesson_completions_student_id ON lesson_completions(student_id);
CREATE INDEX idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- Enable RLS on lesson completions
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ASSIGNMENTS
-- ============================================

CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for assignments
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Enable RLS on assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT ASSIGNMENTS (Junction table)
-- ============================================

CREATE TABLE student_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(assignment_id, student_id)
);

-- Indexes for student assignments
CREATE INDEX idx_student_assignments_assignment_id ON student_assignments(assignment_id);
CREATE INDEX idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX idx_student_assignments_status ON student_assignments(status);

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
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_assignments_updated_at BEFORE UPDATE ON student_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Teachers can view their students' profiles
CREATE POLICY "Teachers can view their students"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = user_profiles.id
      AND students.teacher_id = auth.uid()
    )
    OR id = auth.uid()
  );

-- Admins can insert user profiles
CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins and teachers can update profiles (with restrictions)
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- TEACHERS POLICIES
-- ============================================

CREATE POLICY "Teachers can view own profile"
  ON teachers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all teachers"
  ON teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all teachers"
  ON teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STUDENTS POLICIES
-- ============================================

CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teachers can view their students"
  ON students FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can insert their students"
  ON students FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can update their students"
  ON students FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can update all students"
  ON students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COURSES POLICIES
-- ============================================

-- Teachers can view their own courses
CREATE POLICY "Teachers can view own courses"
  ON courses FOR SELECT
  USING (teacher_id = auth.uid());

-- Admins can view all courses
CREATE POLICY "Admins can view all courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COURSE_LESSONS POLICIES
-- ============================================

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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STUDENT_COURSE_ENROLLMENTS POLICIES
-- ============================================

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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can insert enrollments for their courses
CREATE POLICY "Teachers can insert enrollments for their courses"
  ON student_course_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = student_course_enrollments.course_id
      AND courses.teacher_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_course_enrollments.student_id
      AND students.teacher_id = auth.uid()
    )
  );

-- Admins can insert enrollments
CREATE POLICY "Admins can insert enrollments"
  ON student_course_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- LESSON_COMPLETIONS POLICIES
-- ============================================

-- Students can view their own completions
CREATE POLICY "Students can view own lesson completions"
  ON lesson_completions FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can view completions for their courses
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

-- Students can insert their own completions
CREATE POLICY "Students can insert own lesson completions"
  ON lesson_completions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own completions
CREATE POLICY "Students can update own lesson completions"
  ON lesson_completions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ============================================
-- ASSIGNMENTS POLICIES
-- ============================================

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view own assignments"
  ON assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can view assignments assigned to them
CREATE POLICY "Students can view assigned assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_assignments
      WHERE student_assignments.assignment_id = assignments.id
      AND student_assignments.student_id = auth.uid()
    )
  );

-- Teachers can insert their own assignments
CREATE POLICY "Teachers can insert own assignments"
  ON assignments FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Admins can insert assignments
CREATE POLICY "Admins can insert assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can update their own assignments
CREATE POLICY "Teachers can update own assignments"
  ON assignments FOR UPDATE
  USING (teacher_id = auth.uid());

-- Admins can update all assignments
CREATE POLICY "Admins can update all assignments"
  ON assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STUDENT_ASSIGNMENTS POLICIES
-- ============================================

-- Students can view their own assignments
CREATE POLICY "Students can view own student assignments"
  ON student_assignments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can view student assignments for their assignments
CREATE POLICY "Teachers can view student assignments for their assignments"
  ON student_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_assignments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

-- Admins can view all student assignments
CREATE POLICY "Admins can view all student assignments"
  ON student_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can insert student assignments for their assignments
CREATE POLICY "Teachers can insert student assignments for their assignments"
  ON student_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_assignments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_assignments.student_id
      AND students.teacher_id = auth.uid()
    )
  );

-- Admins can insert student assignments
CREATE POLICY "Admins can insert student assignments"
  ON student_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can update their own assignments
CREATE POLICY "Students can update own student assignments"
  ON student_assignments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can update student assignments for their assignments
CREATE POLICY "Teachers can update student assignments for their assignments"
  ON student_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = student_assignments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

