# Fix TypeScript Compilation Errors

## Files to Modify
- src/app/api/admin/users/[userId]/timeline/route.ts (modify - line 33)
- src/lib/db/jobs.ts (modify - line 21)
- src/components/admin/__tests__/timeline-filters.test.tsx (modify - 11 instances)
- src/components/admin/user-timeline.tsx (modify - line 19)

## Implementation Details

Fix remaining TypeScript errors after schema migrations. Many schema errors should auto-resolve from Task 05. Focus on remaining type mismatches and component interface issues.

**Current error breakdown (from docs/current-type-errors.md):**
- 1 error: src/app/api/admin/users/[userId]/timeline/route.ts:33 - null vs undefined
- 11 errors: src/components/admin/__tests__/timeline-filters.test.tsx - missing `types` property
- 1 error: src/components/admin/user-timeline.tsx:19 - useRef missing initialValue
- 1 error: src/lib/db/jobs.ts:21 - undefined not assignable to string

**Schema errors (should be auto-fixed by Task 05):**
- 4 errors: src/lib/auth/__tests__/hooks.test.ts - deleted_at
- 1 error: src/components/__tests__/image-card.test.tsx - refunded_at
- 3 errors: src/lib/r2/cleanup.ts - account_deletion_audit, original_email

### Sub-Task A: Null/Undefined Conversions

**Files:**
- src/app/api/admin/users/[userId]/timeline/route.ts:33
  ```typescript
  // Before: cursor is string | null
  const cursor = searchParams.get('cursor');

  // After: convert to string | undefined
  const cursor = searchParams.get('cursor') ?? undefined;
  ```

- src/lib/db/jobs.ts:21
  ```typescript
  // Ensure uploadId ?? undefined doesn't pass undefined where string required
  // Fix: Use conditional or provide default string value
  p_upload_id: uploadId ?? '', // or handle undefined case properly
  ```

**Verification:** `bun run typecheck` after this sub-task

### Sub-Task B: Component Interface Fixes

**Files:**
- src/components/admin/__tests__/timeline-filters.test.tsx
  ```typescript
  // Add missing types: [] to all test fixtures (11 instances)
  const defaultFilters = {
    types: [], // ADD THIS
    severity: undefined,
    domain: undefined,
    resolved: "all",
    days: 7,
  };
  ```

- src/components/admin/user-timeline.tsx:19
  ```typescript
  // Before:
  const observerRef = useRef<IntersectionObserver>();

  // After (option 1 - nullable):
  const observerRef = useRef<IntersectionObserver | null>(null);

  // OR (option 2 - non-null assertion):
  const observerRef = useRef<IntersectionObserver>(null!);
  ```

**Verification:** `bun run typecheck` after this sub-task

### Contingency Plan

If new TypeScript errors are discovered during fixes:
1. Pause execution
2. Categorize new errors by type (schema, null handling, interface mismatches)
3. Create additional sub-tasks if needed
4. Re-run verification after all fixes

## Acceptance Criteria

- [ ] All null/undefined conversion errors fixed
- [ ] All component interface errors fixed
- [ ] Schema-related errors auto-resolved by Task 05 migrations
- [ ] `bun run typecheck` shows "Found 0 errors"
- [ ] No new TypeScript errors introduced

## Dependencies

- Task 05 (create-database-schema-migrations) must complete first
- Schema errors should be auto-resolved by regenerated types

## Risk

High - Type fixes could reveal additional errors (contingency plan in place)

## Testing

```bash
# After each sub-task
bun run typecheck

# Final verification - must show zero errors
bun run typecheck
# Expected: "Found 0 errors"
```
