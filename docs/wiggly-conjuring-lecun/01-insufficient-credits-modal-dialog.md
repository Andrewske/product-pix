# Insufficient Credits Modal → Dialog Migration

## Files to Modify/Create
- `src/components/generation/insufficient-credits-modal.tsx` (modify)

## Implementation Details

**Current State:** Custom modal with inline overlay implementation:
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <Card className="w-full max-w-md ...">
```

**Migration:**
1. Replace custom overlay with shadcn Dialog component
2. Use Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
3. Convert internal Card-based layout to Dialog's built-in structure
4. Ensure open/close state is managed via Dialog's controlled mode

**Pattern to Follow:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    {/* Body content */}
    <DialogFooter>
      {/* Action buttons */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Acceptance Criteria
- [ ] Modal opens/closes correctly with Dialog component
- [ ] Focus is trapped within modal when open
- [ ] Escape key closes modal
- [ ] Click outside modal closes it (or doesn't, based on requirement)
- [ ] Animations work smoothly
- [ ] All existing functionality preserved (credit display, upgrade button, close action)
- [ ] Accessibility: proper ARIA attributes applied automatically

## Dependencies
None - this is the first task
