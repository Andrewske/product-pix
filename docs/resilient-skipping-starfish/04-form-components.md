# Form Components Update

## Files to Modify
- `src/components/ui/field.tsx` (modify)
- `src/components/ui/checkbox.tsx` (modify)
- `src/components/ui/radio-group.tsx` (modify)
- `src/components/ui/textarea.tsx` (modify)
- `src/components/ui/input-group.tsx` (modify)

## Reference Files
- `/home/kevin/coding/shadcn-template/components/ui/field.tsx`
- `/home/kevin/coding/shadcn-template/components/ui/checkbox.tsx`

## Implementation Details

### field.tsx
- Add `text-left` to FieldDescription
- Add error deduplication in FieldError:
  ```tsx
  const uniqueErrors = [...new Set(errors)];
  ```

### checkbox.tsx
- Change `rounded-[4px]` → `rounded-[6px]`
- Add touch target expansion:
  ```tsx
  className="... relative after:absolute after:-inset-x-3 after:-inset-y-2 after:content-['']"
  ```

### radio-group.tsx
- Add touch target expansion (same pattern as checkbox)

### textarea.tsx
- Add `rounded-xl` (not 4xl - multiline needs visible corners)
- Add `bg-input/30` for subtle background
- Match focus states with input component

### input-group.tsx
- Add `rounded-4xl` to container
- Add `bg-input/30` background

## Acceptance Criteria
- [ ] Field description is left-aligned
- [ ] Field error messages are deduplicated
- [ ] Checkbox has larger click area
- [ ] Checkbox corners are slightly more rounded
- [ ] Radio group has improved touch targets
- [ ] Textarea has subtle background and rounded-xl corners
- [ ] InputGroup has pill shape container
- [ ] All form components work with Field wrapper
- [ ] No TypeScript errors

## Dependencies
- Task 01 (Foundation) must be completed first
- Task 02 (Core Components) recommended for consistent input styling
