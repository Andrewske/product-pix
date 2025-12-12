# Design System Phase 2: Core Component Updates

## Overview
Update core UI components (Card, Badge, Button) with design system variants for dark mode hierarchy and semantic accent colors. These changes cascade to all pages using these components.

## Architecture Decisions

- **Card hierarchy variants**: Add `hero` and `control` variants for dark mode visual hierarchy (hero panels slightly lighter than control panels)
- **Badge teal variant**: Explicit `teal` variant for secondary info badges (design system: teal = info/context/support)
- **Button accent variant**: Add explicit `accent` variant for green CTAs (design system: green = do/commit/spend credit)
- **Additive changes**: New variants don't modify existing defaults to avoid breaking changes

## Implementation Tasks

### Phase 1: Card Component Updates

- [ ] Add CSS variables for card hierarchy
  - Files: `src/app/globals.css` (modify)
  - Changes:
    ```css
    .dark {
      --card-hero: oklch(0.18 0.01 265);    /* Slightly lighter for result panels */
      --card-control: oklch(0.14 0.01 265); /* Standard for settings/forms */
    }
    ```
  - Tests: Visual verification in dark mode
  - Acceptance: Two distinct card surface levels visible in dark mode

- [ ] Add `hero` and `control` Card variants
  - Files: `src/components/ui/card.tsx` (modify)
  - Changes:
    - Add `hero` variant: `dark:bg-[var(--card-hero)]` for result/output panels
    - Add `control` variant: `dark:bg-[var(--card-control)]` for form/control panels
    - Keep `default` unchanged for backward compatibility
  - Tests: `src/components/ui/__tests__/card.test.tsx` (update)
  - Acceptance:
    - `<Card variant="hero">` renders lighter in dark mode
    - `<Card variant="control">` renders standard in dark mode
    - Default Card behavior unchanged

### Phase 2: Badge Component Updates

- [ ] Add `teal` Badge variant
  - Files: `src/components/ui/badge.tsx` (modify)
  - Changes:
    ```tsx
    teal: 'border-transparent bg-teal text-teal-foreground [a&]:hover:bg-teal/90'
    ```
  - Tests: `src/components/ui/__tests__/badge.test.tsx` (update)
  - Acceptance:
    - `<Badge variant="teal">` renders with teal background
    - Existing `info` variant continues to work
    - Proper contrast in both light and dark modes

### Phase 3: Button Component Updates

- [ ] Add `accent` Button variant
  - Files: `src/components/ui/button.tsx` (modify)
  - Changes:
    ```tsx
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg'
    ```
  - Tests: `src/components/ui/__tests__/button.test.tsx` (update)
  - Acceptance:
    - `<Button variant="accent">` renders with green accent color
    - Proper hover state with shadow
    - Works in both light and dark modes

- [ ] Verify `studio` variant uses accent appropriately
  - Files: `src/components/ui/button.tsx` (verify/modify)
  - Changes: Ensure shadow uses accent color on hover
  - Tests: Visual verification
  - Acceptance: Studio button hover shows green-tinted shadow

### Phase 4: Component Tests

- [ ] Update Card component tests
  - Files: `src/components/ui/__tests__/card.test.tsx` (modify)
  - Changes:
    - Add tests for `hero` variant rendering
    - Add tests for `control` variant rendering
    - Verify dark mode class application
  - Acceptance: All card variant tests pass

- [ ] Update Badge component tests
  - Files: `src/components/ui/__tests__/badge.test.tsx` (modify)
  - Changes:
    - Add test for `teal` variant
    - Verify proper class application
  - Acceptance: Badge teal variant test passes

- [ ] Update Button component tests
  - Files: `src/components/ui/__tests__/button.test.tsx` (modify)
  - Changes:
    - Add test for `accent` variant
    - Verify proper class application
  - Acceptance: Button accent variant test passes

## Acceptance Criteria

- [ ] Card `hero` variant visibly lighter than `control` in dark mode
- [ ] Card `default` variant unchanged (backward compatible)
- [ ] Badge `teal` variant renders correctly
- [ ] Button `accent` variant renders with green color
- [ ] All component tests pass
- [ ] No TypeScript errors
- [ ] Coverage ≥75% for modified components

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | Add card hierarchy CSS variables |
| `src/components/ui/card.tsx` | Modify | Add hero/control variants |
| `src/components/ui/badge.tsx` | Modify | Add teal variant |
| `src/components/ui/button.tsx` | Modify | Add accent variant |
| `src/components/ui/__tests__/card.test.tsx` | Modify | Add variant tests |
| `src/components/ui/__tests__/badge.test.tsx` | Modify | Add teal test |
| `src/components/ui/__tests__/button.test.tsx` | Modify | Add accent test |

## Dependencies

- **Depends on**: Phase 1 (Typography) should be completed first for consistent font rendering in tests
- **CVA**: Already using class-variance-authority for variants
- **Tailwind CSS variables**: Already defined in globals.css

## Code Examples

### Card Variants (card.tsx)
```tsx
const cardVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
      studio: 'matte-card rounded-2xl overflow-hidden',
      hero: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm dark:bg-[oklch(0.18_0.01_265)]',
      control: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm dark:bg-[oklch(0.14_0.01_265)]',
    },
    // ...
  },
})
```

### Badge Teal Variant (badge.tsx)
```tsx
teal: 'border-transparent bg-teal text-teal-foreground [a&]:hover:bg-teal/90',
```

### Button Accent Variant (button.tsx)
```tsx
accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg hover:shadow-accent/20',
```

## Verification Commands

```bash
# Run component tests
bun test src/components/ui/__tests__/card.test.tsx
bun test src/components/ui/__tests__/badge.test.tsx
bun test src/components/ui/__tests__/button.test.tsx

# Run all tests with coverage
bun test --coverage

# Build to verify no errors
bun build

# Visual verification
bun dev
# Check dark mode: /generate, /dashboard pages
```
