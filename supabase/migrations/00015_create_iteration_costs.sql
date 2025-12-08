-- Migration: Create iteration_costs table
-- Tracks costs for evolutionary iteration sessions

CREATE TABLE public.iteration_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  template_slug TEXT NOT NULL,
  generation_count INTEGER NOT NULL DEFAULT 0,
  generation_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  evaluation_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  insights_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  cost_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iteration_costs_session ON iteration_costs(session_id);
CREATE INDEX idx_iteration_costs_template ON iteration_costs(template_slug);
CREATE INDEX idx_iteration_costs_created ON iteration_costs(created_at DESC);

ALTER TABLE public.iteration_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all iteration costs"
  ON public.iteration_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read iteration costs"
  ON public.iteration_costs
  FOR SELECT
  TO authenticated
  USING (true);