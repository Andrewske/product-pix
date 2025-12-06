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