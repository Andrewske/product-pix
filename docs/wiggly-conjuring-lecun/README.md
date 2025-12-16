# shadcn/ui Migration Plan

## Overview

Migrate custom UI implementations in ProductPix to shadcn/ui components for improved accessibility, consistency, and reduced maintenance burden. The codebase already has strong shadcn adoption; this plan addresses remaining opportunities.

## Task Sequence

1. [01-insufficient-credits-modal-dialog.md](./01-insufficient-credits-modal-dialog.md) - Convert custom modal overlay to shadcn Dialog
2. [02-auth-forms-react-hook-form.md](./02-auth-forms-react-hook-form.md) - Migrate login/signup forms to react-hook-form + shadcn Form
3. [03-contact-form-react-hook-form.md](./03-contact-form-react-hook-form.md) - Migrate contact form to react-hook-form + shadcn Form
4. [04-alertbox-consolidation.md](./04-alertbox-consolidation.md) - Remove custom AlertBox, consolidate with shadcn Alert
5. [05-image-gallery-tabs-alertdialog.md](./05-image-gallery-tabs-alertdialog.md) - Convert filter buttons to Tabs, confirm() to AlertDialog
6. [06-help-search-command.md](./06-help-search-command.md) - Replace custom search dropdown with Command component

## Success Criteria

- [ ] All custom modal overlays replaced with Dialog
- [ ] All forms use react-hook-form + Zod + shadcn Form components
- [ ] AlertBox component deleted, Alert used everywhere
- [ ] No browser `confirm()` calls - use AlertDialog
- [ ] Filter tabs use shadcn Tabs with proper ARIA
- [ ] Help search uses Command component
- [ ] No TypeScript errors after migration
- [ ] All existing functionality preserved
- [ ] Improved accessibility (focus trapping, keyboard nav, ARIA)

## Execution Instructions

1. Execute tasks in numerical order (01 → 06)
2. Each task file contains:
   - Files to modify/create
   - Implementation details with code examples
   - Acceptance criteria checklist
   - Dependencies on prior tasks
3. Verify acceptance criteria before moving to next task
4. Run type checking after each task: `bun run typecheck`

## Dependencies

**Already installed:**
- shadcn/ui components (Dialog, AlertDialog, Form, Tabs, Command, Alert, etc.)
- react-hook-form
- @hookform/resolvers
- zod

**No new dependencies required.**

## Priority Notes

| Priority | Tasks | Impact |
|----------|-------|--------|
| HIGH | 01-03 | Accessibility, code reduction |
| MEDIUM | 04-05 | Consistency, cleanup |
| LOW | 06 | Polish (optional if time-constrained) |

Task 06 (help-search → Command) is optional if time is limited - the existing implementation works, just has manual keyboard handling.
