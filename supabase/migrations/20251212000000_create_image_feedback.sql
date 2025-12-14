CREATE TYPE public.feedback_type AS ENUM ('positive', 'negative');

CREATE TABLE public.image_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.generated_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feedback_type public.feedback_type NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_image_feedback UNIQUE (user_id, image_id),
  CONSTRAINT comment_length_check CHECK (LENGTH(comment) <= 1000)
);

-- Indexes
CREATE INDEX idx_image_feedback_image_id ON public.image_feedback(image_id);
CREATE INDEX idx_image_feedback_user_id ON public.image_feedback(user_id);
CREATE INDEX idx_image_feedback_type ON public.image_feedback(feedback_type);
CREATE INDEX idx_image_feedback_created_at ON public.image_feedback(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_feedback_updated_at
  BEFORE UPDATE ON public.image_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.image_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.image_feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feedback" ON public.image_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON public.image_feedback
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON public.image_feedback
  FOR DELETE USING (auth.uid() = user_id);