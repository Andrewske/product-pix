# Image Gallery → Tabs + AlertDialog Migration

## Files to Modify/Create
- `src/components/image-gallery.tsx` (modify)

## Implementation Details

This task covers two related changes in the same file.

### Part A: Filter Buttons → Tabs

**Current State:** Custom button-based tabs with manual active state:
```tsx
<Button
  variant="ghost"
  onClick={() => setFilter('all')}
  className={`rounded-none border-b-2 px-1 ${
    filter === 'all'
      ? 'border-primary text-primary'
      : 'border-transparent...'
  }`}
>
```

**Migration:**
```tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs value={filter} onValueChange={setFilter}>
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="pending">Pending</TabsTrigger>
    <TabsTrigger value="completed">Completed</TabsTrigger>
    {/* etc */}
  </TabsList>
</Tabs>
```

Note: We only use TabsList/TabsTrigger since content is handled separately (not TabsContent).

### Part B: confirm() → AlertDialog

**Current State:** Browser native confirm:
```tsx
if (!confirm('Are you sure you want to delete this image?')) return;
```

**Migration:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// State for managing which image to delete
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Image</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete this image? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleDelete(deleteTarget)}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Acceptance Criteria
- [ ] Filter tabs use shadcn Tabs component
- [ ] Tab selection works correctly (all filters function)
- [ ] Proper ARIA roles applied (tablist, tab)
- [ ] Keyboard navigation works (arrow keys between tabs)
- [ ] Delete confirmation uses AlertDialog instead of confirm()
- [ ] AlertDialog has proper styling consistent with app
- [ ] Delete functionality works correctly after confirmation
- [ ] Cancel closes dialog without action

## Dependencies
- Tasks 01-04 (establish patterns before this medium-impact task)
