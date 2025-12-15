-- Add refunded_at timestamp to generated_images table
ALTER TABLE generated_images ADD COLUMN refunded_at TIMESTAMPTZ;