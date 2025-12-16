-- Migration: 00044_create_analysis_prompts.sql
CREATE TABLE public.analysis_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- The analysis prompt and schema
  prompt_text TEXT NOT NULL,
  response_schema JSONB NOT NULL,  -- Zod schema for validation

  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slug, version)
);

CREATE INDEX idx_analysis_prompts_slug ON analysis_prompts(slug);
CREATE INDEX idx_analysis_prompts_status ON analysis_prompts(status);

-- RLS Policies
ALTER TABLE public.analysis_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analysis prompts"
  ON public.analysis_prompts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Creators can manage their prompts"
  ON public.analysis_prompts FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
