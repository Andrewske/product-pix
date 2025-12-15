# Database Schema Setup

## Files to Modify/Create
- `supabase/migrations/YYYYMMDD_create_user_activity.sql` (new)
- `supabase/migrations/YYYYMMDD_add_last_active_at.sql` (new)
- `supabase/migrations/YYYYMMDD_add_timeline_indexes.sql` (new)

## Implementation Details

### 1. Create `user_activity` table

```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user_time ON user_activity(user_id, created_at DESC);
CREATE INDEX idx_user_activity_event_type ON user_activity(event_type);
```

Event types to track:
- `login` - User logged in
- `logout` - User logged out
- `image_download` - Image downloaded (properties: { image_id })
- `pricing_viewed` - Viewed pricing page
- `insufficient_credits` - Hit credit wall (properties: { required, available })

### 2. Add `last_active_at` column to users table

```sql
ALTER TABLE users ADD COLUMN last_active_at TIMESTAMPTZ;
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);
```

### 3. Add indexes for timeline queries

```sql
CREATE INDEX IF NOT EXISTS idx_jobs_user_time ON jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_time ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_user_time ON user_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_time ON generated_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_feedback_user_time ON image_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_critical_errors_user_time ON critical_errors(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_user_time ON uploads(user_id, created_at DESC);
```

## Acceptance Criteria
- [ ] All three migrations created with proper timestamps
- [ ] `npx supabase db push` completes without errors
- [ ] Verify indexes exist: `\d user_activity`, `\d users`, check each timeline table

## Dependencies
None - this is the first task.
