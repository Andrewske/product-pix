ALTER TABLE public.prompt_evaluations
ADD COLUMN input_tokens INTEGER,
ADD COLUMN output_tokens INTEGER;

-- No backfill for historical records
-- Historical evaluations will have NULL input/output tokens (only tokens_used)
-- New evaluations from this point forward will have accurate breakdown