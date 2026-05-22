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
