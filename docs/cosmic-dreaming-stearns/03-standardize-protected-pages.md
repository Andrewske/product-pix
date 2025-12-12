# Standardize Existing Protected Pages to requireAuth()

## Files to Modify
- `src/app/dashboard/page.tsx` (modify)
- `src/app/settings/page.tsx` (modify)
- `src/app/batch/page.tsx` (modify)
- `src/app/batch/[batchId]/page.tsx` (modify)

## Problem
These pages have server-side auth but use inconsistent patterns (manual `getUser() + redirect`). Standardize to `requireAuth()`.

## Implementation Details

### 3.1: Standardize `/dashboard`

**File:** `src/app/dashboard/page.tsx`

```typescript
// Add import
import { requireAuth } from '@/lib/auth/server';
// Remove: import { redirect } from 'next/navigation';

// Replace lines 15-20 (manual auth block) with:
const user = await requireAuth();

// Keep all data fetching unchanged:
const images = await getUserGeneratedImages(user.id);
const recentBatches = await getUserBatches(user.id, { limit: 3 });
```

---

### 3.2: Standardize `/settings`

**File:** `src/app/settings/page.tsx`

```typescript
// Add import
import { requireAuth } from '@/lib/auth/server';
// Remove: import { redirect } from 'next/navigation';
// Remove: import { createClient } from '@/lib/supabase/server';

// Replace lines 9-14 (manual auth block) with:
await requireAuth();

// JSX unchanged
```

---

### 3.3: Standardize `/batch`

**File:** `src/app/batch/page.tsx`

```typescript
// Add import
import { requireAuth } from '@/lib/auth/server';
// Remove: import { redirect } from 'next/navigation';

// Replace lines 12-17 (manual auth block) with:
const user = await requireAuth();

const batches = await getUserBatches(user.id, { limit: 50 });
```

---

### 3.4: Standardize `/batch/[batchId]` with Ownership Check

**File:** `src/app/batch/[batchId]/page.tsx`

```typescript
// Add import
import { requireAuth } from '@/lib/auth/server';
// Keep: import { redirect } from 'next/navigation'; (still needed for ownership check)

// Replace lines 18-23 (manual auth block) with:
const user = await requireAuth();

const batch = await getBatchJob(batchId);

if (!batch) {
  redirect('/batch');
}

// KEEP ownership check (business logic, not auth):
if (batch.user_id !== user.id) {
  redirect('/batch');
}
```

## Acceptance Criteria
- [ ] All 4 pages redirect unauthenticated users to `/login`
- [ ] Dashboard displays user's images and batches correctly
- [ ] Settings tabs render correctly
- [ ] Batch list displays correctly
- [ ] Batch detail shows owned batches, redirects for non-owned
- [ ] No TypeScript errors

## Dependencies
- Tasks 01 and 02 should complete first (critical pages)

## Reference Files
- `src/lib/auth/server.ts` - `requireAuth()` implementation
- `src/app/pricing/page.tsx` - Example pattern
