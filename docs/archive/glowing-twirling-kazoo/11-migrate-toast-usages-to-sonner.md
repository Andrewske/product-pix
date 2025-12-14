# Migrate Toast Usages to Sonner

## Files to Modify/Create
- `src/components/admin/refund-approval-queue.tsx` (modify)
- `src/components/ui/use-toast.ts` (modify)
- `src/components/ui/toaster.tsx` (modify)
- Find other files via: `grep -rl "useToast" src/`
- `src/hooks/use-toast.ts` (delete)
- `src/components/ui/toast.tsx` (delete - Radix version)

## Implementation Details

### Migration Pattern

**OLD:**
```typescript
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Error', description: 'Failed' });
```

**NEW:**
```typescript
import { toast } from '@/lib/toast';
toast.error('Failed');
```

### Files to Migrate

Grep for all uses of `useToast` and migrate to new `toast` import:

1. `src/components/admin/refund-approval-queue.tsx`
2. `src/components/ui/use-toast.ts`
3. `src/components/ui/toaster.tsx`
4. (Find others via grep - estimated 9 files total)

### Cleanup

After migration:
- Delete `src/hooks/use-toast.ts`
- Delete `src/components/ui/toast.tsx` (Radix version)
- Keep `src/components/ui/sonner.tsx` (already themed)

### Verify Layout

Ensure `src/app/layout.tsx` has `<Toaster />` from Sonner:

```typescript
import { Toaster } from '@/components/ui/sonner';
// ... in JSX
<Toaster position="bottom-right" />
```

## Acceptance Criteria
- [ ] All 9 files migrated from useToast hook to toast import
- [ ] Old hook deleted
- [ ] Old Radix toast component deleted
- [ ] Sonner Toaster component in layout
- [ ] All toast calls work correctly

## Dependencies
- Task 10 (toast wrapper created)
