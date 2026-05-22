-- Optional phone on website contact inquiries

ALTER TABLE studio_messages ADD COLUMN IF NOT EXISTS guest_phone TEXT;
