-- Add collection-specific fields to prompt_templates
ALTER TABLE public.prompt_templates
  ADD COLUMN type TEXT DEFAULT 'single' CHECK (type IN ('single', 'collection')),
  ADD COLUMN output_count INTEGER DEFAULT 1 CHECK (output_count > 0),
  ADD COLUMN variety_strategy TEXT CHECK (variety_strategy IN ('category-based', 'ai-decided', 'hybrid'));

-- Create index for filtering by type
CREATE INDEX idx_prompt_templates_type ON prompt_templates(type);

-- Backfill existing templates as 'single' type
UPDATE public.prompt_templates SET type = 'single' WHERE type IS NULL;

-- Make type NOT NULL after backfill
ALTER TABLE public.prompt_templates ALTER COLUMN type SET NOT NULL;
