-- supabase/migrations/00007_create_generated_images.sql
-- AI-generated image results

CREATE TABLE public.generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_images_job_id ON public.generated_images(job_id);
CREATE INDEX idx_generated_images_favorites ON public.generated_images(user_id, is_favorite) WHERE deleted_at IS NULL AND is_favorite = TRUE;
CREATE INDEX idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- Enable RLS
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;