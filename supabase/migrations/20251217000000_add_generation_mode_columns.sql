-- Add generation_mode column to jobs table (credits_charged already exists)
ALTER TABLE jobs
ADD COLUMN generation_mode TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN jobs.generation_mode IS 'Processing mode: lightning (fast) or snail (economy)';

-- Add check constraint for valid modes
ALTER TABLE jobs
ADD CONSTRAINT jobs_generation_mode_check
CHECK (generation_mode IN ('lightning', 'snail') OR generation_mode IS NULL);