# ProductPix → shadcn-template Design System Migration

## Overview

This migration replaces ProductPix's custom "studio minimalist" design system with shadcn-template's gray + green color palette and standard component patterns.

**What's Changing**:
- **Color System**: Blue-charcoal backgrounds → Gray neutral base
- **Theme Color**: Custom mint green accent → Standard green primary
- **Visual Effects**: Remove all custom studio effects (spotlight, matte-card, gradients, ambient-wash)
- **Component Variants**: Remove `studio`, `teal`, `success`, `info` variants
- **CSS Structure**: Add missing `@import "shadcn/tailwind.css"` and `@theme inline` with radius utilities

**What's Staying**:
- Typography: Figtree (display), Geist (body), Geist Mono (code) ✓
- Layout structure: PageContainer, two-column layouts ✓
- Functionality: No logic changes, purely visual ✓

**User Confirmed Requirements**:
- ✓ Match shadcn-template color scheme exactly (gray base, NOT blue)
- ✓ Import shadcn's @theme inline config structure with radius utilities
- ✓ Remove ALL custom studio effects
- ✓ Adopt shadcn component patterns
- ✓ Fully adopt shadcn-template's palette

---

## Task Sequence

Execute tasks in numerical order:

1. **[01-replace-globals-css.md](./01-replace-globals-css.md)** - Replace globals.css with shadcn-template structure
   - Complete rewrite of `src/app/globals.css` (295 → ~130 lines)
   - Add missing `@import "shadcn/tailwind.css"` and `@theme inline`
   - Replace color tokens, remove 130+ lines of studio effects
   - **Est. time**: 30 min

2. **[02-update-ui-components.md](./02-update-ui-components.md)** - Update UI components
   - Update Button (remove `studio`, update `accent`)
   - Update Badge (remove `teal`, `success`, `info`)
   - Update Card (remove custom variants)
   - Update PageContainer (remove `spotlight` prop)
   - **Est. time**: 45 min

3. **[03-refactor-landing-page.md](./03-refactor-landing-page.md)** - Refactor landing page
   - Remove studio effects from hero section
   - Replace gradient text with `text-primary`
   - Convert matte-cards to standard Card components
   - Fix hardcoded button styles
   - **Est. time**: 30 min

4. **[04-refactor-generate-page.md](./04-refactor-generate-page.md)** - Refactor generate page
   - **CRITICAL**: Fix hardcoded `bg-green-600` button (line 259)
   - Update badge variant from `teal` to `outline`
   - Remove any remaining studio effects
   - **Est. time**: 20 min

5. **[05-refactor-remaining-pages.md](./05-refactor-remaining-pages.md)** - Refactor remaining pages
   - Systematic search and replace across all files
   - Update success, auth, batch, pricing components
   - Remove all studio classes and hardcoded colors
   - **Est. time**: 30 min

6. **[06-update-documentation.md](./06-update-documentation.md)** - Update documentation
   - Update CLAUDE.md colors and typography
   - Update docs/design-system.md (remove variants, tokens)
   - Update docs/design-principles.md (remove studio aesthetic)
   - **Est. time**: 20 min

7. **[07-testing-and-validation.md](./07-testing-and-validation.md)** - Testing and validation
   - Build validation (`bun run build`)
   - Visual testing (all pages in dark/light modes)
   - Component tests (update expectations)
   - Cross-browser testing
   - Functionality testing (auth, generation flows)
   - **Est. time**: 45 min

**Total Estimated Time**: 3-3.5 hours

---

## Success Criteria

### Must Have:
- [ ] `bun run build` succeeds with no errors
- [ ] All pages render without console errors
- [ ] Light and dark modes both work correctly
- [ ] No hardcoded colors outside design tokens
- [ ] All interactive elements functional (buttons, forms, links)
- [ ] No references to removed CSS classes (verified via grep)

### Should Have:
- [ ] Component tests pass (after updating test expectations)
- [ ] Visual consistency across all pages
- [ ] Smooth transitions and hover states
- [ ] Proper focus indicators (accessibility maintained)
- [ ] Cross-browser rendering consistency

### Nice to Have:
- [ ] Performance metrics unchanged or improved
- [ ] Documentation screenshots updated
- [ ] Zero console warnings

---

## Execution Instructions

### Prerequisites:
- Working directory: `/home/kevin/coding/product-pix/.worktrees/design`
- Reference template: `/home/kevin/coding/shadcn-template/app/globals.css`
- Git branch: `design` (current) → create `migrate-shadcn-design` for changes

### Execution Flow:

1. **Create Migration Branch**:
   ```bash
   cd /home/kevin/coding/product-pix/.worktrees/design
   git checkout -b migrate-shadcn-design
   ```

2. **Execute Tasks Sequentially** (01 → 07):
   - Each task file contains:
     - Files to modify/create
     - Implementation details with code examples
     - Acceptance criteria
     - Dependencies
     - Validation commands
   - Complete one task fully before moving to next
   - Test at each checkpoint (after tasks 01, 02, 04, 07)

3. **Validation Commands** (run after each task):
   ```bash
   # Build check
   bun run build

   # Visual test (when needed)
   bun run dev
   # Navigate to affected pages
   ```

4. **Final Commit** (after all tasks pass):
   ```bash
   git add -A
   git commit -m "feat: migrate to shadcn-template design system"
   # Test thoroughly before merging
   ```

---

## Rollback Strategy

### Git Checkpoints:

1. **After Task 01** (globals.css):
   - Checkpoint: Foundation replaced
   - Test: `bun run build` succeeds
   - Rollback: `git checkout design -- src/app/globals.css`

2. **After Task 02** (components):
   - Checkpoint: Components updated
   - Test: Pages still render
   - Rollback: `git checkout design -- src/components/`

3. **After Task 04** (generate page):
   - Checkpoint: Critical page fixed
   - Test: Generation flow works
   - Rollback: `git checkout design -- src/app/generate/`

4. **After Task 07** (full testing):
   - Checkpoint: All changes complete
   - Test: Full app walkthrough passes
   - Rollback: `git checkout design && git branch -D migrate-shadcn-design`

### Rollback Triggers:

**Immediate rollback if**:
- Build completely broken
- Core functionality broken (auth, generation, payments)
- 3+ pages have major visual issues

**Fix and continue if**:
- 1-2 pages have styling issues
- Component tests fail (expected - update tests)
- Minor visual inconsistencies

---

## Breaking Changes Summary

### Component API:
- **Button**: `variant="studio"` removed, `variant="accent"` uses primary
- **Badge**: `variant="teal|success|info"` removed
- **PageContainer**: `spotlight` prop removed
- **Card**: Custom variants removed (if existed)

### CSS Classes Removed:
- `.studio-spotlight`, `.studio-gradient-bg`
- `.matte-card`, `.matte-card-hover`
- `.gradient-text-studio`, `.soft-glow-text`
- `.button-studio`, `.ambient-wash*`
- `.text-accent`, `.text-teal`, `.bg-teal*`, `.border-teal`

### Color Tokens Removed:
- `--teal`, `--teal-foreground`
- `--card-hero`, `--card-control`
- Custom `--accent` (replaced by `--primary`)
- Custom `--success`, `--info`

### Visual Impact:
- Background: Blue-charcoal → Gray
- Cards: Matte with gradients → Clean flat
- Buttons: Shine animation → Solid colors
- Hero: Dramatic lighting → Subtle gradients
- Overall: Studio/crypto aesthetic → Clean minimal design

---

## Dependencies

### External:
- shadcn/ui component library (already installed)
- Tailwind v4 CSS-first config
- oklch color space support (modern browsers)

### Internal:
- Figtree, Geist, Geist Mono fonts (already configured)
- ThemeProvider with dark mode (already working)
- Bun as package manager

### Reference Files:
- `/home/kevin/coding/shadcn-template/app/globals.css` - Target structure
- Current ProductPix globals.css - Source to replace

---

## Risk Assessment

### High Risk:
- Hardcoded `bg-green-600` on generate page (line 259) - breaks primary CTA
- Missing `@import "shadcn/tailwind.css"` - could break build
- Variant TypeScript errors - need immediate fix

### Medium Risk:
- Visual regression across pages - requires manual review
- Component test updates - time-consuming but straightforward
- Dark mode color differences - need visual verification

### Low Risk:
- Typography unchanged (already correct)
- Layout structure preserved
- No functional logic affected

---

## Post-Migration Tasks

**After successful migration**:
1. Update screenshots in documentation
2. Notify team of breaking changes (variant removals)
3. Update PR templates to reference new design system
4. Consider updating Storybook (if used)
5. Monitor for visual regression reports from users

**Future Improvements**:
- Consider adopting shadcn blocks for consistent page layouts
- Explore additional shadcn components (Command, Drawer, etc.)
- Document custom component patterns in design-system.md

---

## Support & Questions

**Reference Documentation**:
- shadcn/ui: https://ui.shadcn.com/
- Tailwind v4: https://tailwindcss.com/
- oklch colors: https://oklch.com/

**Key Files**:
- Design system: `docs/design-system.md`
- Design principles: `docs/design-principles.md`
- Project config: `CLAUDE.md`

**Common Issues**:
- Build fails → Check task 01 (globals.css imports)
- Colors look wrong → Verify dark mode toggle
- Buttons broken → Check task 02 (variant updates)
- Tests failing → Expected for removed variants, update tests

---

**Ready to execute**: Begin with task 01 and proceed sequentially through task 07.
