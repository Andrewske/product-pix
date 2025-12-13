# Create Database Migrations for Error Tables

## Files to Modify/Create
- `supabase/migrations/00033_create_critical_errors.sql` (new)
- `supabase/migrations/00034_create_observability_failures.sql` (new)

## Implementation Details

**Note**: PostHog queue table removed - posthog-node library handles batching and retries internally.

### Critical Errors Table (00033)

Create table for critical error tracking with full context:

```sql
CREATE TABLE critical_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  error_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_stack TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  domain TEXT NOT NULL CHECK (domain IN ('payment', 'credit', 'generation', 'auth', 'validation', 'rate-limit', 'system')),
  route TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Primary query indexes
CREATE INDEX idx_critical_errors_user_id ON critical_errors(user_id);
CREATE INDEX idx_critical_errors_created_at ON critical_errors(created_at DESC);
CREATE INDEX idx_critical_errors_severity ON critical_errors(severity);
CREATE INDEX idx_critical_errors_domain ON critical_errors(domain);
CREATE INDEX idx_critical_errors_error_code ON critical_errors(error_code);

-- Optimized index for unresolved critical errors (admin dashboard)
CREATE INDEX idx_critical_errors_unresolved ON critical_errors(created_at DESC)
  WHERE resolved_at IS NULL AND severity = 'critical';

-- RLS policies
ALTER TABLE critical_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all critical errors" ON critical_errors
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own critical errors" ON critical_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert critical errors" ON critical_errors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update critical errors" ON critical_errors
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
```

### Observability Failures Table (00034)

Create fallback table for when observability system itself fails:

```sql
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
```

## Acceptance Criteria
- [ ] Both migration files created
- [ ] critical_errors table with proper columns, indexes, RLS
- [ ] error_code index added for efficient querying
- [ ] observability_failures table with admin-only access
- [ ] Migrations run successfully with `npx supabase db push`
- [ ] Types generated with `npx supabase gen types ts`

## Dependencies
None (database changes are independent)
