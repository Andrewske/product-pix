# Code Review Cleanup Implementation Plan

## Overview

Address all action items and suggestions from the product analysis pre-generation code review. Includes bug fixes, code deduplication, logging standardization, and function refactoring.

## Architecture Decisions

- **Result Type Extraction**: Create shared `src/lib/result.ts` module to eliminate duplication across AI modules. Railway-oriented programming pattern used consistently.
- **Shallow Merge for Job Parameters**: Use JS spread operator with fetch-then-update pattern. Supabase-js lacks native JSONB merge, and creating an RPC function adds migration complexity for minimal benefit.
- **Model ID Configuration**: Use existing env vars (`ANALYSIS_MODEL`, `GEMINI_MODEL`) instead of creating new constants file.
- **Helper Function Extraction**: Keep helpers in same file as main function (no separate module) to maintain cohesion while reducing function length.

## Implementation Tasks

### Phase 1: Shared Utilities

- [x] Create shared Result type module
  - Files: `src/lib/result.ts` (new)
  - Tests: Not needed (pure types with trivial implementations)
  - Acceptance: Exports `Result<T>`, `Ok<T>`, `Err`, `ok()`, `err()` types and functions

```typescript
// src/lib/result.ts
interface Ok<T> {
  ok: true;
  data: T;
}

interface Err {
  ok: false;
  error: { code: string; message: string };
}

type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = (error: { code: string; message: string }): Err => ({ ok: false, error });
export type { Result, Ok, Err };
```

### Phase 2: Bug Fixes

- [x] Fix updateJobParameters to merge instead of overwrite
  - Files: `src/lib/db/jobs.ts` (modify lines 115-135)
  - Tests: Existing tests should still pass
  - Acceptance: New parameters merge with existing instead of replacing

```typescript
export const updateJobParameters = async (
  jobId: string,
  params: Record<string, unknown>
): Promise<boolean> => {
  const supabase = createAdminClient();

  // Fetch existing parameters to merge
  const { data: current } = await supabase
    .from('jobs')
    .select('parameters')
    .eq('id', jobId)
    .single();

  const merged = { ...(current?.parameters ?? {}), ...params };

  const { error } = await supabase
    .from('jobs')
    .update({ parameters: merged as Json })
    .eq('id', jobId);

  if (error) {
    logger.error('Error updating job parameters', { error, jobId });
    return false;
  }

  return true;
};
```

- [x] Replace hardcoded model IDs with env configuration
  - Files: `src/lib/ai/generate-image.ts` (modify lines 65, 169, 181)
  - Tests: Existing tests should still pass
  - Acceptance: Model IDs sourced from `env.ANALYSIS_MODEL` and `env.GEMINI_MODEL`
  - Changes:
    - Line 65: `'gemini-2.0-flash'` → `env.ANALYSIS_MODEL`
    - Line 169: `'gemini-3-pro-image-preview'` → `env.GEMINI_MODEL`
    - Line 181: `'gemini-3-pro-image-preview'` → `env.GEMINI_MODEL`

- [x] Delete one-time test verification script
  - Files: `test-unique-constraint.ts` (delete)
  - Tests: N/A
  - Acceptance: File removed from repository

### Phase 3: Code Quality - AI Modules

- [x] Update product-analyzer to use shared Result type
  - Files: `src/lib/ai/product-analyzer.ts` (modify)
  - Tests: `src/lib/ai/__tests__/product-analyzer.test.ts` should still pass
  - Acceptance: Remove lines 10-27 (local Result definition), import from `@/lib/result`

- [x] Update prompt-builder to use shared Result type and DRY helpers
  - Files: `src/lib/ai/prompt-builder.ts` (modify)
  - Tests: `src/lib/ai/__tests__/prompt-builder.test.ts` should still pass
  - Acceptance:
    - Remove lines 7-24 (local Result definition), import from `@/lib/result`
    - Extract shared `compileWithAnalysis()` helper function
    - Both `buildPromptFromTemplate` and `buildPromptFromTemplateSlug` use the helper

```typescript
// Helper function to extract
const compileWithAnalysis = (
  template: PromptTemplate,
  analysis: ProductAnalysis | undefined
): Result<string> => {
  const variables: Record<string, string> = {
    product: analysis?.product || '',
    color: analysis?.color || '',
    material: analysis?.material || '',
    shape: analysis?.shape || '',
    features: analysis?.features?.join(', ') || '',
  };

  const compileResult = compileTemplate(
    template.templateData as TemplateData,
    template.variablesSchema as VariablesSchema,
    variables,
    { skipValidation: false }
  );

  if (!compileResult.ok) {
    return err({
      code: 'COMPILATION_ERROR',
      message: `Failed to compile template: ${compileResult.error.message}`,
    });
  }

  return ok(compileResult.data.prompt);
};
```

- [x] Refactor generateImage function to extract helpers
  - Files: `src/lib/ai/generate-image.ts` (modify)
  - Tests: Existing tests should still pass
  - Acceptance: Main function under 80 lines, helpers extracted
  - Extract these functions:
    1. `runProductAnalysis(params)` - Lines 56-93 (analysis + cost recording)
    2. `recordGenerationCost(params)` - Lines 166-196 (cost calculation + storage)

### Phase 4: Code Quality - Database Modules

- [x] Standardize logging in templates.ts
  - Files: `src/lib/db/templates.ts` (modify lines 28-29, 59-60)
  - Tests: N/A (logging change)
  - Acceptance: Replace `console.error()` with `logger.error()` from `@/lib/logging`

- [x] Standardize logging in generated-images.ts
  - Files: `src/lib/db/generated-images.ts` (modify lines 56, 60)
  - Tests: N/A (logging change)
  - Acceptance: Replace `console.error()` with `logger.error()` from `@/lib/logging`

- [x] Standardize logging in jobs.ts
  - Files: `src/lib/db/jobs.ts` (modify lines 27, 48, 76, 108)
  - Tests: N/A (logging change)
  - Acceptance: Replace `console.error()` with `logger.error()` from `@/lib/logging`
  - Note: Line 130 already updated in Phase 2

### Phase 5: Verification

- [x] Run test suite to verify no regressions
  - Command: `bun test`
  - Acceptance: All existing tests pass

- [x] Run TypeScript build to verify no type errors
  - Command: `bun run build`
  - Acceptance: Build succeeds with no errors

## Acceptance Criteria

- [x] All tests pass (`bun test`)
- [x] No TypeScript errors (`bun run build`)
- [x] `updateJobParameters` merges parameters correctly (manual verification)
- [x] No `console.error` calls in modified db modules
- [x] Result type imported from shared module (no local definitions)
- [x] Model IDs not hardcoded in generate-image.ts
- [x] test-unique-constraint.ts deleted

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/result.ts` | Create | Shared Result type utilities |
| `src/lib/db/jobs.ts` | Modify | Fix merge behavior, standardize logging |
| `src/lib/db/templates.ts` | Modify | Standardize logging |
| `src/lib/db/generated-images.ts` | Modify | Standardize logging |
| `src/lib/ai/generate-image.ts` | Modify | Extract helpers, use env for models |
| `src/lib/ai/product-analyzer.ts` | Modify | Import shared Result |
| `src/lib/ai/prompt-builder.ts` | Modify | Import shared Result, DRY helpers |
| `test-unique-constraint.ts` | Delete | Remove verification script |

## Dependencies

### Internal Dependencies
- `@/lib/logging` - Already exists, provides `logger` module
- `@/lib/env` - Already exists, provides `env.ANALYSIS_MODEL` and `env.GEMINI_MODEL`

### Task Dependencies
1. Phase 1 (shared utilities) must complete before Phase 3 (AI modules)
2. Phase 2 and Phase 4 can run in parallel
3. Phase 5 (verification) must run last

## Notes

- The unique index on `(user_id, title)` intentionally allows multiple NULL titles per user (PostgreSQL behavior). This is correct since titles are optional.
- No new migrations required - all changes are application code
