# Slug-Based Template Resolution Implementation Plan

## Overview

Migrate template system from UUID-based to slug-based resolution to ensure frontend always uses latest active template version. This fixes the error "Missing required variables: style, lighting_style, background_type" caused by users accidentally selecting old template versions.

**Problem**: Database contains both v3 and v4 of `ecommerce-base` template marked as active. Frontend displays both as separate options (by UUID). When v3 is selected, it requires variables that v4 has hardcoded.

**Solution**: Store template slug in jobs table, resolve to latest active version at runtime. Update compiler to validate only variables actually used in template.

## Architecture Decisions

### Decision 1: Store Slug (not UUID) in Jobs Table
**Choice**: Jobs store `template_slug` TEXT, resolve to latest active version at runtime
**Rationale**:
- Automatic template upgrades without user action
- Simpler data model (no version locking)
- Matches existing batch API pattern
- MVP stage allows breaking changes
- Trade-off: Historical jobs may produce different results with template changes (acceptable)

### Decision 2: Smart Variable Validation
**Choice**: Compiler validates only variables actually used in template (with `{placeholder}` syntax)
**Rationale**:
- Supports templates with hardcoded values
- Variables in schema but not in template don't require validation
- Enables minimal-variable templates (v4 pattern)
- Backward compatible with full-variable templates (v3 pattern)

### Decision 3: Backward Compatibility Strategy
**Choice**: Keep `template_id` column nullable/deprecated, add fallback resolver
**Rationale**:
- Existing jobs continue to work
- Graceful migration path
- Can remove after confirming no legacy references

## Implementation Tasks

### Phase 1: Database Migration

- [ ] Create database migration for template_slug column
  - Files: `supabase/migrations/[timestamp]_add_template_slug_to_jobs.sql` (new)
  - Implementation:
    - Add `template_slug TEXT` column to `jobs` table (nullable initially)
    - Backfill existing jobs by joining with `prompt_templates` on `template_id`
    - Set default `'ecommerce-base'` for jobs without template reference
    - Make column NOT NULL after backfill
    - Add index `idx_jobs_template_slug`
    - Add column comment
  - Tests: Manual verification with `SELECT template_slug, template_id FROM jobs LIMIT 10;`
  - Acceptance: All existing jobs have `template_slug` populated

- [ ] Update create_generation_job RPC function
  - Files: `supabase/migrations/[timestamp]_add_template_slug_to_jobs.sql` (modify)
  - Implementation:
    - Change parameter from `p_template_id UUID` to `p_template_slug TEXT`
    - Update INSERT statement to use `template_slug` instead of `template_id`
    - Set `template_id` to NULL (deprecated column)
    - Default parameter: `p_template_slug TEXT DEFAULT 'ecommerce-base'`
  - Tests: Call RPC manually: `SELECT * FROM create_generation_job('user-uuid', NULL, '', '{}', 1, 'ecommerce-base');`
  - Acceptance: RPC creates job with template_slug, returns success

### Phase 2: Backend API Updates

- [ ] Update /api/templates endpoint to deduplicate by slug
  - Files: `src/app/api/templates/route.ts` (modify)
  - Implementation:
    - Query all active templates ordered by `slug, version DESC`
    - Deduplicate using `Map<string, TemplateData>` (keep highest version per slug)
    - Return array with `slug` field instead of `id`
    - Include `version` field for debugging
    - Transform `template_data` to extract name and description
  - Tests: `src/app/api/templates/__tests__/route.test.ts` (new)
    - Test: Returns only one template per slug when multiple versions exist
    - Test: Returns latest version (highest version number)
    - Test: Transforms template_data correctly
  - Acceptance: API returns one template per slug with slug identifier

- [ ] Update /api/generate to accept templateSlug
  - Files: `src/app/api/generate/route.ts` (modify)
  - Implementation:
    - Update request schema: `templateSlug: z.string().min(1)` (replace `templateId`)
    - Destructure `templateSlug` from parsed body
    - Pass `templateSlug` to `createGenerationJob()`
  - Tests: `src/app/api/generate/__tests__/route.test.ts` (modify existing)
    - Test: Accepts valid templateSlug
    - Test: Rejects missing templateSlug
    - Test: Rejects empty string templateSlug
  - Acceptance: API accepts slug, passes to job creation

- [ ] Update createGenerationJob function signature
  - Files: `src/lib/db/jobs.ts` (modify)
  - Implementation:
    - Change parameter: `templateSlug?: string` (was `templateId?: string`)
    - Update RPC call: `p_template_slug: templateSlug || 'ecommerce-base'`
    - Update function JSDoc
  - Tests: `src/lib/db/__tests__/jobs.test.ts` (modify existing)
    - Test: Creates job with templateSlug
    - Test: Defaults to 'ecommerce-base' when undefined
  - Acceptance: Function creates jobs with slug

- [ ] Add template_slug field to Job type
  - Files: `src/types/index.ts` (modify)
  - Implementation:
    - Add `template_slug: string` to Job interface
    - Mark `template_id` as optional/deprecated with comment
  - Tests: TypeScript compilation (no test file needed)
  - Acceptance: TypeScript compiles without errors

- [ ] Update generate-image.ts to use slug resolution
  - Files: `src/lib/ai/generate-image.ts` (modify)
  - Implementation:
    - Read `job.template_slug` instead of `job.template_id`
    - Call `buildPromptFromTemplateSlug(slug, analysis)` instead of `buildPromptFromTemplate(id, analysis)`
    - Add fallback for old jobs: `const templateSlug = job.template_slug ?? (job.template_id ? await resolveTemplateIdToSlug(job.template_id) : 'ecommerce-base')`
    - Create helper function `resolveTemplateIdToSlug(uuid: string): Promise<string>`
  - Tests: `src/lib/ai/__tests__/generate-image.test.ts` (modify existing)
    - Test: Uses template_slug when present
    - Test: Falls back to resolving template_id when slug missing
    - Test: Falls back to 'ecommerce-base' when both missing
  - Acceptance: Generation works with slug, handles legacy jobs

- [ ] Create template ID to slug resolver helper
  - Files: `src/lib/db/templates.ts` (modify)
  - Implementation:
    - Add function `resolveTemplateIdToSlug(templateId: string): Promise<string>`
    - Query prompt_templates by id, return slug
    - Return 'ecommerce-base' if not found
    - Add error logging
  - Tests: `src/lib/db/__tests__/templates.test.ts` (modify existing)
    - Test: Resolves valid UUID to slug
    - Test: Returns 'ecommerce-base' for invalid UUID
  - Acceptance: Helper resolves UUIDs to slugs

### Phase 3: Frontend Updates

- [ ] Update TemplateSelector component to use slug
  - Files: `src/components/forms/template-selector.tsx` (modify)
  - Implementation:
    - Update Template interface: `slug: string` (replace `id`)
    - Update props: `onChange: (templateSlug: string) => void`
    - Update mapping: use `template.slug` for key, value, comparisons
    - Update onChange callback to pass slug
    - Update auto-selection to use `data.templates[0].slug`
  - Tests: `src/components/forms/__tests__/template-selector.test.ts` (new)
    - Test: Renders templates with slug as key
    - Test: Calls onChange with slug when clicked
    - Test: Auto-selects first template slug
  - Acceptance: Component works with slug identifier

- [ ] Update Generate page to use templateSlug state
  - Files: `src/app/generate/page.tsx` (modify)
  - Implementation:
    - Rename state: `const [templateSlug, setTemplateSlug] = useState('')` (was `templateId`)
    - Update validation: check `templateSlug` not empty
    - Update API call body: `{ templateSlug, ... }` (was `templateId`)
    - Update TemplateSelector props: `value={templateSlug} onChange={setTemplateSlug}`
  - Tests: Manual E2E testing (component test not critical)
  - Acceptance: Page sends slug to API

### Phase 4: Prompt-Bench Compiler Updates

- [ ] Add getUsedVariables helper function
  - Files: `prompt-bench/core/compiler.ts` (modify)
  - Implementation:
    - Create function `getUsedVariables(templateData: TemplateData): Set<string>`
    - Extract all components (subject, background, lighting, camera, style, quality, negative)
    - Regex match `\{([a-zA-Z_][a-zA-Z0-9_]*)\}` to find placeholders
    - Return Set of variable names actually used in template
  - Tests: `prompt-bench/__tests__/compiler.test.ts` (modify)
    - Test: Finds all variables in template
    - Test: Returns empty set for fully hardcoded template
    - Test: Handles optional components (undefined)
  - Acceptance: Helper correctly identifies used variables

- [ ] Update validateRequiredVariables to use smart validation
  - Files: `prompt-bench/core/compiler.ts` (modify)
  - Implementation:
    - Add `templateData: TemplateData` as first parameter
    - Call `getUsedVariables(templateData)` to get used set
    - Only validate if: `usedVars.has(name) && def.required && !def.default && !(name in providedVariables)`
    - Update error message (unchanged)
  - Tests: `prompt-bench/__tests__/compiler.test.ts` (modify)
    - Test: Validates only used variables
    - Test: Ignores schema variables not in template
    - Test: Still validates required variables with defaults
  - Acceptance: Validation checks only actually-required variables

- [ ] Update compileTemplate to pass templateData to validation
  - Files: `prompt-bench/core/compiler.ts` (modify)
  - Implementation:
    - Update validation call: `validateRequiredVariables(templateData, variablesSchema, providedVariables)`
  - Tests: Covered by existing compiler tests
  - Acceptance: Compiler passes templateData to validator

- [ ] Update errors.ts validation signature (if separate)
  - Files: `prompt-bench/core/errors.ts` (modify)
  - Implementation:
    - Update `validateRequiredVariables` signature to match compiler
    - OR remove function if moved entirely to compiler.ts
  - Tests: N/A (signature update only)
  - Acceptance: No TypeScript errors

- [ ] Create unit tests for minimal-variable templates
  - Files: `prompt-bench/__tests__/compiler-minimal-variables.test.ts` (new)
  - Implementation:
    - Test: v4 template with only product variable compiles successfully
    - Test: Template with unused schema variables doesn't fail
    - Test: Template with truly required variable (used + no default) fails if not provided
    - Test: Template with all hardcoded values compiles with empty variables
  - Acceptance: All tests pass, coverage ≥75%

### Phase 5: Testing & Validation

- [ ] Run database migration in development
  - Files: N/A (command execution)
  - Implementation:
    - Run `npx supabase db push` to apply migration
    - Verify column exists: `\d jobs` in psql
    - Verify backfill: `SELECT template_slug, template_id FROM jobs LIMIT 10;`
  - Acceptance: Migration applied, data backfilled

- [ ] Create integration test batch file
  - Files: `prompt-bench/fixtures/test-v4-minimal.json` (new)
  - Implementation:
    - Create batch with single test using only `product` variable
    - Label: "v4-minimal-test"
    - No style, lighting_style, or background_type variables
  - Tests: Run `bun bench test --template ecommerce-base --batch prompt-bench/fixtures/test-v4-minimal.json`
  - Acceptance: Test completes without "Missing required variables" error

- [ ] Run full test suite
  - Files: N/A (command execution)
  - Implementation:
    - Run `bun test` for all unit tests
    - Run `bun test --coverage` to verify coverage ≥75%
    - Fix any failing tests
  - Acceptance: All tests pass, coverage threshold met

- [ ] Manual E2E testing
  - Files: N/A (manual testing)
  - Implementation:
    - Navigate to `/generate` in browser
    - Verify template selector shows only ONE "ecommerce-base" option
    - Select template, upload test image, generate
    - Verify generation succeeds
    - Check database: `SELECT template_slug FROM jobs ORDER BY created_at DESC LIMIT 1;`
  - Acceptance: Frontend works, DB stores slug, generation succeeds

- [ ] Verify batch API still works
  - Files: N/A (testing)
  - Implementation:
    - Batch API already uses slug resolution (src/app/api/batch/route.ts:88)
    - Verify batch generation still functional
  - Acceptance: Batch generation works unchanged

## Acceptance Criteria

- [ ] All TypeScript compilation errors resolved
- [ ] All unit tests pass (≥75% coverage)
- [ ] Integration test with minimal variables succeeds
- [ ] Frontend displays only one template per slug
- [ ] Jobs created with `template_slug` field populated
- [ ] Image generation uses latest template version (v4)
- [ ] No "Missing required variables" errors for v4 template
- [ ] Old jobs with `template_id` still work via fallback
- [ ] Database migration applied successfully
- [ ] Manual E2E test passes

## Files to Create/Modify

### New Files
- `supabase/migrations/[timestamp]_add_template_slug_to_jobs.sql`
- `src/app/api/templates/__tests__/route.test.ts`
- `src/components/forms/__tests__/template-selector.test.ts`
- `prompt-bench/__tests__/compiler-minimal-variables.test.ts`
- `prompt-bench/fixtures/test-v4-minimal.json`

### Modified Files
- `src/app/api/templates/route.ts` (deduplicate logic)
- `src/app/api/generate/route.ts` (accept slug)
- `src/lib/db/jobs.ts` (slug parameter)
- `src/lib/db/templates.ts` (add resolver helper)
- `src/lib/ai/generate-image.ts` (use slug resolution)
- `src/types/index.ts` (add template_slug to Job)
- `src/components/forms/template-selector.tsx` (use slug)
- `src/app/generate/page.tsx` (templateSlug state)
- `prompt-bench/core/compiler.ts` (getUsedVariables, smart validation)
- `prompt-bench/core/errors.ts` (validation signature)
- `prompt-bench/__tests__/compiler.test.ts` (new test cases)
- `src/app/api/generate/__tests__/route.test.ts` (update for slug)
- `src/lib/db/__tests__/jobs.test.ts` (update for slug)
- `src/lib/ai/__tests__/generate-image.test.ts` (slug resolution tests)

## Dependencies

### External Dependencies
- None (uses existing packages)

### Internal Dependencies
- Database migration must complete before backend changes deployed
- Backend API changes must deploy before frontend changes
- Type updates must be committed before dependent code changes
- Compiler updates independent, can deploy separately

### Task Dependencies
- Phase 1 (Database) must complete before Phase 2 (Backend)
- Phase 2 must complete before Phase 3 (Frontend)
- Phase 4 (Prompt-bench) can run in parallel with Phase 2-3
- Phase 5 (Testing) requires all previous phases complete

## Migration Order

1. **Database migration** (Phase 1)
2. **Backend changes** (Phase 2)
3. **Prompt-bench updates** (Phase 4) - can run parallel with Phase 2-3
4. **Frontend changes** (Phase 3)
5. **Testing & validation** (Phase 5)
6. **Deploy** (migrate → backend → frontend)

## Rollback Strategy

If critical issues occur post-deployment:

1. Keep `template_id` column functional (already nullable)
2. Revert RPC function to accept `p_template_id UUID`
3. Update API endpoints to accept both `templateId` and `templateSlug` (use whichever provided)
4. Frontend can fall back to sending UUID via feature flag

## Edge Cases Handled

1. **Old jobs with template_id**: Resolved via `resolveTemplateIdToSlug()` helper
2. **Template slug not found**: Falls back to 'ecommerce-base' with error logging
3. **Multiple active versions**: Query uses `ORDER BY version DESC LIMIT 1`
4. **Batch API compatibility**: Already uses slug resolution, verify no regression

## Success Metrics

- ✅ Zero "Missing required variables" errors in production logs
- ✅ 100% of new jobs use `template_slug` field
- ✅ Frontend displays deduplicated template list
- ✅ Test coverage ≥75% for modified modules
- ✅ No regression in batch generation
- ✅ Old jobs continue to work without errors
