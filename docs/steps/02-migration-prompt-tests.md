# Step 02: Create prompt_tests Migration

## Objective

Create the database migration for the `prompt_tests` table, which tracks individual test generations with idempotency and status tracking.

## Prerequisites

- Step 01 completed (prompt_templates table must exist)

## Files to Create

### `supabase/migrations/00010_create_prompt_tests.sql`

```sql
-- Migration: Create prompt_tests table
-- Tracks individual test generations with idempotency and status

-- Create enum for test status
CREATE TYPE prompt_test_status AS ENUM ('pending', 'generating', 'evaluating', 'completed', 'failed');

CREATE TABLE public.prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.prompt_templates(id),

  -- Idempotency (prevents duplicate tests from script reruns)
  idempotency_key TEXT UNIQUE,

  -- Status tracking
  status prompt_test_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  error_code TEXT,                  -- e.g., 'GENERATION_ERROR', 'EVALUATION_ERROR'

  -- Inputs & Output
  inputs JSONB NOT NULL,            -- { product: "mug", color: "red" }
  final_prompt TEXT NOT NULL,
  image_url TEXT,                   -- R2 URL
  image_key TEXT,                   -- R2 key for cleanup

  -- Metadata
  batch_label TEXT,                 -- e.g., "experiment-v1-lighting-tweak"
  duration_ms INTEGER,
  cost_usd DECIMAL(10,5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_prompt_tests_batch ON prompt_tests(batch_label);
CREATE INDEX idx_prompt_tests_status ON prompt_tests(status);
CREATE INDEX idx_prompt_tests_idempotency ON prompt_tests(idempotency_key);
CREATE INDEX idx_prompt_tests_template ON prompt_tests(template_id);
CREATE INDEX idx_prompt_tests_created ON prompt_tests(created_at DESC);

-- Enable RLS
ALTER TABLE public.prompt_tests ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all tests (for CLI scripts)
CREATE POLICY "Service role can manage all tests"
  ON public.prompt_tests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read tests
CREATE POLICY "Users can read prompt tests"
  ON public.prompt_tests
  FOR SELECT
  TO authenticated
  USING (true);
```

## Implementation Steps

1. Create the migration file at the path specified above
2. Copy the SQL content exactly as shown
3. Run `npx supabase db push` to apply the migration

## Acceptance Criteria

- [ ] Migration file exists at `supabase/migrations/00010_create_prompt_tests.sql`
- [ ] Enum type `prompt_test_status` is created with values: pending, generating, evaluating, completed, failed
- [ ] Table has all required columns including `idempotency_key`, `status`, `inputs`, `final_prompt`, `batch_label`
- [ ] Unique constraint exists on `idempotency_key`
- [ ] Foreign key exists to `prompt_templates`
- [ ] Indexes exist on `batch_label`, `status`, `idempotency_key`, `template_id`, `created_at`
- [ ] RLS is enabled with appropriate policies
- [ ] Migration applies successfully with `npx supabase db push`

## Notes

- The `idempotency_key` prevents duplicate tests when scripts are re-run
- The `batch_label` groups tests for A/B comparisons
- Status transitions: pending -> generating -> evaluating -> completed/failed
- `error_code` uses structured codes: 'VALIDATION_ERROR', 'GENERATION_ERROR', 'EVALUATION_ERROR', 'DATABASE_ERROR'
