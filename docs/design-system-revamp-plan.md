# Design System Revamp Implementation Plan

## Overview

Apply the "Studio Minimalist" design system from the homepage redesign to all remaining pages in ProductPix. This creates a cohesive visual identity across the entire application.

**Design Philosophy**: Professional photography meets refined digital minimalism - dark, focused, with intentional lighting that draws attention to what matters.

**Reference Document**: `docs/design-system.md` is the canonical source for all design decisions.

## Architecture Decisions

### 1. Reusable Component Strategy
**Decision**: Create wrapper components rather than updating base shadcn/ui components.

**Rationale**:
- Preserves ability to update shadcn/ui independently
- Clear distinction between generic UI and studio-specific patterns
- Easier to understand where studio styling is applied
- Avoids breaking existing component usage

### 2. CSS Class-Based Styling
**Decision**: Use existing CSS utility classes from `globals.css` rather than creating new ones.

**Rationale**:
- Classes already exist (`matte-card`, `studio-spotlight`, `button-studio`, etc.)
- Maintains single source of truth for design tokens
- Smaller bundle size (no duplicate styles)

### 3. Component Composition Pattern
**Decision**: New components wrap existing ones with additional styling/effects.

**Rationale**:
- Maintains shadcn/ui accessibility features
- Composable and flexible
- Easy to extend or modify

---

## Implementation Tasks

### Phase 1: Foundation Components

Create reusable wrapper components that encapsulate design system patterns.

- [x] Create `StudioCard` component
  - Files: `src/components/ui/studio-card.tsx` (new)
  - Tests: `src/components/ui/__tests__/studio-card.test.tsx` (new)
  - Dependencies: None
  - Acceptance:
    - Renders children within matte-card styling
    - `hover` prop adds lift effect
    - `className` prop merges correctly
    - Exports from `src/components/ui/index.ts`

- [x] Create `StudioButton` component
  - Files: `src/components/ui/studio-button.tsx` (new)
  - Tests: `src/components/ui/__tests__/studio-button.test.tsx` (new)
  - Dependencies: `src/components/ui/button.tsx`
  - Acceptance:
    - Extends Button with studio styling
    - Primary variant: inverted colors + shine effect
    - Secondary variant: outline with hover state
    - All Button props pass through

- [x] Create `PageContainer` component
  - Files: `src/components/layout/page-container.tsx` (new)
  - Tests: `src/components/layout/__tests__/page-container.test.tsx` (new)
  - Dependencies: None
  - Acceptance:
    - `spotlight` prop adds studio-spotlight effect
    - `narrow` prop switches to `max-w-5xl`
    - Default: `max-w-6xl mx-auto px-4 py-16`
    - Proper spacing and containment

- [x] Create `SectionHeader` component
  - Files: `src/components/layout/section-header.tsx` (new)
  - Tests: `src/components/layout/__tests__/section-header.test.tsx` (new)
  - Dependencies: None
  - Acceptance:
    - Title uses `text-4xl md:text-5xl font-bold tracking-tight`
    - Optional `subtitle` prop with muted styling
    - Optional `badge` prop for metadata pill
    - Proper semantic HTML (h1, h2 configurable)

- [x] Create `StepIndicator` component for batch wizard
  - Files: `src/components/ui/step-indicator.tsx` (new)
  - Tests: `src/components/ui/__tests__/step-indicator.test.tsx` (new)
  - Dependencies: None
  - Acceptance:
    - Numbered circles with connecting lines
    - Active/completed/pending states
    - Gradient line between steps
    - Responsive layout (horizontal desktop, vertical mobile)

- [x] Export new components from barrel files
  - Files: `src/components/ui/index.ts` (modify), `src/components/layout/index.ts` (modify)
  - Tests: None (import verification)
  - Dependencies: All Phase 1 components
  - Acceptance:
    - All new components exported
    - No circular dependencies

---

### Phase 2: Authentication Pages

Update authentication pages with studio aesthetic for strong first impressions.

- [x] Update Login page
  - Files: `src/app/login/page.tsx` (modify), `src/components/auth/login-form.tsx` (modify)
  - Tests: Visual review (no new tests)
  - Dependencies: Phase 1 components
  - Acceptance:
    - Glass-morphic card: `bg-card/50 backdrop-blur-xl border border-white/10`
    - Subtle `studio-spotlight` background
    - Logo matches header design
    - StudioButton for primary CTA
    - Refined typography

- [x] Update Signup page
  - Files: `src/app/signup/page.tsx` (modify), `src/components/auth/signup-form.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Matches login page styling
    - Consistent spacing and typography
    - StudioButton for primary CTA

- [x] Update Reset Password page
  - Files: `src/app/auth/reset-password/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Same glass-morphic card treatment
    - Consistent with other auth pages

---

### Phase 3: Core App Pages

Update high-traffic pages that users interact with most.

- [x] Update Dashboard page
  - Files: `src/app/dashboard/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - PageContainer with spotlight effect
    - SectionHeader for page title
    - StudioCard for stat cards
    - Image gallery uses matte-card-hover
    - Empty states use refined typography
    - Generous spacing (py-32 for sections)

- [x] Update Dashboard components
  - Files: `src/components/generation/image-gallery.tsx` (modify), `src/components/generation/image-card.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Cards use StudioCard with hover
    - Hover actions properly styled
    - Consistent shadows and borders

- [x] Update Generate page
  - Files: `src/app/generate/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - PageContainer wrapper
    - Upload zone with studio lighting
    - Template cards use StudioCard hover
    - Result display: shadow-2xl, refined borders
    - Loading states with subtle animation
    - Success uses gradient text

- [x] Update Generate components
  - Files: `src/components/generation/generation-result.tsx` (modify), `src/components/generation/generation-loading.tsx` (modify), `src/components/generation/insufficient-credits-modal.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Result card uses StudioCard
    - Loading uses subtle pulse/glow
    - Modal uses glass-morphic styling

- [x] Update Pricing page
  - Files: `src/app/pricing/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - PageContainer with spotlight
    - SectionHeader with badge
    - Featured tier: inverted card (`bg-foreground text-background scale-105`)
    - Standard tiers: StudioCard
    - Section divider between credit packs and subscriptions
    - Bold pricing typography

- [x] Update Pricing components
  - Files: `src/components/pricing/subscription-tiers.tsx` (modify), `src/components/pricing/credit-packs.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Tier cards use StudioCard
    - Featured tier inverted styling
    - StudioButton for CTAs
    - Accent colors for highlights

---

### Phase 4: Batch Pages (Full Redesign)

Comprehensive redesign of batch processing workflow.

- [ ] Update Batch List page
  - Files: `src/app/batch/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - PageContainer wrapper
    - SectionHeader for title
    - StudioCard for batch items
    - Refined status badges
    - Progress bars with accent color

- [ ] Update BatchList component
  - Files: `src/components/batch/batch-list.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - List items use StudioCard hover
    - Status badges refined styling
    - Progress visualization
    - Empty state with proper typography

- [ ] Redesign Batch Creation wizard (Step 1: Upload)
  - Files: `src/app/batch/new/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components, StepIndicator
  - Acceptance:
    - StepIndicator at top
    - Upload zone with dashed border
    - Spotlight effect on drag
    - Clear instructions
    - StudioCard wrapper

- [ ] Redesign Batch Creation wizard (Step 2-4: Configure/Preview/Confirm)
  - Files: `src/app/batch/new/page.tsx` (modify), `src/components/batch/batch-preview.tsx` (modify), `src/components/batch/csv-upload-form.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Each step in StudioCard
    - Preview as card grid (not table)
    - Cost breakdown card with accent
    - Summary sidebar (desktop) or header (mobile)
    - Premium "Start Batch" StudioButton

- [ ] Update Batch Detail page
  - Files: `src/app/batch/[batchId]/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - SectionHeader with batch name
    - Status badge with accent colors
    - Progress visualization
    - Item grid uses matte-card-hover
    - shadow-2xl on image previews

- [ ] Update Batch Detail components
  - Files: `src/components/batch/batch-status.tsx` (modify), `src/components/batch/batch-item-grid.tsx` (modify), `src/components/batch/batch-actions.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Status uses refined badge styling
    - Grid items use StudioCard hover
    - Actions use StudioButton variants

---

### Phase 5: Settings & Utility Pages

- [ ] Update Settings page
  - Files: `src/app/settings/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - PageContainer wrapper
    - Tab styling with subtle borders
    - StudioCard for settings sections

- [ ] Update Settings components
  - Files: `src/components/settings/settings-tabs.tsx` (modify), `src/components/settings/account-tab.tsx` (modify), `src/components/settings/billing-tab.tsx` (modify), `src/components/settings/credits-tab.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Each tab section in StudioCard
    - Section dividers between groups
    - Form inputs with refined styling
    - StudioButton for actions

- [ ] Update Success page
  - Files: `src/app/success/page.tsx` (modify)
  - Tests: Visual review
  - Dependencies: Phase 1 components
  - Acceptance:
    - Subtle success animation
    - Gradient text for message
    - Consistent loading state

---

### Phase 6: Shared Components & Polish

- [ ] Verify Header consistency
  - Files: `src/components/layout/header.tsx` (modify if needed)
  - Tests: Visual review
  - Dependencies: None
  - Acceptance:
    - Matches design system header pattern
    - Logo treatment consistent
    - Nav hover states use transition-colors
    - Credits badge styled properly

- [ ] Update Footer
  - Files: `src/components/layout/footer.tsx` (modify)
  - Tests: Visual review
  - Dependencies: None
  - Acceptance:
    - Muted typography
    - Section divider above footer
    - Link colors: text-muted-foreground hover:text-foreground

- [ ] Standardize empty states
  - Files: `src/components/ui/empty.tsx` (modify if exists, or create)
  - Tests: Visual review
  - Dependencies: None
  - Acceptance:
    - Consistent typography
    - Subtle icons with text-muted-foreground
    - Proper spacing

- [ ] Standardize loading states
  - Files: Various component files
  - Tests: Visual review
  - Dependencies: None
  - Acceptance:
    - Consistent skeleton styling
    - Subtle pulse animations
    - Proper sizing

---

## Acceptance Criteria

### Visual Quality
- [ ] All pages use studio-minimalist dark theme
- [ ] Consistent typography scale across pages
- [ ] Matte card surfaces (no glossy/reflective)
- [ ] Subtle animations and transitions
- [ ] Generous whitespace (py-32 for sections)

### Technical Quality
- [ ] No TypeScript errors (`bun build` passes)
- [ ] No ESLint errors (`bun lint` passes)
- [ ] All existing tests pass (`bun test`)
- [ ] No console errors in browser
- [ ] Responsive on mobile, tablet, desktop

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] Focus states visible
- [ ] Proper heading hierarchy
- [ ] Interactive elements keyboard accessible

---

## Files Summary

### New Files (6)
```
src/components/ui/studio-card.tsx
src/components/ui/studio-button.tsx
src/components/ui/step-indicator.tsx
src/components/ui/__tests__/studio-card.test.tsx
src/components/ui/__tests__/studio-button.test.tsx
src/components/ui/__tests__/step-indicator.test.tsx
src/components/layout/page-container.tsx
src/components/layout/section-header.tsx
src/components/layout/__tests__/page-container.test.tsx
src/components/layout/__tests__/section-header.test.tsx
```

### Modified Files (~30)
```
# Pages (11)
src/app/login/page.tsx
src/app/signup/page.tsx
src/app/auth/reset-password/page.tsx
src/app/dashboard/page.tsx
src/app/generate/page.tsx
src/app/pricing/page.tsx
src/app/batch/page.tsx
src/app/batch/new/page.tsx
src/app/batch/[batchId]/page.tsx
src/app/settings/page.tsx
src/app/success/page.tsx

# Auth Components (2)
src/components/auth/login-form.tsx
src/components/auth/signup-form.tsx

# Generation Components (4)
src/components/generation/image-gallery.tsx
src/components/generation/image-card.tsx
src/components/generation/generation-result.tsx
src/components/generation/generation-loading.tsx
src/components/generation/insufficient-credits-modal.tsx

# Batch Components (6)
src/components/batch/batch-list.tsx
src/components/batch/batch-preview.tsx
src/components/batch/batch-status.tsx
src/components/batch/batch-item-grid.tsx
src/components/batch/batch-actions.tsx
src/components/batch/csv-upload-form.tsx

# Pricing Components (2)
src/components/pricing/subscription-tiers.tsx
src/components/pricing/credit-packs.tsx

# Settings Components (4)
src/components/settings/settings-tabs.tsx
src/components/settings/account-tab.tsx
src/components/settings/billing-tab.tsx
src/components/settings/credits-tab.tsx

# Layout Components (2)
src/components/layout/header.tsx
src/components/layout/footer.tsx

# Barrel Exports (2)
src/components/ui/index.ts
src/components/layout/index.ts
```

---

## Dependencies

### External (already installed)
- `tailwindcss` v4 - CSS framework
- `class-variance-authority` - Variant styling
- `lucide-react` - Icons
- `next-themes` - Theme provider

### Internal
- `docs/design-system.md` - Design reference
- `src/app/globals.css` - CSS custom properties and utility classes

### Task Dependencies
```
Phase 1 (Foundation) → Phase 2-5 (all pages depend on foundation components)
Phase 2 (Auth) → independent, can run parallel with Phase 3
Phase 3 (Core) → independent, can run parallel with Phase 2
Phase 4 (Batch) → depends on StepIndicator from Phase 1
Phase 5 (Settings) → independent
Phase 6 (Polish) → after all pages updated
```

---

## Verification Commands

```bash
# Type checking
bun build

# Linting
bun lint

# Tests
bun test

# Dev server for visual review
bun dev
```
