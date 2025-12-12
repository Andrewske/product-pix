# Design System Phase 1: Typography Foundation

## Overview
Replace Geist/Geist_Mono font stack with Space Grotesk (display) and Inter (body) as specified in the design system. This is the highest-impact change that affects all text sitewide.

## Architecture Decisions

- **Space Grotesk for display**: Modern, friendly sans-serif for headings (H1-H6)
- **Inter for body**: Clean, highly readable for body text
- **CSS variables approach**: Use `--font-display` and `--font-body` for flexibility
- **Heading defaults**: Apply display font to all heading elements via CSS
- **Backward compatible**: Existing className usage continues to work

## Implementation Tasks

### Phase 1: Font Configuration

- [ ] Update font imports in root layout
  - Files: `src/app/layout.tsx` (modify)
  - Changes:
    - Remove `Geist`, `Geist_Mono` imports
    - Add `Space_Grotesk`, `Inter` imports from `next/font/google`
    - Configure with CSS variable names (`--font-display`, `--font-body`)
    - Update body className to include both font variable classes
  - Tests: Visual verification (no unit test needed for font imports)
  - Acceptance: Both fonts load correctly, no FOUT (flash of unstyled text)

- [ ] Add typography CSS rules
  - Files: `src/app/globals.css` (modify)
  - Changes:
    - Add `.font-display { font-family: var(--font-display); }`
    - Add `.font-body { font-family: var(--font-body); }`
    - Add heading defaults: `h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); }`
    - Ensure body inherits `--font-body`
  - Tests: `src/app/__tests__/typography.test.ts` (new)
  - Acceptance: CSS classes apply correct font families

### Phase 2: Component Typography Updates

- [ ] Update CardTitle to use display font
  - Files: `src/components/ui/card.tsx` (modify)
  - Changes: Add `font-display` class to CardTitle component
  - Tests: `src/components/ui/__tests__/card.test.tsx` (update if exists)
  - Acceptance: Card titles render in Space Grotesk

- [ ] Update SectionHeader to use display font
  - Files: `src/components/ui/section-header.tsx` (modify)
  - Changes: Ensure h2/title uses `font-display` class
  - Tests: Visual verification
  - Acceptance: Section headers render in Space Grotesk

- [ ] Verify mono font usage is appropriate
  - Files: Search for `font-mono` usage across codebase
  - Changes: Ensure mono is only used for prices, timestamps, code
  - Tests: Grep for `font-mono` and verify each usage
  - Acceptance: No mono font on headings or body text

## Acceptance Criteria

- [ ] All headings (H1-H6) render in Space Grotesk
- [ ] Body text renders in Inter
- [ ] Mono font only appears on prices, timestamps, code snippets
- [ ] No TypeScript errors
- [ ] No visual regressions in existing pages
- [ ] Both light and dark mode typography consistent

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Modify | Replace font imports |
| `src/app/globals.css` | Modify | Add typography CSS rules |
| `src/components/ui/card.tsx` | Modify | Add font-display to CardTitle |
| `src/components/ui/section-header.tsx` | Modify | Ensure display font usage |

## Dependencies

- **External**: `next/font/google` (already available in Next.js)
- **Fonts**: Space Grotesk, Inter (Google Fonts - free)
- **No blocking dependencies**: This phase can be executed independently

## Verification Commands

```bash
# Build to check for errors
bun build

# Run dev server and visually verify
bun dev
# Check: /, /generate, /dashboard, /login pages

# Search for font-mono usage
grep -r "font-mono" src/
```

## Rollback Plan

If issues arise, revert `layout.tsx` to use Geist/Geist_Mono imports and remove new CSS rules from globals.css.
