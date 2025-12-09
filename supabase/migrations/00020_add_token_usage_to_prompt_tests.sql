-- Migration: Add token usage fields to prompt_tests
-- Store input_tokens and output_tokens for cost recalculation

ALTER TABLE public.prompt_tests
ADD COLUMN input_tokens INTEGER,
ADD COLUMN output_tokens INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.prompt_tests.input_tokens IS 'Number of input/prompt tokens used for generation';
COMMENT ON COLUMN public.prompt_tests.output_tokens IS 'Number of output/completion tokens used for generation';

