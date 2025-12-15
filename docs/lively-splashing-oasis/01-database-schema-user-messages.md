# Database Schema: User Messages & Sentiment Queue

## Files to Create
- `supabase/migrations/[timestamp]_create_user_messages.sql` (new)
- `supabase/migrations/[timestamp]_create_sentiment_queue.sql` (new)

## Implementation Details

### User Messages Table
Create the main table for storing chat messages between users and admin:

```sql
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

-- Updated_at trigger (copy pattern from image_feedback)
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

-- RLS Policies (mirror image_feedback pattern)
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
```

**Note**: The `is_admin()` helper function already exists from the image_feedback system.

### Sentiment Analysis Queue Table

```sql
-- Track messages pending sentiment analysis
CREATE TABLE sentiment_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES user_messages(id) ON DELETE CASCADE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(message_id)
);

CREATE INDEX idx_sentiment_queue_unprocessed
  ON sentiment_analysis_queue(created_at)
  WHERE processed_at IS NULL;
```

## Reference Pattern
- Copy structure from `supabase/migrations/20251212000000_create_image_feedback.sql`

## Acceptance Criteria
- ✅ Both migrations run successfully with `npx supabase db push`
- ✅ RLS policies prevent users from reading other users' messages
- ✅ Admin can view all messages
- ✅ `analysis` JSONB column accepts sentiment data
- ✅ Queue table tracks unprocessed messages efficiently
