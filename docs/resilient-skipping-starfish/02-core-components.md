# Core Components Update

## Files to Modify
- `src/components/ui/button.tsx` (modify)
- `src/components/ui/input.tsx` (modify)
- `src/components/ui/card.tsx` (modify)
- `src/components/ui/select.tsx` (modify)
- `src/components/ui/badge.tsx` (modify)

## Reference Files
- `/home/kevin/coding/shadcn-template/components/ui/button.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/input.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/card.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/select.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/badge.tsx`

## Implementation Details

### button.tsx
- Add to base classes: `rounded-4xl`, `border border-transparent`, `bg-clip-padding`, `select-none`, `group/button`
- Add new sizes: `xs`, `icon-xs`
- **Keep `has-[>svg]` pattern** (do NOT use template's `has-data-[icon=...]`)
- Add `accent` variant for ProductPix: `bg-accent text-accent-foreground hover:bg-accent/90`

### input.tsx
- Add `rounded-4xl`
- Add `bg-input/30` for subtle background
- Update ring: `focus-visible:ring-[3px]`

### card.tsx
- Change `rounded-xl` → `rounded-2xl`
- Add `ring-1 ring-foreground/10`
- Add `size` prop with variants:
  - `default`: gap-6 py-6, px-6 on children
  - `sm`: gap-4 py-4, px-4 on children
- **Remove** `studio`, `hero`, `control` variants

### select.tsx
- Trigger: `rounded-4xl`, `bg-input/30` (match input styling)
- Content: `rounded-2xl`
- Item: `rounded-xl`

### badge.tsx
- Add `rounded-4xl` (pill shape)
- Add `h-5` fixed height

## Acceptance Criteria
- [ ] Button has pill shape (rounded-4xl)
- [ ] Button has `xs` and `icon-xs` sizes
- [ ] Button `accent` variant works
- [ ] Input has subtle background and pill shape
- [ ] Card has `size` prop working (default, sm)
- [ ] Card no longer has studio/hero/control variants
- [ ] Select trigger matches input styling
- [ ] Badge has pill shape
- [ ] No TypeScript errors

## Dependencies
- Task 01 (Foundation) must be completed first for radius variables
