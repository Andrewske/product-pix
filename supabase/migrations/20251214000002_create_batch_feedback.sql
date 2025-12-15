-- supabase/migrations/20251214000002_create_batch_feedback.sql

-- Main batch feedback table
CREATE TABLE batch_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT CHECK (LENGTH(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_batch_feedback UNIQUE (user_id, batch_id)
);

-- Junction table for problem images (normalized, not array)
CREATE TABLE batch_feedback_images (
  batch_feedback_id UUID NOT NULL REFERENCES batch_feedback(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
  PRIMARY KEY (batch_feedback_id, image_id)
);

-- Indexes
CREATE INDEX idx_batch_feedback_batch_id ON batch_feedback(batch_id);
CREATE INDEX idx_batch_feedback_user_id ON batch_feedback(user_id);
CREATE INDEX idx_batch_feedback_rating ON batch_feedback(rating);
CREATE INDEX idx_batch_feedback_images_image_id ON batch_feedback_images(image_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_batch_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batch_feedback_updated_at
  BEFORE UPDATE ON batch_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_feedback_updated_at();

-- RLS Policies
ALTER TABLE batch_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batch feedback" ON batch_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batch feedback" ON batch_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch feedback" ON batch_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batch feedback" ON batch_feedback
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE batch_feedback_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batch feedback images" ON batch_feedback_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM batch_feedback
      WHERE id = batch_feedback_id
      AND user_id = auth.uid()
    )
  );