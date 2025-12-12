-- Create contact_messages table for storing contact form submissions
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  email TEXT NOT NULL CHECK (char_length(email) >= 3 AND char_length(email) <= 255),
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 5000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'responded', 'archived')),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin users can read contact messages
CREATE POLICY "Admin can read contact messages" ON contact_messages
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Anyone can insert (for public contact form)
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();