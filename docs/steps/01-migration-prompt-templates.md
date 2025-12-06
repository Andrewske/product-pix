# Step 01: Create prompt_templates Migration

## Objective

Create the database migration for the `prompt_templates` table, which stores versioned prompt definitions with Zod-validated variable schemas.

## Prerequisites

- None (this is the first step)

## Files to Create

### `supabase/migrations/00009_create_prompt_templates.sql`

```sql
-- Migration: Create prompt_templates table
-- Stores versioned prompt definitions for the testing framework

CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,               -- e.g., 'ecommerce-base'
  version INTEGER NOT NULL,         -- 1, 2, 3...
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- The core template logic
  template_data JSONB NOT NULL,     -- { subject: "...", lighting: "...", negative: "..." }

  -- Zod schema definition for variables
  variables_schema JSONB NOT NULL,  -- { product: { type: 'string', required: true }, ... }

  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slug, version)
);

-- Indexes for common queries
CREATE INDEX idx_prompt_templates_slug ON prompt_templates(slug);
CREATE INDEX idx_prompt_templates_status ON prompt_templates(status);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for authenticated users
CREATE POLICY "Users can read prompt templates"
  ON public.prompt_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins/creators can insert/update
CREATE POLICY "Creators can manage their templates"
  ON public.prompt_templates
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

## Implementation Steps

1. Create the migration file at the path specified above
2. Copy the SQL content exactly as shown
3. Run `npx supabase db push` to apply the migration

## Acceptance Criteria

- [ ] Migration file exists at `supabase/migrations/00009_create_prompt_templates.sql`
- [ ] Table has all required columns: `id`, `slug`, `version`, `status`, `template_data`, `variables_schema`, `created_by`, `created_at`
- [ ] Unique constraint exists on `(slug, version)` combination
- [ ] Indexes exist on `slug` and `status` columns
- [ ] RLS is enabled with appropriate policies
- [ ] Migration applies successfully with `npx supabase db push`

## Notes

- The `template_data` JSONB stores the actual prompt components (subject, lighting, style, etc.)
- The `variables_schema` JSONB stores Zod-compatible type definitions for template variables
- Status values are: 'draft' (testing), 'active' (in use), 'archived' (deprecated)
