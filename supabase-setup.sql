-- Create contact_messages table
CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'contact_form',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for better query performance
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_read ON contact_messages(read);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert messages (for the contact form)
CREATE POLICY "Allow public to insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows authenticated users to read all messages (for admin)
CREATE POLICY "Allow authenticated users to read contact messages" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to update messages (for marking as read)
CREATE POLICY "Allow authenticated users to update contact messages" ON contact_messages
  FOR UPDATE USING (auth.role() = 'authenticated');
