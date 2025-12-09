-- Migration: Create template improvement sessions and iterations tables
-- Stores improvement sessions and iteration history for the improve command

CREATE TABLE template_improvement_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',

  current_iteration INT NOT NULL DEFAULT 0,
  max_iterations INT NOT NULL,
  target_score DECIMAL(4, 2),

  initial_mean_score DECIMAL(4, 2),
  current_mean_score DECIMAL(4, 2),
  total_improvement DECIMAL(5, 2),
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,

  config JSONB NOT NULL,

  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'abandoned'))
);

CREATE TABLE template_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES template_improvement_sessions(session_id) ON DELETE CASCADE,
  iteration_number INT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Template versions
  baseline_template JSONB NOT NULL,
  improved_template JSONB NOT NULL,
  changes JSONB NOT NULL,
  user_modifications TEXT,

  -- Test references
  baseline_batch_label TEXT NOT NULL,
  improved_batch_label TEXT NOT NULL,

  -- Results
  baseline_results JSONB NOT NULL,
  improved_results JSONB NOT NULL,
  delta JSONB NOT NULL,

  -- AI outputs
  analysis JSONB NOT NULL,
  suggestions JSONB NOT NULL,

  -- Costs
  costs JSONB NOT NULL,

  UNIQUE(session_id, iteration_number)
);

-- Indexes for common queries
CREATE INDEX idx_sessions_template ON template_improvement_sessions(template_slug);
CREATE INDEX idx_sessions_status ON template_improvement_sessions(status);
CREATE INDEX idx_iterations_session ON template_iterations(session_id);

-- Enable RLS
ALTER TABLE template_improvement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_iterations ENABLE ROW LEVEL SECURITY;

-- Policies: Allow read access for authenticated users
CREATE POLICY "Users can read improvement sessions"
  ON template_improvement_sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read iterations"
  ON template_iterations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies: Only service role can insert/update (admin operations)
-- These tables are managed by CLI commands using service role

