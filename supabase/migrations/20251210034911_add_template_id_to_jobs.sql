-- Add template_id to jobs table for future user template selection
ALTER TABLE public.jobs ADD COLUMN template_id UUID REFERENCES public.prompt_templates(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_jobs_template_id ON public.jobs(template_id);

-- Update the create_generation_job function to accept template_id parameter
CREATE OR REPLACE FUNCTION create_generation_job(
  p_user_id UUID,
  p_upload_id UUID,
  p_prompt TEXT,
  p_parameters JSONB DEFAULT '{}',
  p_credits INTEGER DEFAULT 1,
  p_template_id UUID DEFAULT NULL
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

  -- Create the job
  INSERT INTO public.jobs (
    id, user_id, upload_id, prompt, parameters, credits_charged, template_id
  )
  VALUES (
    v_new_job_id, p_user_id, p_upload_id, p_prompt, p_parameters, p_credits, p_template_id
  );

  RETURN QUERY SELECT TRUE, v_new_job_id, 'Job created successfully';
END;
$$;