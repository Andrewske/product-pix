-- Migration: Create batch job status enum and tables
-- Supports batch image generation via Gemini Batch API

-- batch_job_status enum
CREATE TYPE batch_job_status AS ENUM (
  'pending', 'processing', 'completed', 'cancelled', 'failed'
);

-- batch_item_status enum
CREATE TYPE batch_item_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

-- batch_jobs table
CREATE TABLE public.batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status batch_job_status NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL,
  completed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  credits_charged INTEGER NOT NULL,
  credits_refunded INTEGER NOT NULL DEFAULT 0,
  default_prompt TEXT,
  parameters JSONB DEFAULT '{}',
  gemini_batch_id TEXT UNIQUE,
  gemini_file_id TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- batch_items table
CREATE TABLE public.batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batch_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  status batch_item_status NOT NULL DEFAULT 'pending',
  product_name TEXT,
  prompt TEXT NOT NULL,
  source_image_url TEXT,
  parameters JSONB DEFAULT '{}',
  generated_image_id UUID REFERENCES public.generated_images(id),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_batch_jobs_user_id ON public.batch_jobs(user_id);
CREATE INDEX idx_batch_jobs_status ON public.batch_jobs(status);
CREATE INDEX idx_batch_jobs_created_at ON public.batch_jobs(created_at DESC);
CREATE INDEX idx_batch_jobs_gemini_batch_id ON public.batch_jobs(gemini_batch_id);
CREATE INDEX idx_batch_items_batch_id ON public.batch_items(batch_id);
CREATE INDEX idx_batch_items_status ON public.batch_items(status);

-- RLS
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own batches" ON public.batch_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own batches" ON public.batch_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own batches" ON public.batch_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own batch items" ON public.batch_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own batch items" ON public.batch_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

