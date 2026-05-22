-- Run in Supabase SQL Editor if contact form → Messages is not working yet.
-- Then deploy: npx supabase functions deploy submit-contact-inquiry --no-verify-jwt

-- (Same as migration 20250527000000_website_contact_messages.sql)
ALTER TABLE studio_messages DROP CONSTRAINT IF EXISTS studio_messages_message_type_check;
ALTER TABLE studio_messages
  ADD CONSTRAINT studio_messages_message_type_check
  CHECK (message_type IN ('chat', 'reminder', 'encouragement', 'lesson_note', 'link', 'contact_form'));

ALTER TABLE studio_messages ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_phone TEXT;
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
