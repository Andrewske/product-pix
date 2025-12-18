-- Update create_generation_job function to accept generation_mode parameter
CREATE OR REPLACE FUNCTION create_generation_job(
  p_user_id UUID,
  p_upload_id UUID,
  p_prompt TEXT,
  p_parameters JSONB DEFAULT '{}',
  p_credits INTEGER DEFAULT 1,
  p_template_slug TEXT DEFAULT 'ecommerce-base',
  p_generation_mode TEXT DEFAULT 'lightning'
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

  -- Create the job with generation_mode
  INSERT INTO public.jobs (
    id, user_id, upload_id, prompt, parameters, credits_charged, template_slug, generation_mode
  )
  VALUES (
    v_new_job_id, p_user_id, p_upload_id, p_prompt, p_parameters, p_credits, p_template_slug, p_generation_mode
  );

  RETURN QUERY SELECT TRUE, v_new_job_id, 'Job created successfully';
END;
$$;