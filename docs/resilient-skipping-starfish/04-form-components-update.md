# Form Components Update

## Files to Modify/Create
- src/components/ui/field.tsx
- src/components/ui/checkbox.tsx
- src/components/ui/radio-group.tsx
- src/components/ui/textarea.tsx
- src/components/ui/input-group.tsx

## Implementation Details
Replace ProductPix UI components with shadcn-template patterns. This is a full replacement, not a careful migration.

Source of Truth: /home/kevin/coding/shadcn-template/

Key Decisions:
- Font variables: Tailwind standard (--font-sans, --font-mono, --font-display)
- Icon handling: Keep has-[>svg] pattern (no API change)
- Dark borders: Pure white alpha oklch(1 0 0 / 10%)
- Card variants: Remove studio/hero/control, use template defaults

Specific Changes:
- field.tsx: Add text-left to FieldDescription, add error deduplication in FieldError (uniqueErrors = [...new Set(errors)])
- checkbox.tsx: Change rounded-[4px] → rounded-[6px], add touch target expansion (relative after:absolute after:-inset-x-3 after:-inset-y-2 after:content-[''])
- radio-group.tsx: Add touch target expansion (same as checkbox)
- textarea.tsx: Add rounded-xl, bg-input/30, match focus states with input
- input-group.tsx: Add rounded-4xl to container, bg-input/30

Reference Files: Corresponding files in /home/kevin/coding/shadcn-template/components/ui/

## Acceptance Criteria
- Field desc left-aligned, errors deduped
- Checkbox larger click area, rounded-[6px]
- Radio improved touch targets
- Textarea subtle bg rounded-xl
- Input-group pill shape
- Works with Field component
- No TypeScript errors
- Follow CLAUDE.md FP + type-safety rules

## Dependencies
- Access to /home/kevin/coding/shadcn-template/ reference files