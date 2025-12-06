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