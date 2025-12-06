# Step 03: Create prompt_evaluations Migration and Functions

## Objective

Create the database migration for the `prompt_evaluations` table and the `update_prompt_test_status` function for atomic status updates.

## Prerequisites

- Step 01 completed (prompt_templates table must exist)
- Step 02 completed (prompt_tests table must exist)

## Files to Create

### `supabase/migrations/00011_create_prompt_evaluations.sql`

```sql
-- Migration: Create prompt_evaluations table
-- Stores LLM or human evaluations of generated images

CREATE TABLE public.prompt_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.prompt_tests(id) ON DELETE CASCADE,

  -- High-level Score
  score_overall DECIMAL(3,1),       -- 1.0 to 10.0

  -- Detailed Breakdown (flexible schema)
  details JSONB,                    -- { composition: 8, lighting: 9, reasoning: "...", suggestions: [...] }

  -- Metadata
  evaluator_model TEXT,             -- e.g., 'claude-sonnet-4-20250514'
  evaluator_type TEXT NOT NULL CHECK (evaluator_type IN ('llm', 'human')),
  cost_usd DECIMAL(10,5),
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_prompt_evaluations_test ON prompt_evaluations(test_id);
CREATE INDEX idx_prompt_evaluations_score ON prompt_evaluations(score_overall DESC);

-- Enable RLS
ALTER TABLE public.prompt_evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all evaluations (for CLI scripts)
CREATE POLICY "Service role can manage all evaluations"
  ON public.prompt_evaluations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read evaluations
CREATE POLICY "Users can read evaluations"
  ON public.prompt_evaluations
  FOR SELECT
  TO authenticated
  USING (true);
```

### `supabase/migrations/00012_create_prompt_testing_functions.sql`

```sql
-- Migration: Create helper functions for prompt testing
-- Provides atomic operations for status updates

-- Atomic status update to prevent race conditions
CREATE OR REPLACE FUNCTION update_prompt_test_status(
  p_test_id UUID,
  p_new_status prompt_test_status,
  p_error_message TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE prompt_tests
  SET
    status = p_new_status,
    error_message = COALESCE(p_error_message, error_message),
    error_code = COALESCE(p_error_code, error_code),
    completed_at = CASE
      WHEN p_new_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION update_prompt_test_status(UUID, prompt_test_status, TEXT, TEXT) TO service_role;

-- Function to get batch statistics
CREATE OR REPLACE FUNCTION get_batch_stats(p_batch_label TEXT)
RETURNS TABLE (
  total_tests INTEGER,
  completed_tests INTEGER,
  failed_tests INTEGER,
  avg_score DECIMAL(3,1),
  min_score DECIMAL(3,1),
  max_score DECIMAL(3,1),
  total_cost DECIMAL(10,5)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_tests,
    COUNT(*) FILTER (WHERE pt.status = 'completed')::INTEGER as completed_tests,
    COUNT(*) FILTER (WHERE pt.status = 'failed')::INTEGER as failed_tests,
    ROUND(AVG(pe.score_overall), 1) as avg_score,
    MIN(pe.score_overall) as min_score,
    MAX(pe.score_overall) as max_score,
    SUM(COALESCE(pt.cost_usd, 0) + COALESCE(pe.cost_usd, 0)) as total_cost
  FROM prompt_tests pt
  LEFT JOIN prompt_evaluations pe ON pe.test_id = pt.id
  WHERE pt.batch_label = p_batch_label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_batch_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_stats(TEXT) TO service_role;
```

## Implementation Steps

1. Create the first migration file at `supabase/migrations/00011_create_prompt_evaluations.sql`
2. Create the second migration file at `supabase/migrations/00012_create_prompt_testing_functions.sql`
3. Copy the SQL content exactly as shown
4. Run `npx supabase db push` to apply both migrations

## Acceptance Criteria

- [ ] Migration file exists at `supabase/migrations/00011_create_prompt_evaluations.sql`
- [ ] Migration file exists at `supabase/migrations/00012_create_prompt_testing_functions.sql`
- [ ] `prompt_evaluations` table has all required columns
- [ ] Score constraint allows values from 1.0 to 10.0
- [ ] Evaluator type is constrained to 'llm' or 'human'
- [ ] `update_prompt_test_status` function exists and works correctly
- [ ] `get_batch_stats` function exists and returns correct statistics
- [ ] RLS is enabled with appropriate policies
- [ ] Migrations apply successfully with `npx supabase db push`

## Notes

- The `details` JSONB is intentionally flexible to allow evaluation criteria to evolve without migrations
- `score_overall` is DECIMAL(3,1) to allow scores like 8.5
- The `update_prompt_test_status` function uses SECURITY DEFINER to bypass RLS
- The `get_batch_stats` function provides a quick summary for the CLI report command
