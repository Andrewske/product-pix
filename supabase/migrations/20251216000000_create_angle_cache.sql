-- Migration: create_angle_cache.sql
CREATE TABLE public.angle_cache (
  images_hash TEXT PRIMARY KEY,           -- Combined hash of all analyzed images
  detected_angles JSONB NOT NULL,         -- DetectedAngles result
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_angle_cache_created_at ON angle_cache(created_at);

-- RLS: Public read for authenticated users
ALTER TABLE public.angle_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read angle cache"
  ON public.angle_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage angle cache"
  ON public.angle_cache FOR ALL TO service_role USING (true);
