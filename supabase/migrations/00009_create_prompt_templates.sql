-- Migration: Create prompt_templates table
-- Stores versioned prompt definitions for the testing framework

CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,               -- e.g., 'ecommerce-base'
  version INTEGER NOT NULL,         -- 1, 2, 3...
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- The core template logic
  template_data JSONB NOT NULL,     -- { subject: "...", lighting: "...", negative: "..." }

  -- Zod schema definition for variables
  variables_schema JSONB NOT NULL,  -- { product: { type: 'string', required: true }, ... }

  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slug, version)
);

-- Indexes for common queries
CREATE INDEX idx_prompt_templates_slug ON prompt_templates(slug);
CREATE INDEX idx_prompt_templates_status ON prompt_templates(status);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for authenticated users
CREATE POLICY "Users can read prompt templates"
  ON public.prompt_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins/creators can insert/update
CREATE POLICY "Creators can manage their templates"
  ON public.prompt_templates
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());