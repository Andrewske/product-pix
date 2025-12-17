# ProductPix Homepage Refactoring with shadcn/ui Components

## Overview

This plan refactors the ProductPix homepage (`src/app/page.tsx`) to leverage shadcn/ui components and extract reusable patterns. The goal is to improve maintainability, consistency with the design system, and code reusability while maintaining the same visual output.

**Key Improvements:**
- Extract 6 reusable components following shadcn/ui composition patterns
- Replace custom implementations with standard shadcn/ui components
- Reduce page.tsx code by 42% (260 → 150 lines)
- Improve testability and accessibility
- Enable component reuse across future pages

**Design Principles:**
- Clean, minimal aesthetics (gray + green theme)
- Responsive mobile-first approach
- Type-safe TypeScript implementations
- Accessibility built-in from shadcn/ui
- No visual changes - pure refactoring

## Task Sequence

1. [01-install-shadcn-components.md](./01-install-shadcn-components.md) - Install missing shadcn/ui components (Separator, NavigationMenu, Sheet, AspectRatio, HoverCard)

2. [02-create-site-header.md](./02-create-site-header.md) - Create responsive SiteHeader component with desktop NavigationMenu and mobile Sheet drawer

3. [03-create-feature-card.md](./03-create-feature-card.md) - Create FeatureCard component with AspectRatio, proper image handling, and hover states

4. [04-create-process-step.md](./04-create-process-step.md) - Create ProcessStep component with numbered badges and visual connectors

5. [05-create-site-footer.md](./05-create-site-footer.md) - Create SiteFooter component with configurable sections and Separator

6. [06-create-hero-section.md](./06-create-hero-section.md) - Create HeroSection component with flexible CTAs, badge, and optional image

7. [07-create-section-header.md](./07-create-section-header.md) - Create SectionHeader component for consistent section titles

8. [08-refactor-homepage.md](./08-refactor-homepage.md) - Refactor page.tsx to use all new components (260 → 150 lines)

9. [09-add-component-tests.md](./09-add-component-tests.md) - Add comprehensive Bun tests for all 6 new components

## Success Criteria

### Code Quality
- [ ] Page.tsx reduced from ~260 to ~150 lines (42% reduction)
- [ ] All 6 components extracted and reusable
- [ ] No TypeScript errors (`any`, unguarded `unknown`, or `!` assertions)
- [ ] Explicit return types on all exported functions
- [ ] Functions ≤20 lines, ≤3 nesting levels

### Functionality
- [ ] Homepage renders identically to before (visual regression check)
- [ ] All navigation links work correctly
- [ ] Mobile responsiveness maintained/improved
- [ ] All hover states and interactions work as expected
- [ ] GetStartedButton integration functional

### Testing
- [ ] 70-80% test coverage for new components
- [ ] All tests use Bun test framework (NOT Jest)
- [ ] Native Bun matchers only (no custom matchers)
- [ ] All tests pass: `bun test`

### Accessibility
- [ ] Keyboard navigation through entire page works
- [ ] Focus states visible on all interactive elements
- [ ] ARIA labels present from shadcn/ui components
- [ ] Screen reader friendly (basic testing)

### Performance
- [ ] Bundle size impact minimal (<5KB increase)
- [ ] No performance regressions
- [ ] Images load correctly with Next.js optimization

## Execution Instructions

1. **Execute tasks in numerical order** (01 → 09)

2. **Each task file contains:**
   - Files to modify/create
   - Implementation details with code examples
   - Acceptance criteria checkboxes
   - Dependencies on previous tasks
   - Usage notes and examples

3. **Verify acceptance criteria** before moving to next task
   - Check off each criterion as completed
   - Run tests after each component creation
   - Verify TypeScript compiles without errors

4. **Testing strategy:**
   - Task 01: Verify components install correctly
   - Tasks 02-07: Manual verification + TypeScript check after each
   - Task 08: Full visual regression + responsive testing
   - Task 09: Automated test suite with 70-80% coverage target

## Dependencies

### External Packages
- `bun` - Package manager (NOT npm/yarn/pnpm)
- `shadcn/ui` - Component library
- `next` - Framework (version 16)
- `@testing-library/react` - Testing utilities (render only)

### shadcn/ui Components to Install
- `separator` - Visual dividers
- `navigation-menu` - Desktop navigation
- `sheet` - Mobile drawer
- `aspect-ratio` - Image containers
- `hover-card` - Optional feature card details

### Existing Components (Already Installed)
- `button` - CTA buttons
- `card` - Card containers
- `badge` - Labels and indicators

### Project Conventions
- **TypeScript configs**: Dual configs (tsconfig.json for CLI, tsconfig.build.json for Next.js)
- **Path aliases**: `@/*` → `./src/*`
- **Styling**: Tailwind v4 (CSS-first, no config file)
- **Fonts**: Figtree (display), Geist (body), Geist Mono (code)
- **Testing**: Bun test with happy-dom (no Jest)

## Component Architecture

### Component Hierarchy
```
Page (src/app/page.tsx)
├── SiteHeader
│   ├── NavigationMenu (desktop)
│   └── Sheet (mobile)
├── HeroSection
│   └── Badge (optional)
├── FeaturesSection
│   ├── SectionHeader
│   └── FeatureCard[]
│       └── AspectRatio + Image
├── HowItWorksSection
│   ├── SectionHeader
│   └── ProcessStep[]
│       └── Badge (numbered)
├── PricingSection (existing)
├── CTASection
└── SiteFooter
    └── Separator
```

### Component Sizes (Estimated)
- SiteHeader: ~80 lines
- FeatureCard: ~50 lines
- ProcessStep: ~25 lines
- SiteFooter: ~90 lines
- HeroSection: ~65 lines
- SectionHeader: ~15 lines
- **Total**: ~325 lines of reusable components

### Net Impact
- **Before**: 260 lines in page.tsx (monolithic)
- **After**: 150 lines in page.tsx + 325 lines in components
- **Trade-off**: Slight increase in total code for massive gain in:
  - Reusability (components used across pages)
  - Testability (isolated component tests)
  - Maintainability (single source of truth)
  - Consistency (design system enforcement)

## Benefits Summary

### Maintainability
- Components update in one place
- Clear separation of concerns
- Self-documenting TypeScript interfaces
- Easier to onboard new developers

### Consistency
- Reusable patterns across pages
- Centralized design system usage
- Uniform spacing and typography
- Consistent hover/focus states

### Performance
- Better code splitting opportunities
- Lazy loading potential
- Reduced bundle duplication
- Tree-shaking friendly

### Developer Experience
- Type-safe props with autocomplete
- Clear component APIs
- Better IDE support
- Easier debugging

### Accessibility
- Built-in ARIA from shadcn/ui
- Proper keyboard navigation
- Screen reader friendly
- Focus management

## Questions for Review

Before starting, consider:

1. **Scope**: Should we extract ALL sections or keep some inline?
2. **Enhancement**: Add HoverCard for feature cards with more details?
3. **Reuse**: Should SiteHeader be shared across all pages?
4. **Responsive**: Need mobile-specific variations for any components?
5. **Documentation**: Should we create Storybook for components?

## Next Steps After Completion

1. **Apply patterns to other pages:**
   - Extract PricingSection to component
   - Create reusable CallToAction component
   - Apply to dashboard, gallery, settings pages

2. **Enhance with additional shadcn/ui:**
   - Add Tooltip for feature explanations
   - Use Dialog for image previews
   - Implement Tabs for pricing tiers

3. **Extend test coverage:**
   - Add integration tests for full page
   - Visual regression tests with Playwright
   - E2E tests for critical user flows

4. **Performance optimization:**
   - Analyze bundle size impact
   - Implement lazy loading for below-fold components
   - Optimize image loading strategy

5. **Documentation:**
   - Create component usage guide
   - Add Storybook stories
   - Document design system patterns

---

**Ready to begin?** Start with [Task 01: Install shadcn Components](./01-install-shadcn-components.md)
