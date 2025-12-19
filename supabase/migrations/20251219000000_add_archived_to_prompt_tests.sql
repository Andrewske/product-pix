-- Add archived column to prompt_tests for notebook run dismissal
ALTER TABLE public.prompt_tests
  ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient filtering of non-archived runs
CREATE INDEX idx_prompt_tests_archived ON prompt_tests(archived) WHERE archived = FALSE;

-- Add comment
COMMENT ON COLUMN prompt_tests.archived IS 'Whether this run has been archived/dismissed in the notebook UI';