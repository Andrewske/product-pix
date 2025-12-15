-- Create is_admin helper function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_admin = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main messages table
CREATE TABLE user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  analysis JSONB, -- Sentiment analysis results
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX idx_user_messages_created_at ON user_messages(created_at DESC);
CREATE INDEX idx_user_messages_is_from_admin ON user_messages(is_from_admin);
CREATE INDEX idx_user_messages_analysis ON user_messages USING GIN (analysis);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_messages_updated_at
  BEFORE UPDATE ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_messages_updated_at();

-- RLS Policies
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON user_messages
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create own messages" ON user_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_from_admin = false);

CREATE POLICY "Admins can view all messages" ON user_messages
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin messages" ON user_messages
  FOR INSERT WITH CHECK (is_admin(auth.uid()) AND is_from_admin = true);

CREATE POLICY "Admins can update messages" ON user_messages
  FOR UPDATE USING (is_admin(auth.uid()));