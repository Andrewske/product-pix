# TypeScript Type Safety Fixes

## Priority
**HIGH** - Type safety violations cause build errors and runtime risks

## Files to Modify
- `src/lib/db/admin-timeline.ts` (modify)
- `src/app/api/admin/users/[userId]/timeline/route.ts` (modify)

## Implementation Details

### Task 2.1: Define View Row Interface

**File:** `src/lib/db/admin-timeline.ts`

**Issue:** Using `any` types throughout timeline query code

**Fix:** Add interface after imports (before line 9, after the existing type definitions):

```typescript
// After line 8, before TimelineEventType definition
interface TimelineViewRow {
  id: string;
  type: TimelineEventType;
  subtype: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
```

### Task 2.2: Remove All `any` Types

**File:** `src/lib/db/admin-timeline.ts`

**Issues:**
1. Line 51: `(supabase as any)` to access view
2. Line 89: `row: any` parameter in map function
3. Line 109: `metadata: any` parameter in functions

**Fixes:**

**Line 51** - Replace unsafe type assertion:
```typescript
// Before
let query = (supabase as any)
  .from('user_timeline_view')

// After
let query = supabase
  .from('user_timeline_view')
  .select('id, type, subtype, timestamp, metadata')
```

**Line 89** - Use TimelineViewRow interface:
```typescript
// Before
const validatedEvents = events.map((row: any) => ({

// After
const validatedEvents = events.map((row: TimelineViewRow) => ({
```

**Line 109** - Type metadata parameter:
```typescript
// Before
function generateTitle(row: { type: string; subtype: string; metadata: any }): string {

// After
function generateTitle(row: { type: string; subtype: string; metadata: Record<string, unknown> }): string {
```

### Task 2.3: Fix Cursor Type Mismatch

**File:** `src/app/api/admin/users/[userId]/timeline/route.ts`

**Issue:** Line 33 passes `cursor` which is `string | null` but `getUnifiedTimeline` expects `cursor?: string | undefined`

**Fix:** Line 33, change:
```typescript
// Before
const result = await getUnifiedTimeline(userId, {
  limit,
  cursor,
  filters: {

// After
const result = await getUnifiedTimeline(userId, {
  limit,
  cursor: cursor ?? undefined,
  filters: {
```

## Acceptance Criteria
- [ ] No `any` types remain in `admin-timeline.ts`
- [ ] TypeScript build passes: `bun run tsc`
- [ ] No TypeScript errors related to cursor type mismatch
- [ ] All timeline query types are properly inferred

## Testing Steps
1. Run `bun run tsc` → should have no errors in these files
2. Run `bun run lint` → should have no `@typescript-eslint/no-explicit-any` errors
3. Verify IDE shows proper type hints for `TimelineViewRow`

## Dependencies
None - these are isolated type fixes
