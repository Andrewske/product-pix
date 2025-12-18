# Database Migration for Notebook Support

## Files to Create
- `supabase/migrations/YYYYMMDDHHMMSS_add_notebook_support.sql` (new)

## Implementation Details

Create a Supabase migration that adds:
1. Notebook phase tracking columns to `prompt_tests`
2. Fixture images table for pre-uploaded test images

### Migration SQL

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
COMMENT ON COLUMN prompt_tests.session_id IS 'Notebook session identifier (e.g., coffee-maker-notebook-20251217-abc123)';
COMMENT ON COLUMN prompt_tests.phase IS 'Notebook phase: analysis, generation, or evaluation';
COMMENT ON COLUMN prompt_tests.phase_run_number IS 'Sequential run number within phase (1, 2, 3, ...)';
COMMENT ON COLUMN prompt_tests.parent_run_id IS 'Links generation to analysis, evaluation to generation';
COMMENT ON COLUMN prompt_tests.debug_metadata IS 'Thinking output, tokens, raw prompts for debugging (JSONB: {thinking, tokens: {input, output}, raw_prompt, raw_response})';

-- Create fixture_images table for pre-uploaded test images
CREATE TABLE public.fixture_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product VARCHAR NOT NULL,           -- Extracted from folder name (e.g., "bag", "coffee-grinder")
  filename VARCHAR NOT NULL,           -- Original filename (e.g., "front.jpg")
  filepath VARCHAR NOT NULL UNIQUE,    -- Relative path from fixtures/images (e.g., "bag/front.jpg")
  r2_url TEXT NOT NULL,                -- Public R2 URL
  r2_key TEXT NOT NULL,                -- R2 storage key
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

### Migration Filename Convention

Use Supabase timestamp format: `YYYYMMDDHHMMSS_add_notebook_support.sql`

Example: `20251217210000_add_notebook_support.sql`

## Acceptance Criteria

### prompt_tests Columns
- [ ] `session_id VARCHAR` added (nullable for batch compatibility)
- [ ] `phase VARCHAR` added with CHECK constraint
- [ ] `phase_run_number INTEGER` added
- [ ] `parent_run_id UUID` added with foreign key to prompt_tests(id)
- [ ] `debug_metadata JSONB` added for flexible debug storage
- [ ] Indexes created on (session_id, phase, phase_run_number) and (parent_run_id)
- [ ] Column comments added for documentation

### fixture_images Table
- [ ] Table created with all columns (id, product, filename, filepath, r2_url, r2_key)
- [ ] Index created on product column
- [ ] RLS policies created (service role manage, users read)
- [ ] filepath has UNIQUE constraint

### Migration Success
- [ ] Migration runs successfully: `npx supabase db push`
- [ ] Existing batch pipeline tests still work (new columns are nullable)
- [ ] Can query notebook sessions efficiently using new indexes

## Dependencies

None - this is the foundation for all other notebook features.

## Rollback Strategy

If issues occur, create a rollback migration:

```sql
-- Drop fixture_images table
DROP TABLE IF EXISTS public.fixture_images;

-- Drop indexes and columns from prompt_tests
DROP INDEX IF EXISTS idx_notebook_parent;
DROP INDEX IF EXISTS idx_notebook_sessions;

ALTER TABLE prompt_tests
  DROP COLUMN IF EXISTS debug_metadata,
  DROP COLUMN IF EXISTS parent_run_id,
  DROP COLUMN IF EXISTS phase_run_number,
  DROP COLUMN IF EXISTS phase,
  DROP COLUMN IF EXISTS session_id;
```

## Example Data Structure

### Analysis Run
```sql
INSERT INTO prompt_tests (
  session_id,
  phase,
  phase_run_number,
  parent_run_id,  -- NULL for analysis (it's the root)
  inputs,         -- Analysis variables
  debug_metadata  -- {thinking: null, tokens: {input: 234, output: 567}, ...}
) VALUES (
  'coffee-maker-notebook-20251217-abc123',
  'analysis',
  1,
  NULL,
  '{"product": "coffee maker", "category": "appliance"}'::jsonb,
  '{"tokens": {"input": 234, "output": 567}}'::jsonb
);
```

### Generation Run (links to analysis)
```sql
INSERT INTO prompt_tests (
  session_id,
  phase,
  phase_run_number,
  parent_run_id,              -- UUID of analysis run
  inputs,                     -- Template variables
  final_prompt,
  image_url,
  debug_metadata              -- {thinking: "...", tokens: {...}, raw_prompt: "..."}
) VALUES (
  'coffee-maker-notebook-20251217-abc123',
  'generation',
  1,
  '550e8400-e29b-41d4-a716-446655440000',  -- analysis run ID
  '{"product": "coffee maker", "style": "modern"}'::jsonb,
  'Photo of modern coffee maker...',
  'https://r2.example.com/generated-123.jpg',
  '{"thinking": "First I will...", "tokens": {"input": 1234, "output": 890}}'::jsonb
);
```

### Fixture Image Entry
```sql
INSERT INTO fixture_images (
  product,
  filename,
  filepath,
  r2_url,
  r2_key
) VALUES (
  'bag',
  'front.jpg',
  'bag/front.jpg',
  'https://r2.example.com/fixtures/bag-front-abc123.jpg',
  'fixtures/bag-front-abc123.jpg'
);
```
