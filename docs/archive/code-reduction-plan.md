# Code Reduction Implementation Plan

## Overview
Address 5 code reduction opportunities in `src/` to reduce ~390 lines, improve maintainability, and establish better patterns. Excludes type safety work (handled separately).

## Architecture Decisions

- **Auth middleware pattern**: Higher-order function `withAuth()` wraps route handlers, guaranteeing authenticated `user` in handler scope. Follows Next.js 15 patterns.
- **Credit pricing**: Single source of truth in `src/lib/pricing/credits.ts`. Resolution-based pricing constants with typed accessors.
- **Logging**: Structured JSON logging with configurable log levels. Supports future log aggregation (Datadog, CloudWatch).
- **Gemini extraction**: Internal helper function (not exported) to deduplicate image response parsing between text and image generation methods.

## Implementation Tasks

### Phase 1: Foundation (No Dependencies)

- [ ] Create credit calculation utilities
  - Files: `src/lib/pricing/credits.ts` (new)
  - Tests: `src/lib/pricing/__tests__/credits.test.ts` (new)
  - Acceptance:
    - `getCreditsForResolution('1k')` returns 1
    - `getCreditsForResolution('2k')` returns 2
    - `getCreditsForResolution('4k')` returns 3
    - `calculateBatchCredits([{resolution: '2k'}, {resolution: '4k'}])` returns 5
    - TypeScript errors on invalid resolution values

- [ ] Export credits module from pricing barrel
  - Files: `src/lib/pricing/index.ts` (modify)
  - Tests: None (re-export only)
  - Acceptance: `import { getCreditsForResolution } from '@/lib/pricing'` works

- [ ] Create centralized logging utility
  - Files: `src/lib/logging/index.ts` (new)
  - Tests: `src/lib/logging/__tests__/index.test.ts` (new)
  - Acceptance:
    - `logger.info('msg', { key: 'value' })` outputs JSON with timestamp, level, message, context
    - `logger.error('msg')` writes to stderr
    - Log level filtering works (LOG_LEVEL=error suppresses info/warn/debug)

- [ ] Create auth middleware for API routes
  - Files: `src/lib/auth/api-middleware.ts` (new)
  - Tests: `src/lib/auth/__tests__/api-middleware.test.ts` (new)
  - Acceptance:
    - `withAuth(handler)` returns function compatible with Next.js route handlers
    - Returns 401 JSON response when unauthenticated
    - Passes `{ user }` context to handler when authenticated
    - Supports route params via `params` argument

- [ ] Export auth middleware from auth barrel
  - Files: `src/lib/auth/index.ts` (modify)
  - Tests: None (re-export only)
  - Acceptance: `import { withAuth } from '@/lib/auth'` works

### Phase 2: Credit Calculation Migration (Depends on Phase 1)

- [ ] Refactor batch creation to use centralized credits
  - Files: `src/app/api/batch/route.ts` (modify lines 63-68)
  - Tests: Existing tests should pass
  - Acceptance:
    - Remove inline `creditsPerItem` object
    - Use `calculateBatchCredits()` for total calculation
    - Batch creation charges correct credits

- [ ] Refactor single generation to use centralized credits
  - Files: `src/app/api/generate/route.ts` (modify line 63)
  - Tests: Existing tests should pass
  - Acceptance:
    - Remove ternary chain for credit calculation
    - Use `getCreditsForResolution()`
    - Single generation charges correct credits

- [ ] Refactor batch cancellation to use centralized credits
  - Files: `src/app/api/batch/[batchId]/cancel/route.ts` (modify lines 73-81)
  - Tests: Existing tests should pass
  - Acceptance:
    - Remove inline `creditsPerItem` object
    - Use `getCreditsForResolution()` for refund calculation
    - Cancellation refunds correct credits

### Phase 3: Logging Migration (Depends on Phase 1)

- [ ] Migrate webhook handlers to centralized logging
  - Files: `src/lib/stripe/webhook-handlers.ts` (modify - 9 console statements)
  - Tests: Existing tests should pass
  - Acceptance:
    - All `console.log/error/warn` replaced with `logger.*`
    - Logs include structured context (event type, subscription ID, etc.)
    - No console statements remain in file

- [ ] Migrate batch DB operations to centralized logging
  - Files: `src/lib/db/batch.ts` (modify - 9 console statements)
  - Tests: Existing tests should pass
  - Acceptance:
    - All `console.log/error/warn` replaced with `logger.*`
    - Logs include structured context (batch ID, user ID, etc.)

- [ ] Migrate batch API route to centralized logging
  - Files: `src/app/api/batch/route.ts` (modify - 3 console statements)
  - Tests: Existing tests should pass
  - Acceptance: All console statements replaced with logger

- [ ] Migrate generate-image to centralized logging
  - Files: `src/lib/ai/generate-image.ts` (modify - 3 console statements)
  - Tests: Existing tests should pass
  - Acceptance: All console statements replaced with logger

### Phase 4: Dead Code Removal (No Dependencies)

- [ ] Remove unimplemented tier upgrade handler
  - Files: `src/lib/stripe/webhook-handlers.ts` (modify)
  - Tests: Existing webhook tests should pass
  - Acceptance:
    - Remove `handleSubscriptionTierUpgrade` function (lines 167-175)
    - Remove call site in `handleSubscriptionChange` (lines 67-69)
    - Add TODO comment noting future work needed
    - No runtime errors on subscription webhook events

### Phase 5: Auth Middleware Migration (Depends on Phase 1)

- [ ] Refactor presign route to use auth middleware
  - Files: `src/app/api/upload/presign/route.ts` (modify)
  - Tests: Manual test upload flow
  - Acceptance:
    - Use `export const POST = withAuth(async (request, { user }) => {...})`
    - Remove inline auth boilerplate
    - Returns 401 for unauthenticated requests
    - Upload presign works for authenticated users

- [ ] Refactor confirm route to use auth middleware
  - Files: `src/app/api/upload/confirm/route.ts` (modify)
  - Tests: Manual test upload confirmation
  - Acceptance: Same as presign route

- [ ] Refactor generate route to use auth middleware
  - Files: `src/app/api/generate/route.ts` (modify POST and GET)
  - Tests: Manual test single generation
  - Acceptance:
    - Both POST and GET use `withAuth`
    - Generation flow works end-to-end

- [ ] Refactor batch route to use auth middleware
  - Files: `src/app/api/batch/route.ts` (modify POST and GET)
  - Tests: Manual test batch creation and listing
  - Acceptance:
    - Both POST and GET use `withAuth`
    - Batch creation and listing work

- [ ] Refactor parse-csv route to use auth middleware
  - Files: `src/app/api/batch/parse-csv/route.ts` (modify)
  - Tests: Manual test CSV parsing
  - Acceptance: CSV parsing works for authenticated users

- [ ] Refactor batch detail route to use auth middleware
  - Files: `src/app/api/batch/[batchId]/route.ts` (modify)
  - Tests: Manual test batch detail fetch
  - Acceptance: Batch detail retrieval works

- [ ] Refactor batch cancel route to use auth middleware
  - Files: `src/app/api/batch/[batchId]/cancel/route.ts` (modify)
  - Tests: Manual test batch cancellation
  - Acceptance: Batch cancellation works

### Phase 6: Gemini Provider Refactor (No Dependencies)

- [ ] Extract image response parsing helper
  - Files: `src/lib/ai/providers/gemini.ts` (modify)
  - Tests: `src/lib/ai/providers/__tests__/gemini.test.ts` (new or modify)
  - Acceptance:
    - Create internal `extractImageFromResponse()` helper
    - Refactor `generateFromText` to use helper (lines 86-148)
    - Refactor `generateFromImage` to use helper (lines 151-232)
    - Text-to-image generation works
    - Image-to-image generation works
    - Error responses unchanged (same messages, codes)
    - ~80 lines reduced

## Acceptance Criteria

- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds
- [ ] `bun test` passes
- [ ] New test files have ≥80% coverage
- [ ] No TypeScript errors (`bun run tsc --noEmit`)
- [ ] Manual verification:
  - [ ] Single image generation works
  - [ ] Batch creation works
  - [ ] Batch cancellation refunds correct credits
  - [ ] Unauthenticated API requests return 401
  - [ ] Logs output as structured JSON

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/pricing/credits.ts` | Credit calculation utilities |
| `src/lib/pricing/__tests__/credits.test.ts` | Credit calculation tests |
| `src/lib/logging/index.ts` | Centralized logging utility |
| `src/lib/logging/__tests__/index.test.ts` | Logging tests |
| `src/lib/auth/api-middleware.ts` | Auth wrapper for API routes |
| `src/lib/auth/__tests__/api-middleware.test.ts` | Auth middleware tests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/pricing/index.ts` | Add credits export |
| `src/lib/auth/index.ts` | Add api-middleware export |
| `src/lib/stripe/webhook-handlers.ts` | Logger migration, remove dead code |
| `src/lib/db/batch.ts` | Logger migration |
| `src/lib/ai/generate-image.ts` | Logger migration |
| `src/lib/ai/providers/gemini.ts` | Extract image parsing helper |
| `src/app/api/batch/route.ts` | Credits, logger, auth middleware |
| `src/app/api/batch/parse-csv/route.ts` | Auth middleware |
| `src/app/api/batch/[batchId]/route.ts` | Auth middleware |
| `src/app/api/batch/[batchId]/cancel/route.ts` | Credits, auth middleware |
| `src/app/api/generate/route.ts` | Credits, auth middleware |
| `src/app/api/upload/presign/route.ts` | Auth middleware |
| `src/app/api/upload/confirm/route.ts` | Auth middleware |

## Dependencies

### Internal Dependencies
- Phase 2 depends on Phase 1 (credits module)
- Phase 3 depends on Phase 1 (logging module)
- Phase 5 depends on Phase 1 (auth middleware)
- Phase 4 and Phase 6 have no dependencies (can run in parallel)

### External Dependencies
- None (all utilities are self-contained)

## Notes

- **Excluded**: Type safety work (`as any` removal) - handled by separate agent
- **Incremental logging**: Only high-frequency files migrated initially. Other files can be addressed in future PRs.
- **Auth middleware typing**: Ensure proper generic typing for route params to maintain type safety
