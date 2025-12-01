-- supabase/migrations/00005_create_uploads.sql
-- Source images uploaded by users

CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_key TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_uploads_user_id ON public.uploads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_uploads_created_at ON public.uploads(created_at DESC);

-- Enable RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;