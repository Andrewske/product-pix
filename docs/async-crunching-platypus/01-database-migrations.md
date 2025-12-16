# Database Migrations for Analysis Infrastructure

## Files to Create
- `supabase/migrations/00044_create_analysis_prompts.sql` (new)
- `supabase/migrations/00045_create_analysis_cache.sql` (new)

## Implementation Details

Create two new database tables to support AI product analysis:

### 1. Analysis Prompts Table (00044)
Stores versioned analysis prompt definitions (mirrors prompt_templates pattern):

```sql
-- Migration: 00044_create_analysis_prompts.sql
CREATE TABLE public.analysis_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- The analysis prompt and schema
  prompt_text TEXT NOT NULL,
  response_schema JSONB NOT NULL,  -- Zod schema for validation

  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slug, version)
);

CREATE INDEX idx_analysis_prompts_slug ON analysis_prompts(slug);
CREATE INDEX idx_analysis_prompts_status ON analysis_prompts(status);

-- RLS Policies
ALTER TABLE public.analysis_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analysis prompts"
  ON public.analysis_prompts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Creators can manage their prompts"
  ON public.analysis_prompts FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

### 2. Analysis Cache Table (00045)
Stores cached analysis results with batch-level hashing:

```sql
-- Migration: 00045_create_analysis_cache.sql
CREATE TABLE public.analysis_cache (
  images_hash TEXT PRIMARY KEY,           -- Combined hash of all analyzed images
  prompt_slug TEXT NOT NULL,              -- Which analysis prompt was used
  prompt_version INTEGER NOT NULL,        -- Version of prompt used
  merged_result JSONB NOT NULL,           -- Consensus-merged analysis
  individual_results JSONB NOT NULL,      -- Array of per-image analyses
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_cache_created_at ON analysis_cache(created_at);
CREATE INDEX idx_analysis_cache_prompt ON analysis_cache(prompt_slug, prompt_version);

-- RLS: Public read for authenticated users
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analysis cache"
  ON public.analysis_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage cache"
  ON public.analysis_cache FOR ALL TO service_role USING (true);
```

## Acceptance Criteria
- [ ] Both migration files created in correct sequence (00044, 00045)
- [ ] Tables have proper constraints and indexes
- [ ] RLS policies allow authenticated read, service_role write for cache
- [ ] Migrations apply cleanly: `npx supabase db push`
- [ ] Type generation succeeds: `npx supabase gen types typescript`

## Dependencies
None - foundational task
