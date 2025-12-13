CREATE TABLE observability_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_data JSONB NOT NULL,
  failure_reason TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_observability_failures_unreviewed ON observability_failures(created_at DESC)
  WHERE reviewed_at IS NULL;

ALTER TABLE observability_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view observability failures" ON observability_failures
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can insert observability failures" ON observability_failures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update observability failures" ON observability_failures
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');