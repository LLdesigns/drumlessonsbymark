-- ONE-TIME: Run in Supabase Dashboard -> SQL Editor on an EMPTY project (or after reset).
-- Creates public.profiles, user_roles, CMS tables, songs, storage policies, etc.
-- If tables already exist, expect errors; use supabase db push for incremental updates instead.
-- Generated: 2026-03-31T12:30:54.4989358-05:00



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




-- ========== 20251102040000_fix_user_roles_infinite_recursion.sql ==========

-- Migration: Fix infinite recursion in user_roles RLS policies
-- Description: Replaces direct user_roles queries in policies with SECURITY DEFINER function
-- Date: 2025-11-02

-- Step 1: Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Step 2: Replace function body in place (do NOT DROP — other tables' RLS policies depend on is_admin)
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


