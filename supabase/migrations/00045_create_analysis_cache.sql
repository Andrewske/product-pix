-- Migration: 00045_create_analysis_cache.sql
CREATE TABLE public.analysis_cache (
  images_hash TEXT PRIMARY KEY,           -- Combined hash of all analyzed images
  prompt_slug TEXT NOT NULL,              -- Which analysis prompt was used
  prompt_version INTEGER NOT NULL,        -- Version of prompt used
  merged_result JSONB NOT NULL,           -- Consensus-merged analysis
  individual_results JSONB NOT NULL,      -- Array of per-image analyses
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_cache_created_at ON analysis_cache(created_at);
CREATE INDEX idx_analysis_cache_prompt ON analysis_cache(prompt_slug, prompt_version);

-- RLS: Public read for authenticated users
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analysis cache"
  ON public.analysis_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage cache"
  ON public.analysis_cache FOR ALL TO service_role USING (true);
