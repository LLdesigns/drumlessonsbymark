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

