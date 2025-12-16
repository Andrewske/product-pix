# Design System Overhaul: Full Template Replacement

## Overview

Replace ProductPix UI components with shadcn-template patterns. This is a full replacement, not a careful migration.

**Source of Truth:**
```
/home/kevin/coding/shadcn-template/
├── app/layout.tsx          # Font setup
├── app/globals.css         # Theme + @theme inline
└── components/ui/          # All components
```

**Key Decisions:**
- Font variables: Tailwind standard (`--font-sans`, `--font-mono`, `--font-display`)
- Icon handling: Keep `has-[>svg]` pattern (no API change)
- Dark borders: Pure white alpha `oklch(1 0 0 / 10%)`
- Card variants: Remove studio/hero/control, use template defaults

## Task Sequence

1. [01-foundation-fonts-and-theme.md](./01-foundation-fonts-and-theme.md) - Fonts (Figtree + Geist), @theme inline, radius, dark borders **[CHECKPOINT]**
2. [02-core-components.md](./02-core-components.md) - Button, input, card, select, badge
3. [03-dialog-overlay-components.md](./03-dialog-overlay-components.md) - Dialog, alert-dialog, sheet, drawer, dropdown-menu, popover, tooltip
4. [04-form-components.md](./04-form-components.md) - Field, checkbox, radio-group, textarea, input-group
5. [05-documentation-updates.md](./05-documentation-updates.md) - Update design docs and CLAUDE.md
6. [06-verification-and-testing.md](./06-verification-and-testing.md) - Visual verification and test commands

## Success Criteria

- [ ] Fonts load correctly (Figtree display, Geist body, Geist Mono code)
- [ ] All components use new radius system (rounded-4xl pills, rounded-2xl containers)
- [ ] Dark mode borders use alpha transparency
- [ ] No TypeScript/ESLint errors
- [ ] Existing tests pass
- [ ] Visual verification passes in both light/dark modes

## Execution Instructions

1. **Phase 1 → Checkpoint → Phase 2 → Phase 3**
2. Execute Task 01, then **STOP and visually verify** before continuing
3. Tasks 02-04 can be done in parallel (no dependencies between them)
4. Reference template files directly — don't rely on docs for exact class strings
5. Verify acceptance criteria before moving to next task

## Files Modified Summary

**Total: 21 files**

| Category | Count | Files |
|----------|-------|-------|
| Foundation | 2 | `layout.tsx`, `globals.css` |
| Core | 5 | `button.tsx`, `input.tsx`, `card.tsx`, `select.tsx`, `badge.tsx` |
| Overlay | 8 | `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`, `popover.tsx`, `tooltip.tsx` |
| Form | 5 | `field.tsx`, `checkbox.tsx`, `radio-group.tsx`, `textarea.tsx`, `input-group.tsx` |
| Docs | 3 | `design-principles.md`, `design-system.md`, `CLAUDE.md` |

## Dependencies

**External:**
- `next/font/google` for Figtree, Geist, Geist_Mono fonts (already available)

**Reference:**
- shadcn-template at `/home/kevin/coding/shadcn-template/`
