-- Add template_id to batch_items table for template-based batch processing
ALTER TABLE public.batch_items
  ADD COLUMN template_id UUID REFERENCES public.prompt_templates(id) ON DELETE SET NULL;

-- Make prompt nullable since we'll use templates instead
-- Keep prompt column for backward compatibility and as fallback
ALTER TABLE public.batch_items
  ALTER COLUMN prompt DROP NOT NULL;

-- Add index for performance
CREATE INDEX idx_batch_items_template_id ON public.batch_items(template_id);

-- Add comment
COMMENT ON COLUMN public.batch_items.template_id IS 'Template used for generating the image prompt';
COMMENT ON COLUMN public.batch_items.prompt IS 'Deprecated: Custom prompt (kept for backward compatibility). Use template_id instead.';
