# Fix Utility Function Return Types

## Files to Modify
- `src/lib/utils.ts` (1 violation)

## Implementation Details

Fix the return type for the `cn()` utility function (clsx/tailwind-merge wrapper).

### The cn() Function

This is a common utility that combines Tailwind CSS classes:

```typescript
// Before
export function cn(...inputs: ClassValue[]) {
  return clsx(twMerge(...inputs))
}

// After
export function cn(...inputs: ClassValue[]): string {
  return clsx(twMerge(...inputs))
}
```

### Implementation Steps
1. Read `src/lib/utils.ts`
2. Locate the `cn()` function
3. Add `: string` return type
4. Verify no other violations in the file

## Acceptance Criteria
- [ ] `cn()` function has explicit `: string` return type
- [ ] `bun lint` shows violation count reduced by 1
- [ ] `bun typecheck` passes
- [ ] No other violations introduced

## Expected Progression
Violations: ~38 → ~37

## Dependencies
- Task 01 (ESLint configuration must be updated first)

## Notes
- This is a single-line fix
- `cn()` is used throughout the codebase for className merging
- Return type is always `string` (from clsx)
