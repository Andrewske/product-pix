# Design System Sitewide Implementation - Master Plan

## Overview

Apply the ProductPix design system (`docs/reference/design-system.md`) across all 18 pages. The Generate page (see `screenshot-2025-12-11_13-25-08.png`) is the reference implementation.

## Design System Summary

| Principle | Implementation |
|-----------|----------------|
| Typography | Space Grotesk (display), Inter (body), mono only for prices/timestamps |
| Colors | Green = primary CTA, Teal = info/secondary |
| Layout | Card-based, two-column (controls left, hero right) |
| Dark Mode | Layered charcoal (not pure black), card hierarchy |
| Motion | 150-250ms transitions, restrained |

## Implementation Phases

Execute these plans in order:

### Phase 1: Typography Foundation
**Plan:** `docs/design-system-01-typography-foundation-plan.md`

**Scope:**
- Replace Geist fonts with Space Grotesk + Inter
- Add typography CSS rules to globals.css
- Update component typography (CardTitle, SectionHeader)

**Key Files:**
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/ui/card.tsx`

**Estimated Tasks:** 5

---

### Phase 2: Core Component Updates
**Plan:** `docs/design-system-02-core-components-plan.md`

**Scope:**
- Add Card `hero`/`control` variants for dark mode hierarchy
- Add Badge `teal` variant for secondary info
- Add Button `accent` variant for green CTAs

**Key Files:**
- `src/app/globals.css`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`

**Estimated Tasks:** 8

---

### Phase 3: Page Consistency Updates
**Plan:** `docs/design-system-03-page-consistency-plan.md`

**Scope:**
- Apply design system to all 18 pages
- Rebuild Contact page (currently placeholder)
- Verify landing page sections

**Key Files:**
- All `src/app/*/page.tsx` files (18 pages)
- `src/components/landing/*.tsx` (5 section components)

**Estimated Tasks:** 20+

---

## Quick Reference

### Accent Color Usage
```
GREEN (--accent):
- Primary buttons ("Generate", "Sign Up", "Submit")
- Selected states (chosen style, active tab)
- Credit-related actions

TEAL (--teal):
- Info badges ("AI studio for ecommerce sellers")
- Helper text and tips
- Secondary status indicators
```

### Card Variant Usage
```
variant="hero"    → Result panels, image galleries (lighter in dark mode)
variant="control" → Forms, settings, controls (standard dark)
variant="studio"  → Special matte effect cards
variant="default" → Standard cards (backward compatible)
```

### Typography Usage
```
font-display → Headings (H1-H6), card titles, section headers
font-body    → Body text, descriptions, form labels
font-mono    → Prices, timestamps, technical meta only
```

## Execution Order

```
1. Phase 1: Typography Foundation
   └── Affects: All text sitewide
   └── Blocks: Nothing (can verify immediately)

2. Phase 2: Core Component Updates
   └── Affects: All Card, Badge, Button usage
   └── Blocks: Phase 3 (needs variants for page updates)

3. Phase 3: Page Consistency Updates
   └── Affects: Individual pages
   └── Can be parallelized: Batch A-F can run concurrently
```

## Verification Checklist

After all phases complete:

- [ ] All headings render in Space Grotesk
- [ ] All body text renders in Inter
- [ ] Green accent on all primary CTAs
- [ ] Teal accent on info badges
- [ ] Card hierarchy visible in dark mode
- [ ] No pure black backgrounds
- [ ] Contact page is fully functional
- [ ] All tests pass (`bun test`)
- [ ] Build succeeds (`bun build`)
- [ ] No TypeScript errors

## Files Summary

| Phase | Files Modified | Files Created |
|-------|----------------|---------------|
| 1 | 4 | 0 |
| 2 | 7 | 0 |
| 3 | 23+ | 1 (contact test) |
| **Total** | ~34 | 1 |
