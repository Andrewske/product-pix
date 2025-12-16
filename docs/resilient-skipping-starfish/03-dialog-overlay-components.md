# Dialog & Overlay Components Update

## Files to Modify
- `src/components/ui/dialog.tsx` (modify)
- `src/components/ui/alert-dialog.tsx` (modify)
- `src/components/ui/sheet.tsx` (modify)
- `src/components/ui/drawer.tsx` (modify)
- `src/components/ui/dropdown-menu.tsx` (modify)
- `src/components/ui/context-menu.tsx` (modify)
- `src/components/ui/popover.tsx` (modify)
- `src/components/ui/tooltip.tsx` (modify)

## Reference Files
- `/home/kevin/coding/shadcn-template/components/ui/dialog.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/sheet.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/dropdown-menu.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/popover.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/tooltip.tsx`

## Implementation Details

### dialog.tsx
- Overlay: `bg-black/50` → `bg-black/80`
- Content: `rounded-lg` → `rounded-2xl`
- Add `ring-1 ring-foreground/10`

### alert-dialog.tsx
- Same changes as dialog

### sheet.tsx
- Visible edges get `rounded-2xl`:
  - Side "right": `rounded-l-2xl`
  - Side "left": `rounded-r-2xl`
  - Side "top": `rounded-b-2xl`
  - Side "bottom": `rounded-t-2xl`

### drawer.tsx
- Same pattern as sheet for visible edges

### dropdown-menu.tsx
- Content: Add `ring-1 ring-foreground/5`
- Item: `rounded-xl`

### context-menu.tsx
- Same changes as dropdown-menu

### popover.tsx
- Content: `rounded-2xl`
- Add `ring-1 ring-foreground/10`

### tooltip.tsx
- Content: `rounded-2xl`

## Acceptance Criteria
- [ ] Dialog overlay is darker (80% opacity)
- [ ] Dialog content has softer corners (rounded-2xl)
- [ ] Alert dialog matches dialog styling
- [ ] Sheet/Drawer have rounded visible edges
- [ ] Dropdown/context menu items have rounded-xl
- [ ] All overlays have subtle ring borders
- [ ] Animations still work correctly
- [ ] No TypeScript errors

## Dependencies
- Task 01 (Foundation) must be completed first
