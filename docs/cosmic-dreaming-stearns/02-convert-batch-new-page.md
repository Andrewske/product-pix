# Convert `/batch/new` Page to Server Component

## Files to Modify/Create
- `src/components/batch/batch-new-page-content.tsx` (new)
- `src/app/batch/new/page.tsx` (modify)

## Problem
Client component with NO server-side auth - only protected by proxy file that we're removing.

## Implementation Details

### Step 1: Create Client Content Component

Create `src/components/batch/batch-new-page-content.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// ... all existing imports from batch/new/page.tsx

export function BatchNewPageContent() {
  const router = useRouter();
  const { credits } = useCredits();
  const [step, setStep] = useState<Step>('upload');
  // ... all other state from current page

  // Copy ALL handlers from current page.tsx
  // Copy ALL JSX from current page.tsx (lines 87-240)

  // ... existing implementation ...
}
```

**Key:** Move ALL state, handlers, and JSX from current `src/app/batch/new/page.tsx` into this component.

### Step 2: Convert Page to Server Component

Replace `src/app/batch/new/page.tsx` with:

```typescript
import { requireAuth } from '@/lib/auth/server';
import { BatchNewPageContent } from '@/components/batch/batch-new-page-content';

export default async function NewBatchPage(): Promise<JSX.Element> {
  await requireAuth();

  return <BatchNewPageContent />;
}
```

## Acceptance Criteria
- [ ] Unauthenticated users redirect to `/login?redirect=%2Fbatch%2Fnew`
- [ ] CSV wizard works (upload -> preview -> creation)
- [ ] Credit display updates in real-time
- [ ] Batch creation and navigation work
- [ ] No TypeScript errors

## Dependencies
None - can run in parallel with Task 01.

## Reference Files
- `src/lib/auth/server.ts` - `requireAuth()` implementation
- `src/app/pricing/page.tsx` - Example of server component auth pattern
