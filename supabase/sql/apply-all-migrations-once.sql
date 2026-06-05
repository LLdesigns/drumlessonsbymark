-- ONE-TIME: Run in Supabase Dashboard -> SQL Editor on an EMPTY project (or after reset).
-- Creates schema from all files in supabase/migrations/ (sorted by filename).
-- If tables already exist, expect errors on CREATE â€” use supabase db push for incremental updates instead.
-- Regenerated: 2026-05-29T09:14:48.2861620-05:00

-- ========== 20241201000000_foundation.sql ==========

-- Foundation: enums, profiles, user_roles, teacher_students, contact_messages,
-- is_admin(), auth triggers, and RLS required before domain schema and songs migrations.

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'author');

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;
CREATE INDEX idx_profiles_active ON public.profiles(active);
CREATE INDEX idx_profiles_created_by ON public.profiles(created_by);

CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role user_role NOT NULL,
  granted_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.teacher_students (
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_id, student_id)
);

CREATE TABLE public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'contact_form',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_read ON public.contact_messages(read);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read contact messages" ON public.contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update contact messages" ON public.contact_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = check_user_id
      AND user_roles.role = 'admin'::user_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

CREATE OR REPLACE FUNCTION public.user_has_role(
  check_user_id UUID,
  check_role user_role
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value
  FROM public.user_roles
  WHERE user_id = check_user_id
  LIMIT 1;

  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own assignments"
  ON public.teacher_students FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view own assignments"
  ON public.teacher_students FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can insert own assignments"
  ON public.teacher_students FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own assignments"
  ON public.teacher_students FOR DELETE
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage teacher_students"
  ON public.teacher_students FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- ========== 20241201000001_domain_and_cms.sql ==========

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


-- ========== 20250102000000_add_songs_system.sql ==========

-- Migration: Add Songs System
-- Description: Adds employee role, songs table, song_stems table, and related RLS policies
-- Date: 2025-01-02

-- ============================================
-- STEP 1: Add 'employee' role to enum
-- ============================================
-- PostgreSQL doesn't support IF NOT EXISTS on ALTER TYPE, so we check first
DO $$
BEGIN
  -- Check if the enum type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Check if 'employee' value already exists
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_enum 
      WHERE enumlabel = 'employee' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      -- Add the 'employee' value
      ALTER TYPE user_role ADD VALUE 'employee';
    END IF;
  ELSE
    -- If enum doesn't exist, create it with all values
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'author', 'employee');
  END IF;
END $$;

-- ============================================
-- STEP 2: Create songs table
-- ============================================
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  bpm INTEGER,
  key TEXT,
  description TEXT,
  tags TEXT[], -- Array of tags
  cover_art_url TEXT,
  cover_art_storage_path TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live')),
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for songs
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status);
CREATE INDEX IF NOT EXISTS idx_songs_created_by ON songs(created_by);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_difficulty ON songs(difficulty);
CREATE INDEX IF NOT EXISTS idx_songs_title_artist ON songs USING gin(to_tsvector('english', title || ' ' || COALESCE(artist, '')));
CREATE INDEX IF NOT EXISTS idx_songs_tags ON songs USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);

-- Enable RLS on songs
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create song_stems table
-- ============================================
CREATE TABLE IF NOT EXISTS song_stems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL, -- e.g., 'vocals', 'drums', 'bass', 'guitar', 'keys', etc.
  storage_path TEXT NOT NULL, -- Path in Supabase storage
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(song_id, instrument)
);

-- Indexes for song_stems
CREATE INDEX IF NOT EXISTS idx_song_stems_song_id ON song_stems(song_id);
CREATE INDEX IF NOT EXISTS idx_song_stems_instrument ON song_stems(instrument);
CREATE INDEX IF NOT EXISTS idx_song_stems_order ON song_stems(song_id, order_index);

-- Enable RLS on song_stems
ALTER TABLE song_stems ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create helper function for checking roles
-- ============================================
CREATE OR REPLACE FUNCTION is_employee(check_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'employee'::user_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_employee(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_employee(UUID) TO anon;

-- ============================================
-- STEP 5: RLS Policies for songs
-- ============================================

-- Admins can view all songs
CREATE POLICY "Admins can view all songs"
  ON songs FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert any song
CREATE POLICY "Admins can insert songs"
  ON songs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update any song
CREATE POLICY "Admins can update any song"
  ON songs FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete any song
CREATE POLICY "Admins can delete any song"
  ON songs FOR DELETE
  USING (is_admin(auth.uid()));

-- Employees can view all songs (read-only for others)
CREATE POLICY "Employees can view all songs"
  ON songs FOR SELECT
  USING (is_employee(auth.uid()));

-- Employees can insert their own songs
CREATE POLICY "Employees can insert own songs"
  ON songs FOR INSERT
  WITH CHECK (is_employee(auth.uid()) AND created_by = auth.uid());

-- Employees can update their own songs
CREATE POLICY "Employees can update own songs"
  ON songs FOR UPDATE
  USING (is_employee(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (is_employee(auth.uid()) AND created_by = auth.uid());

-- Employees can delete their own songs
CREATE POLICY "Employees can delete own songs"
  ON songs FOR DELETE
  USING (is_employee(auth.uid()) AND created_by = auth.uid());

-- Teachers can view live songs (read-only, for future use)
CREATE POLICY "Teachers can view live songs"
  ON songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'teacher'::user_role
    )
    AND status = 'live'
  );

-- Students can view live songs (read-only)
CREATE POLICY "Students can view live songs"
  ON songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'student'::user_role
    )
    AND status = 'live'
  );

-- ============================================
-- STEP 6: RLS Policies for song_stems
-- ============================================

-- Admins can view all stems
CREATE POLICY "Admins can view all stems"
  ON song_stems FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert stems
CREATE POLICY "Admins can insert stems"
  ON song_stems FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())
    AND EXISTS (SELECT 1 FROM songs WHERE id = song_id)
  );

-- Admins can update stems
CREATE POLICY "Admins can update stems"
  ON song_stems FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete stems
CREATE POLICY "Admins can delete stems"
  ON song_stems FOR DELETE
  USING (is_admin(auth.uid()));

-- Employees can view stems for songs they can access
CREATE POLICY "Employees can view accessible stems"
  ON song_stems FOR SELECT
  USING (
    is_employee(auth.uid())
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND (
        songs.created_by = auth.uid()
        OR songs.status = 'live'
      )
    )
  );

-- Employees can insert stems for their own songs
CREATE POLICY "Employees can insert stems for own songs"
  ON song_stems FOR INSERT
  WITH CHECK (
    is_employee(auth.uid())
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND songs.created_by = auth.uid()
    )
  );

-- Employees can update stems for their own songs
CREATE POLICY "Employees can update stems for own songs"
  ON song_stems FOR UPDATE
  USING (
    is_employee(auth.uid())
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND songs.created_by = auth.uid()
    )
  )
  WITH CHECK (
    is_employee(auth.uid())
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND songs.created_by = auth.uid()
    )
  );

-- Employees can delete stems for their own songs
CREATE POLICY "Employees can delete stems for own songs"
  ON song_stems FOR DELETE
  USING (
    is_employee(auth.uid())
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND songs.created_by = auth.uid()
    )
  );

-- Teachers can view stems for live songs
CREATE POLICY "Teachers can view stems for live songs"
  ON song_stems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'teacher'::user_role
    )
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND songs.status = 'live'
    )
  );

-- Students can view stems for live songs
CREATE POLICY "Students can view stems for live songs"
  ON song_stems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'student'::user_role
    )
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id = song_stems.song_id
      AND songs.status = 'live'
    )
  );

-- ============================================
-- STEP 7: Create trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for songs
DROP TRIGGER IF EXISTS update_songs_updated_at ON songs;
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for song_stems
DROP TRIGGER IF EXISTS update_song_stems_updated_at ON song_stems;
CREATE TRIGGER update_song_stems_updated_at
  BEFORE UPDATE ON song_stems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ========== 20250102000001_setup_song_storage.sql ==========

-- Migration: Setup Song Storage Bucket
-- Description: Creates storage bucket for song stems and cover art with appropriate policies
-- Date: 2025-01-02

-- Ensure required functions exist (they should be created in previous migration)
-- If they don't exist, this will fail gracefully and you'll need to run the songs migration first

-- Create storage bucket for song stems
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-stems',
  'song-stems',
  false, -- Private bucket - signed URLs needed
  524288000, -- 500MB max file size
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for song cover art
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-covers',
  'song-covers',
  true, -- Public bucket for cover art
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for song-stems bucket
-- ============================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can upload song stems" ON storage.objects;
DROP POLICY IF EXISTS "Admins can download song stems" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update song stems" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete song stems" ON storage.objects;
DROP POLICY IF EXISTS "Employees can upload song stems" ON storage.objects;
DROP POLICY IF EXISTS "Employees can download song stems" ON storage.objects;
DROP POLICY IF EXISTS "Employees can update own song stems" ON storage.objects;
DROP POLICY IF EXISTS "Employees can delete own song stems" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can download live song stems" ON storage.objects;
DROP POLICY IF EXISTS "Students can download live song stems" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view song covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage song covers" ON storage.objects;
DROP POLICY IF EXISTS "Employees can manage own song covers" ON storage.objects;

-- Admins can upload/download any file
CREATE POLICY "Admins can upload song stems"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'song-stems'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can download song stems"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-stems'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can update song stems"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'song-stems'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete song stems"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'song-stems'
    AND is_admin(auth.uid())
  );

-- Employees can upload/download their own song stems
-- We'll check ownership via the songs table (path structure: song_id/instrument.*)
CREATE POLICY "Employees can upload song stems"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'song-stems'
    AND is_employee(auth.uid())
  );

CREATE POLICY "Employees can download song stems"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-stems'
    AND (
      is_employee(auth.uid())
      OR (
        -- Allow download if song is live
        EXISTS (
          SELECT 1 FROM songs
          WHERE songs.id::text = split_part(storage.objects.name, '/', 1)
          AND songs.status = 'live'
        )
      )
    )
  );

CREATE POLICY "Employees can update own song stems"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'song-stems'
    AND is_employee(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'song-stems'
    AND is_employee(auth.uid())
  );

CREATE POLICY "Employees can delete own song stems"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'song-stems'
    AND is_employee(auth.uid())
  );

-- Teachers and Students can download stems for live songs
CREATE POLICY "Teachers can download live song stems"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-stems'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'teacher'::user_role
    )
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id::text = split_part(storage.objects.name, '/', 1)
      AND songs.status = 'live'
    )
  );

CREATE POLICY "Students can download live song stems"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-stems'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'student'::user_role
    )
    AND EXISTS (
      SELECT 1 FROM songs
      WHERE songs.id::text = split_part(storage.objects.name, '/', 1)
      AND songs.status = 'live'
    )
  );

-- ============================================
-- Storage Policies for song-covers bucket (public)
-- ============================================

-- Anyone can view public cover art
CREATE POLICY "Anyone can view song covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'song-covers');

-- Admins can upload/update/delete cover art
CREATE POLICY "Admins can manage song covers"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'song-covers'
    AND is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'song-covers'
    AND is_admin(auth.uid())
  );

-- Employees can upload/update/delete their own song covers
CREATE POLICY "Employees can manage own song covers"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'song-covers'
    AND is_employee(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'song-covers'
    AND is_employee(auth.uid())
  );


-- ========== 20250103000000_configure_30day_session.sql ==========

-- Migration: Configure 30-Day Session Cache
-- Description: This migration documents and sets up configuration for 30-day session persistence
-- Note: JWT expiration settings must be configured in Supabase Dashboard (not via SQL)
-- Date: 2025-01-03

-- ============================================
-- IMPORTANT: JWT Configuration Instructions
-- ============================================
-- 
-- To enable 30-day sessions, you MUST configure JWT settings in Supabase Dashboard:
-- 
-- 1. Go to: https://supabase.com/dashboard/project/cfzvnrlmbgtkltbzovte/auth/settings
-- 2. Navigate to: Authentication â†’ Settings â†’ JWT expiry
-- 3. Set the following values:
--    - Access Token JWT expiry: 2592000 (30 days in seconds)
--    - Refresh Token expiry: 2592000 (30 days in seconds)
-- 
-- Alternative: If you want longer refresh tokens:
--    - Access Token JWT expiry: 3600 (1 hour - shorter for security)
--    - Refresh Token expiry: 2592000 (30 days - longer for persistence)
--
-- The client-side code will automatically refresh access tokens using the refresh token.
-- 
-- ============================================
-- Note: The following is documentation only
-- ============================================
-- 
-- Supabase stores sessions in the auth.sessions table, but JWT expiration
-- is controlled by the JWT secret and expiration settings configured in
-- the dashboard, not by database settings.
--
-- Client-side session persistence is already handled by:
-- 1. localStorage storage (configured in src/lib/supabase.ts)
-- 2. Auto-refresh token mechanism (configured in src/lib/supabase.ts)
-- 3. Session expiration tracking (in src/store/auth.ts)
--
-- This ensures users remain logged in for 30 days without re-authentication.


-- ========== 20250120000000_add_stem_metadata.sql ==========

-- Add metadata fields to song_stems table
-- This allows each stem to have solo, mute, volume, and other metadata

ALTER TABLE song_stems 
ADD COLUMN IF NOT EXISTS is_solo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS volume DECIMAL(3,2) DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 1),
ADD COLUMN IF NOT EXISTS pan DECIMAL(3,2) DEFAULT 0.0 CHECK (pan >= -1 AND pan <= 1),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_song_stems_metadata ON song_stems USING gin(metadata);

-- Add comment
COMMENT ON COLUMN song_stems.is_solo IS 'Whether this stem is soloed (only this stem plays)';
COMMENT ON COLUMN song_stems.is_muted IS 'Whether this stem is muted';
COMMENT ON COLUMN song_stems.volume IS 'Volume level from 0.0 to 1.0';
COMMENT ON COLUMN song_stems.pan IS 'Pan position from -1.0 (left) to 1.0 (right)';
COMMENT ON COLUMN song_stems.metadata IS 'Additional metadata as JSON (e.g., effects, EQ settings, etc.)';


-- ========== 20250522000000_studio_portal.sql ==========

-- Mark's Drum Studio Portal â€” teaching workspace tables

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

-- ========== 20250523000000_profile_theme_preference.sql ==========

-- User appearance preference (synced when logged in)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark'
  CHECK (theme_preference IN ('dark', 'light', 'system'));

COMMENT ON COLUMN public.profiles.theme_preference IS 'UI theme: dark, light, or system (follows OS)';

-- ========== 20250524000000_notifications_pwa.sql ==========

-- Notifications, push subscriptions, and preferences for Mark's Drum Studio Portal

CREATE TYPE notification_type AS ENUM (
  'message_received',
  'lesson_reminder',
  'assignment_added',
  'assignment_completed',
  'schedule_changed',
  'practice_upload',
  'lesson_note_added'
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  message_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  lesson_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  assignment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  schedule_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  practice_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  pushed_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications(recipient_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications(recipient_id, created_at DESC);

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Preferences: own row only
CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all notification preferences"
  ON notification_preferences FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Push subscriptions: own devices
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications: recipient can read/update read_at; system inserts via service role
CREATE POLICY "Recipients read own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Recipients mark own notifications read"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Admins read all notifications"
  ON notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Auto-create preferences when profile exists (optional convenience)
CREATE OR REPLACE FUNCTION ensure_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_notification_prefs ON profiles;
CREATE TRIGGER on_profile_notification_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_notification_preferences();

-- ========== 20250525000000_lesson_planning.sql ==========

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

-- ========== 20250525000001_studio_media_storage.sql ==========

-- Storage for lesson planning media (notation images, audio, video)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-media',
  'studio-media',
  false,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Teachers upload to their folder; students upload practice media to their folder
CREATE POLICY "Teachers upload studio media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'studio-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('teacher', 'admin', 'author', 'employee')
    )
  );

CREATE POLICY "Students upload practice media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'studio-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Users read own studio media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'studio-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM teacher_students ts
        WHERE ts.teacher_id::text = (storage.foldername(name))[1]
        AND ts.student_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM teacher_students ts
        WHERE ts.student_id::text = (storage.foldername(name))[1]
        AND ts.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users update own studio media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own studio media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ========== 20250526000000_assigned_lesson_notes.sql ==========

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

-- ========== 20250527000000_website_contact_messages.sql ==========

-- Website contact form â†’ Mark's studio_messages (guest inquiries, no auth sender)

ALTER TABLE studio_messages DROP CONSTRAINT IF EXISTS studio_messages_message_type_check;
ALTER TABLE studio_messages
  ADD CONSTRAINT studio_messages_message_type_check
  CHECK (message_type IN ('chat', 'reminder', 'encouragement', 'lesson_note', 'link', 'contact_form'));

ALTER TABLE studio_messages ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS is_website_inquiry BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE studio_messages DROP CONSTRAINT IF EXISTS studio_messages_inquiry_check;
ALTER TABLE studio_messages
  ADD CONSTRAINT studio_messages_inquiry_check
  CHECK (
    (is_website_inquiry = FALSE AND sender_id IS NOT NULL)
    OR (
      is_website_inquiry = TRUE
      AND sender_id IS NULL
      AND guest_name IS NOT NULL
      AND guest_email IS NOT NULL
      AND recipient_id IS NOT NULL
    )
  );

-- ========== 20250528000000_guest_phone.sql ==========

-- Optional phone on website contact inquiries

ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- ========== 20250528000000_student_lesson_self_enroll.sql ==========

-- Students can browse their teacher's active lesson library and self-enroll.

ALTER TABLE assigned_lessons
  ADD COLUMN IF NOT EXISTS enrollment_source TEXT NOT NULL DEFAULT 'teacher'
  CHECK (enrollment_source IN ('teacher', 'student'));

COMMENT ON COLUMN assigned_lessons.enrollment_source IS 'teacher = assigned by Mark; student = self-started from library';

-- Prevent duplicate active enrollments for the same template (optional index for lookups)
CREATE INDEX IF NOT EXISTS idx_assigned_lessons_student_template
  ON assigned_lessons(student_id, template_id)
  WHERE template_id IS NOT NULL AND status NOT IN ('archived', 'completed');

-- Students read active templates from their linked teacher
CREATE POLICY "Students view teacher active lesson templates"
  ON lesson_templates FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM teacher_students ts
      WHERE ts.student_id = auth.uid() AND ts.teacher_id = lesson_templates.teacher_id
    )
  );

CREATE POLICY "Students view blocks on teacher active templates"
  ON lesson_template_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_templates t
      JOIN teacher_students ts ON ts.teacher_id = t.teacher_id AND ts.student_id = auth.uid()
      WHERE t.id = template_id AND t.status = 'active'
    )
  );

-- Students self-enroll (copy template into assigned_lessons)
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

-- ========== 20250529000000_teacher_students_archive.sql ==========

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

-- Self-enroll / library access only for active teacherâ€“student links
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

-- ========== 20251102031124_remote_schema.sql ==========



-- ========== 20251102040000_fix_user_roles_infinite_recursion.sql ==========

-- Migration: Fix infinite recursion in user_roles RLS policies
-- Description: Replaces direct user_roles queries in policies with SECURITY DEFINER function
-- Date: 2025-11-02

-- Step 1: Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Step 2: Replace function body in place (do NOT DROP â€” other tables' RLS policies depend on is_admin)
-- Step 3: Create the new function with SECURITY DEFINER
-- This bypasses RLS, preventing infinite recursion when checking admin status
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- SECURITY DEFINER allows this function to bypass RLS
  -- This is safe because it only reads, not modifies data
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'admin'::user_role
  );
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- Step 5: Recreate policies using the function (no recursion!)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

