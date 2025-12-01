-- supabase/migrations/00006_create_jobs.sql
-- Generation job tracking

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'pending',
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  credits_charged INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_pending ON public.jobs(created_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Function to create job with credit consumption
CREATE OR REPLACE FUNCTION create_generation_job(
  p_user_id UUID,
  p_upload_id UUID,
  p_prompt TEXT,
  p_parameters JSONB DEFAULT '{}',
  p_credits INTEGER DEFAULT 1
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
    id, user_id, upload_id, prompt, parameters, credits_charged
  )
  VALUES (
    v_new_job_id, p_user_id, p_upload_id, p_prompt, p_parameters, p_credits
  );

  RETURN QUERY SELECT TRUE, v_new_job_id, 'Job created successfully';
END;
$$;