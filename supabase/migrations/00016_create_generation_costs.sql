CREATE TABLE generation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  generated_image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  input_cost_usd DECIMAL(10, 6) NOT NULL,
  output_cost_usd DECIMAL(10, 6) NOT NULL,
  total_cost_usd DECIMAL(10, 6) NOT NULL,
  fallback_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generation_costs_job ON generation_costs(job_id);
CREATE INDEX idx_generation_costs_image ON generation_costs(generated_image_id);
CREATE INDEX idx_generation_costs_created ON generation_costs(created_at);