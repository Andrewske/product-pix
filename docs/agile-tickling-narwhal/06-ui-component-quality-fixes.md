# UI Component Quality Fixes

## Priority
**MEDIUM** - Code quality, accessibility, and maintainability

## Files to Modify
- `src/components/admin/users-list-page-client.tsx` (modify)

## Implementation Details

### Task 6.1: Replace console.error with logger

**File:** `src/components/admin/users-list-page-client.tsx`

**Issue:** Line 82 uses `console.error` which violates project convention: "No scattered console logs - use centralized logging"

**Fix:**

**Line 1** - Add import (after existing imports, around line 14):
```typescript
import { ChevronRight, RefreshCw } from 'lucide-react';
import type { AdminDashboardStats, UserListFilters, UserListItem } from '@/lib/db/admin-stats';
import { logger } from '@/lib/logging';  // ADD THIS
```

**Line 82** - Replace console.error:
```typescript
// Before
const refreshStats = async () => {
  try {
    const newStats = await fetchStats();
    setStats(newStats);
  } catch (error) {
    console.error('Failed to refresh stats:', error);
  }
};

// After
const refreshStats = async () => {
  try {
    const newStats = await fetchStats();
    setStats(newStats);
  } catch (error) {
    logger.error('Failed to refresh stats', { error });
  }
};
```

### Task 6.2: Fix Table Row Semantics

**File:** `src/components/admin/users-list-page-client.tsx`

**Issue:** Lines 162-183 use `<button>` element with custom grid to simulate table row. This breaks:
- HTML table semantics
- Screen reader accessibility
- Native table styling

**Fix:** Replace button with proper `<TableRow>`:

```typescript
// Before (lines 161-183)
allUsers.map((user) => (
  <button
    key={user.id}
    type="button"
    className="w-full grid grid-cols-[1fr_1fr_120px_80px_80px_40px] gap-4 px-4 py-2 text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm border-0 bg-transparent"
    onClick={() => handleRowClick(user.id)}
  >
    <div className="font-medium truncate">{user.email}</div>
    <div className="truncate">{user.displayName || '-'}</div>
    <div className="text-right font-mono">{user.creditBalance}</div>
    <div className="text-right font-mono">{user.jobCount}</div>
    <div className="text-right">
      {user.errorCount > 0 ? (
        <Badge variant="destructive">{user.errorCount}</Badge>
      ) : (
        <span className="text-muted-foreground">0</span>
      )}
    </div>
    <div className="flex justify-end">
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  </button>
))

// After
allUsers.map((user) => (
  <TableRow
    key={user.id}
    className="cursor-pointer hover:bg-muted/50"
    onClick={() => handleRowClick(user.id)}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRowClick(user.id);
      }
    }}
  >
    <TableCell className="font-medium">{user.email}</TableCell>
    <TableCell>{user.displayName || '-'}</TableCell>
    <TableCell className="text-right font-mono">{user.creditBalance}</TableCell>
    <TableCell className="text-right font-mono">{user.jobCount}</TableCell>
    <TableCell className="text-right">
      {user.errorCount > 0 ? (
        <Badge variant="destructive">{user.errorCount}</Badge>
      ) : (
        <span className="text-muted-foreground">0</span>
      )}
    </TableCell>
    <TableCell className="text-right">
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </TableCell>
  </TableRow>
))
```

**Benefits:**
- Proper HTML table structure
- Accessible to screen readers
- Keyboard navigation with Enter/Space
- Maintains click and hover functionality
- Cleaner CSS (no manual grid)

### Task 6.3: Use Array.from for Skeleton Generation

**File:** `src/components/admin/users-list-page-client.tsx`

**Issue:** Line 144 uses magic array `['skeleton-1', 'skeleton-2', ..., 'skeleton-10']` which is hard to maintain.

**Fix:** Replace with `Array.from`:

```typescript
// Before (line 144)
{isLoading && allUsers.length === 0 ? (
  ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6', 'skeleton-7', 'skeleton-8', 'skeleton-9', 'skeleton-10'].map((key) => (
    <TableRow key={key}>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-6 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    </TableRow>
  ))

// After
{isLoading && allUsers.length === 0 ? (
  Array.from({ length: 10 }, (_, i) => (
    <TableRow key={`skeleton-${i}`}>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-6 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    </TableRow>
  ))
```

**Benefits:**
- Easy to change skeleton count (just change `length: 10`)
- More idiomatic JavaScript
- Self-documenting (clear intent)

## Acceptance Criteria
- [ ] No `console.error` in users-list-page-client.tsx
- [ ] Logger import added and used correctly
- [ ] Table rows use proper TableRow/TableCell components
- [ ] Clicking row still navigates to user detail page
- [ ] Keyboard navigation works (Enter/Space on focused row)
- [ ] Skeleton loading uses Array.from
- [ ] ESLint passes with no console warnings

## Testing Steps
1. Run `bun run lint` → no console.error warnings
2. Load admin users page → verify table renders correctly
3. Click table row → verify navigation works
4. Tab to table row, press Enter → verify keyboard navigation works
5. Refresh page while loading → verify skeleton uses proper table structure
6. Test with screen reader → verify proper table semantics announced

## Dependencies
None - these are isolated UI fixes
