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

