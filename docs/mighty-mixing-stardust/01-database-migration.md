# Database Migration

## Files to Create
- `supabase/migrations/20251217210000_add_notebook_support.sql` (new)

## Implementation Details

Create a Supabase migration that adds:
1. Notebook phase tracking columns to `prompt_tests`
2. Fixture images table for pre-uploaded test images

### Steps

**1. Create migration file**

Run:
```bash
cd /home/kevin/coding/product-pix/.worktrees/prompt-bench
npx supabase migration new add_notebook_support
```

Expected: Creates file `supabase/migrations/<timestamp>_add_notebook_support.sql`

**2. Write migration SQL**

Copy this exact SQL into the new migration file:

```sql
-- Add notebook support columns to prompt_tests
ALTER TABLE prompt_tests
  ADD COLUMN session_id VARCHAR,
  ADD COLUMN phase VARCHAR CHECK (phase IN ('analysis', 'generation', 'evaluation')),
  ADD COLUMN phase_run_number INTEGER,
  ADD COLUMN parent_run_id UUID REFERENCES prompt_tests(id) ON DELETE CASCADE,
  ADD COLUMN debug_metadata JSONB;

-- Create indexes for notebook queries
CREATE INDEX idx_notebook_sessions
  ON prompt_tests(session_id, phase, phase_run_number)
  WHERE session_id IS NOT NULL;

CREATE INDEX idx_notebook_parent
  ON prompt_tests(parent_run_id)
  WHERE parent_run_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN prompt_tests.session_id IS 'Notebook session identifier (e.g., notebook-20251217-abc123)';
COMMENT ON COLUMN prompt_tests.phase IS 'Notebook phase: analysis, generation, or evaluation';
COMMENT ON COLUMN prompt_tests.phase_run_number IS 'Sequential run number within phase (1, 2, 3, ...)';
COMMENT ON COLUMN prompt_tests.parent_run_id IS 'Links generation to analysis, evaluation to generation';
COMMENT ON COLUMN prompt_tests.debug_metadata IS 'Thinking output, tokens, raw prompts for debugging (JSONB)';

-- Create fixture_images table for pre-uploaded test images
CREATE TABLE public.fixture_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product VARCHAR NOT NULL,
  filename VARCHAR NOT NULL,
  filepath VARCHAR NOT NULL UNIQUE,
  r2_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for product grouping
CREATE INDEX idx_fixture_images_product ON fixture_images(product);

-- Enable RLS
ALTER TABLE public.fixture_images ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage fixture images
CREATE POLICY "Service role can manage fixture images"
  ON public.fixture_images
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read fixture images
CREATE POLICY "Users can read fixture images"
  ON public.fixture_images
  FOR SELECT
  TO authenticated
  USING (true);
```

**3. Apply migration**

Run:
```bash
npx supabase db push
```

Expected: Success message showing migration applied

**4. Verify schema**

Run:
```bash
npx supabase db remote status
```

Expected: Shows new migration in applied list

**5. Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add database schema for notebook UI

- Add session_id, phase, phase_run_number, parent_run_id to prompt_tests
- Create fixture_images table for pre-uploaded test images
- Add indexes for efficient notebook queries
- Configure RLS policies for fixture access"
```

## Acceptance Criteria

- [ ] Migration file created successfully
- [ ] SQL contains all required columns and tables
- [ ] Migration applies without errors (`npx supabase db push`)
- [ ] `fixture_images` table exists with RLS enabled
- [ ] `prompt_tests` has new notebook columns (nullable for backward compatibility)
- [ ] Indexes created for efficient queries
- [ ] Changes committed to git

## Dependencies

None - this is the foundation for all other notebook features.
