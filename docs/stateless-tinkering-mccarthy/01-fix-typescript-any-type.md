# Fix TypeScript `any` Type

## Files to Modify
- `src/components/admin/user-timeline.tsx` (line 41)

## Implementation Details

**Rule violation:** `@typescript-eslint/no-explicit-any`

Remove the explicit `any` type annotation - React Query already infers the correct type from the query function return type.

**Current (broken):**
```typescript
const events = data?.pages.flatMap((page: any) => page.events) ?? [];
```

**Fixed:**
```typescript
const events = data?.pages.flatMap((page) => page.events) ?? [];
```

## Acceptance Criteria
- [ ] `any` type annotation removed from line 41
- [ ] TypeScript compilation passes: `bunx tsc --noEmit`
- [ ] Linting passes for this file: `bun run lint`
- [ ] Type inference works correctly (no runtime errors)

## Dependencies
None - this is a standalone quick fix.

## Estimated Time
5 minutes
