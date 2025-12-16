# Replace @ts-ignore with @ts-expect-error

## Files to Modify
- src/app/api/cron/analyze-sentiment/__tests__/route.test.ts (modify - lines 138, 269, 377, 408)
- src/app/api/messages/[id]/__tests__/route.test.ts (modify - lines 81, 85)
- src/lib/analytics/posthog-provider.tsx (modify - line 15)

## Implementation Details

Update 7 instances of `@ts-ignore` to `@ts-expect-error` for better type safety enforcement.

**Rationale:** `@ts-expect-error` will cause a lint error if the following line is error-free, ensuring suppression comments stay relevant.

**Changes:**
```typescript
// Before
// @ts-ignore
someCodeThatHasTypeIssue();

// After
// @ts-expect-error - [brief reason why error is expected]
someCodeThatHasTypeIssue();
```

**Files with instances (from docs/current-lint-errors.md):**
1. src/app/api/cron/analyze-sentiment/__tests__/route.test.ts:138
2. src/app/api/cron/analyze-sentiment/__tests__/route.test.ts:269
3. src/app/api/cron/analyze-sentiment/__tests__/route.test.ts:377
4. src/app/api/cron/analyze-sentiment/__tests__/route.test.ts:408
5. src/app/api/messages/[id]/__tests__/route.test.ts:81
6. src/app/api/messages/[id]/__tests__/route.test.ts:85
7. src/lib/analytics/posthog-provider.tsx:15

## Acceptance Criteria

- [ ] All 7 instances replaced with @ts-expect-error
- [ ] Optional: Add brief comment explaining why error is expected
- [ ] `bun run typecheck` shows no new errors
- [ ] `bun run lint` shows no ban-ts-comment violations

## Dependencies

None - Independent code quality improvement

## Risk

Low - Purely stylistic change for better type checking

## Testing

```bash
bun run typecheck
# Verify: No new errors introduced

bun run lint | grep "ban-ts-comment"
# Expected: Zero violations
```
