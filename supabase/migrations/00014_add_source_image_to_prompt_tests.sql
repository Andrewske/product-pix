-- Migration: Add source image support to prompt_tests
-- Enables image-to-image testing in the prompt bench framework

ALTER TABLE public.prompt_tests
ADD COLUMN source_image_url TEXT,
ADD COLUMN source_image_key TEXT;

-- Index for queries filtering by source image presence
CREATE INDEX idx_prompt_tests_has_source
  ON prompt_tests((source_image_url IS NOT NULL));

COMMENT ON COLUMN prompt_tests.source_image_url IS 'R2 URL of source image for image-to-image tests';
COMMENT ON COLUMN prompt_tests.source_image_key IS 'R2 key for source image cleanup';
