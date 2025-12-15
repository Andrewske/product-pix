-- Composite index for filtered timeline queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type_time
  ON user_activity(user_id, event_type, created_at DESC);