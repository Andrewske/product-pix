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