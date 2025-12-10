-- Add template_slug to jobs table for slug-based template resolution
-- This enables automatic template upgrades and fixes version conflicts

-- Add template_slug column (nullable initially for backfill)
ALTER TABLE public.jobs ADD COLUMN template_slug TEXT;

-- Backfill existing jobs by joining with prompt_templates
UPDATE public.jobs
SET template_slug = COALESCE(pt.slug, 'ecommerce-base')
FROM public.prompt_templates pt
WHERE jobs.template_id = pt.id;

-- Set default for any remaining jobs without template reference
UPDATE public.jobs
SET template_slug = 'ecommerce-base'
WHERE template_slug IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE public.jobs ALTER COLUMN template_slug SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_jobs_template_slug ON public.jobs(template_slug);

-- Add column comment
COMMENT ON COLUMN public.jobs.template_slug IS 'Template slug for version-agnostic resolution (e.g., ecommerce-base)';

-- Update the create_generation_job function to use template_slug instead of template_id
CREATE OR REPLACE FUNCTION create_generation_job(
  p_user_id UUID,
  p_upload_id UUID,
  p_prompt TEXT,
  p_parameters JSONB DEFAULT '{}',
  p_credits INTEGER DEFAULT 1,
  p_template_slug TEXT DEFAULT 'ecommerce-base'
)
RETURNS TABLE(success BOOLEAN, job_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_job_id UUID;
  v_credit_result RECORD;
BEGIN
  -- Generate job ID first
  v_new_job_id := gen_random_uuid();

  -- Try to consume credits
  SELECT * INTO v_credit_result FROM consume_credits(
    p_user_id,
    p_credits,
    v_new_job_id,
    'Generation: ' || LEFT(p_prompt, 50)
  );

  IF NOT v_credit_result.success THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient credits';
    RETURN;
  END IF;

  -- Create the job with template_slug (template_id deprecated)
  INSERT INTO public.jobs (
    id, user_id, upload_id, prompt, parameters, credits_charged, template_slug
  )
  VALUES (
    v_new_job_id, p_user_id, p_upload_id, p_prompt, p_parameters, p_credits, p_template_slug
  );

  RETURN QUERY SELECT TRUE, v_new_job_id, 'Job created successfully';
END;
$$;