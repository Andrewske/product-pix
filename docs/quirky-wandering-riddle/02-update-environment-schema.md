# Update Environment Variable Schema

## Files to Modify
- `src/lib/env.ts` (modify)
- `src/components/providers/posthog-provider.tsx` (modify)
- `src/components/analytics/posthog-script.tsx` (modify)
- `src/lib/observability/validate-config.ts` (modify)

## Implementation Details

**Problem:** Missing environment variables in schema; naming inconsistency between NEXT_PUBLIC_POSTHOG_KEY (in schema) and NEXT_PUBLIC_POSTHOG_API_KEY (in code usage).

**Solution:** Add 4 missing variables to schema; standardize all code to use NEXT_PUBLIC_POSTHOG_KEY.

### Part 1: Update Schema (src/lib/env.ts)

After line 47 (where `POSTHOG_API_KEY` is defined), add these four new variables:

```typescript
POSTHOG_PROJECT_ID: z.string().optional(),
POSTHOG_PERSONAL_API_KEY: z.string().optional(),
POSTHOG_HOST: z.string().url().optional(),
OBSERVABILITY_ENABLED: z.enum(['true', 'false']).optional().default('false'),
```

### Part 2: Rename Variable References

Replace all occurrences of `NEXT_PUBLIC_POSTHOG_API_KEY` with `NEXT_PUBLIC_POSTHOG_KEY`:

**File: `src/components/providers/posthog-provider.tsx`**
- Line 13: `env.NEXT_PUBLIC_POSTHOG_API_KEY` → `env.NEXT_PUBLIC_POSTHOG_KEY`
- Line 15: `env.NEXT_PUBLIC_POSTHOG_API_KEY` → `env.NEXT_PUBLIC_POSTHOG_KEY`

**File: `src/components/analytics/posthog-script.tsx`**
- Line 14: `process.env.NEXT_PUBLIC_POSTHOG_API_KEY` → `process.env.NEXT_PUBLIC_POSTHOG_KEY`

**File: `src/lib/observability/validate-config.ts`**
- Line 14: `env.NEXT_PUBLIC_POSTHOG_API_KEY` → `env.NEXT_PUBLIC_POSTHOG_KEY`

## Acceptance Criteria

1. **TypeScript Error Check:**
   ```bash
   bunx tsc --noEmit 2>&1 | grep -E "POSTHOG|OBSERVABILITY"
   # Expected: 0 matches (no errors about missing PostHog or Observability env vars)
   ```

2. **Schema Validation:**
   - All 4 new variables are optional (won't break existing deployments)
   - OBSERVABILITY_ENABLED defaults to 'false'
   - POSTHOG_HOST accepts URL format

3. **No References to Old Name:**
   ```bash
   grep -r "NEXT_PUBLIC_POSTHOG_API_KEY" src/
   # Expected: 0 matches (except in comments/docs if any)
   ```

## Dependencies

None - can run in parallel with Task 01.

## Impact

**Fixes:** ~10 TypeScript errors across observability and PostHog modules.

## Post-Implementation Notes

Remember to update `.env.example` and document the environment variable naming convention in CLAUDE.md (can be done in final cleanup task).
