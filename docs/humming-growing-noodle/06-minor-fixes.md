# Minor Fixes - Logging, Performance, and Accessibility

## Files to Modify
- `src/app/api/admin/users/[userId]/timeline/route.ts` (logging fix)
- `src/components/admin/users-list-page-client.tsx` (performance + accessibility)

## Implementation Details

### Fix 1: Replace console.warn with Structured Logger

**File:** `src/app/api/admin/users/[userId]/timeline/route.ts`

**Change line 46:**

```typescript
// Before:
console.warn('Error fetching timeline:', error);

// After:
logger.error('Error fetching timeline', { error, userId });
```

**Rationale:** Consistent with codebase logging standards. Server-side logs need structure for production debugging.

**Note:** Keep `console.error` in client components (users-list-page-client.tsx:82) - client-side console is acceptable for development.

---

### Fix 2: Add useMemo for Performance

**File:** `src/components/admin/users-list-page-client.tsx`

**Update import (line 1):**

```typescript
// Before:
import { useState } from 'react';

// After:
import { useState, useMemo } from 'react';
```

**Change line 90:**

```typescript
// Before:
const allUsers = data?.pages.flatMap(page => page.users) || [];

// After:
const allUsers = useMemo(
  () => data?.pages.flatMap(page => page.users) || [],
  [data]
);
```

**Rationale:** Array flattening is expensive and re-runs on every render. Memoization prevents unnecessary work, especially with pagination (100+ users).

---

### Fix 3: Add Keyboard Navigation to Table Rows

**File:** `src/components/admin/users-list-page-client.tsx`

**Replace TableRow implementation (lines 162-182):**

```typescript
// Before: onClick directly on TableRow
<TableRow
  key={user.id}
  className="cursor-pointer hover:bg-muted/50"
  onClick={() => handleRowClick(user.id)}
>
  <TableCell className="font-medium">{user.email}</TableCell>
  <TableCell>{user.displayName || '-'}</TableCell>
  {/* ... more cells ... */}
</TableRow>

// After: Wrap in button for keyboard support
<TableRow key={user.id} className="group">
  <TableCell colSpan={6} className="p-0">
    <button
      onClick={() => handleRowClick(user.id)}
      className="w-full text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
    >
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_40px] gap-4 px-6 py-4 items-center">
        <div className="font-medium">{user.email}</div>
        <div>{user.displayName || '-'}</div>
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
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  </TableCell>
</TableRow>
```

**Rationale:**
- Wrapping in `<button>` provides semantic HTML
- Automatic keyboard support (Tab, Enter, Space)
- Focus ring for accessibility
- Maintains visual design with grid layout

## Acceptance Criteria

- [ ] Server-side logging uses structured logger (not console.warn)
- [ ] Client-side console.error remains unchanged (acceptable for dev)
- [ ] useMemo added with correct dependency array
- [ ] Table rows wrapped in buttons
- [ ] Keyboard navigation works (Tab to row, Enter to navigate)
- [ ] Visual design unchanged (grid layout preserved)
- [ ] Focus indicators visible on keyboard navigation
- [ ] No TypeScript errors

## Testing Commands

```bash
# Type check
bun run typecheck

# Manual testing:
bun run dev

# Open http://localhost:3000/admin/users
# Test keyboard navigation:
# 1. Press Tab to focus on table rows
# 2. Press Enter on focused row - should navigate to user detail
# 3. Press Space on focused row - should also navigate
# 4. Verify focus ring is visible

# Test performance (open React DevTools Profiler):
# 1. Load user list with 20+ users
# 2. Trigger re-render (resize window, interact with filters)
# 3. Verify allUsers computation doesn't re-run unnecessarily
```

Expected:
- Keyboard navigation works smoothly
- Focus indicators clearly visible
- No unnecessary re-renders in profiler

## Dependencies

None - independent UI/UX improvements
