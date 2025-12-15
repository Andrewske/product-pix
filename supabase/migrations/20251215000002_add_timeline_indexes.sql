CREATE INDEX IF NOT EXISTS idx_jobs_user_time ON jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_time ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_user_time ON user_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_time ON generated_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_feedback_user_time ON image_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_critical_errors_user_time ON critical_errors(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_user_time ON uploads(user_id, created_at DESC);