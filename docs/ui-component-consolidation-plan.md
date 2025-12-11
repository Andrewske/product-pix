# UI Component Consolidation Plan

## Overview

Consolidate duplicate UI components (StudioCard, StudioButton, LoadingSpinner) into unified variant-based implementations. Clean up unused components and fix code review issues identified in the design system revamp.

## Architecture Decisions

1. **Variant-based consolidation over wrapper components**: Use CVA (class-variance-authority) variants instead of maintaining separate wrapper components. This aligns with shadcn/ui patterns and reduces indirection.

2. **CSS border spinner over Lucide icon**: The CSS `border-t` spinner is more customizable and matches the design system colors (`border-t-accent`).

3. **Keep EmptyState, delete Empty compounds**: EmptyState has 1 usage and is simpler. Empty compound components have 0 usage and add unnecessary complexity.

4. **Placeholder pages for footer links**: Create minimal placeholder pages instead of disabled spans or removing links entirely.

## Implementation Tasks

### Phase 1: Button Consolidation

- [ ] Add `studio` variant and `xl` size to Button component
  - Files: `src/components/ui/button.tsx` (modify)
  - Changes:
    - Add to variants: `studio: 'bg-foreground text-background hover:bg-foreground/90 shadow-xl hover:shadow-2xl button-studio'`
    - Add to sizes: `xl: 'h-14 rounded-md px-8 text-lg has-[>svg]:px-6'`
  - Tests: Verify existing button tests still pass
  - Acceptance: `<Button variant="studio" size="xl">` renders correctly

- [ ] Migrate login-form to use Button with studio variant
  - Files: `src/components/auth/login-form.tsx` (modify)
  - Changes: Replace `<StudioButton>` with `<Button variant="studio" size="xl">`
  - Acceptance: Login form renders identically, form submission works

- [ ] Migrate signup-form to use Button with studio variant
  - Files: `src/components/auth/signup-form.tsx` (modify)
  - Changes: Replace `<StudioButton>` with `<Button variant="studio" size="xl">`
  - Acceptance: Signup form renders identically

- [ ] Migrate account-tab to use Button with studio variant
  - Files: `src/components/settings/account-tab.tsx` (modify)
  - Changes:
    - Primary: `<Button variant="studio" size="xl">`
    - Secondary: `<Button variant="outline" size="xl">`
  - Acceptance: Settings account tab renders correctly

- [ ] Migrate batch-actions to use Button with studio variant
  - Files: `src/components/batch/batch-actions.tsx` (modify)
  - Changes: Replace `<StudioButton studioVariant="secondary">` with `<Button variant="outline" size="xl">`
  - Acceptance: Cancel batch button works correctly

- [ ] Migrate batch-preview to use Button with studio variant
  - Files: `src/components/batch/batch-preview.tsx` (modify)
  - Changes: Replace both StudioButton usages with appropriate Button variants
  - Acceptance: Batch preview actions work correctly

- [ ] Migrate subscription-tiers to use Button with studio variant
  - Files: `src/components/pricing/subscription-tiers.tsx` (modify)
  - Changes: Replace conditional StudioButton with conditional Button variant
  - Acceptance: Subscribe buttons work, checkout flow unaffected

- [ ] Migrate credit-packs to use Button with studio variant
  - Files: `src/components/pricing/credit-packs.tsx` (modify)
  - Changes: Replace conditional StudioButton with conditional Button variant
  - Acceptance: Purchase buttons work, checkout flow unaffected

- [ ] Update StudioButton tests for Button studio variant
  - Files: `src/components/ui/__tests__/studio-button.test.tsx` (modify → rename to button-studio.test.tsx or merge)
  - Changes: Update tests to test `<Button variant="studio">` instead of StudioButton
  - Acceptance: All tests pass

- [ ] Delete StudioButton component
  - Files:
    - `src/components/ui/studio-button.tsx` (delete)
    - `src/components/ui/index.ts` (modify - remove export)
  - Acceptance: No references to StudioButton remain, build passes

### Phase 2: Card Consolidation

- [ ] Add `studio` variant and `hover` prop to Card component
  - Files: `src/components/ui/card.tsx` (modify)
  - Changes:
    ```typescript
    import { cva, type VariantProps } from 'class-variance-authority'

    const cardVariants = cva('', {
      variants: {
        variant: {
          default: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
          studio: 'matte-card rounded-2xl overflow-hidden',
        },
        hover: { true: '', false: '' },
      },
      compoundVariants: [
        { variant: 'studio', hover: true, className: 'matte-card-hover' },
      ],
      defaultVariants: { variant: 'default', hover: false },
    })
    ```
  - Tests: Verify existing Card compound components still work
  - Acceptance: `<Card variant="studio" hover>` renders with matte-card styles

- [ ] Migrate batch/new/page.tsx to use Card with studio variant (4 usages)
  - Files: `src/app/batch/new/page.tsx` (modify)
  - Changes: Replace all `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Batch creation wizard renders correctly

- [ ] Migrate dashboard/page.tsx to use Card with studio variant
  - Files: `src/app/dashboard/page.tsx` (modify)
  - Changes: Replace `<StudioCard hover>` with `<Card variant="studio" hover>`
  - Acceptance: Dashboard batch cards render with hover effect

- [ ] Migrate signup/page.tsx to use Card with studio variant
  - Files: `src/app/signup/page.tsx` (modify)
  - Changes: Replace `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Signup page container renders correctly

- [ ] Migrate success-display.tsx to use Card with studio variant
  - Files: `src/app/success/success-display.tsx` (modify)
  - Changes: Replace `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Success page renders correctly

- [ ] Migrate batch-list.tsx to use Card with studio variant
  - Files: `src/components/batch/batch-list.tsx` (modify)
  - Changes: Replace `<StudioCard hover>` with `<Card variant="studio" hover>`
  - Acceptance: Batch list items render with hover effect

- [ ] Migrate batch-preview.tsx to use Card with studio variant
  - Files: `src/components/batch/batch-preview.tsx` (modify)
  - Changes: Replace `<StudioCard>` usages with `<Card variant="studio">`
  - Acceptance: Batch preview renders correctly

- [ ] Migrate batch-item-grid.tsx to use Card with studio variant
  - Files: `src/components/batch/batch-item-grid.tsx` (modify)
  - Changes: Replace `<StudioCard hover>` with `<Card variant="studio" hover>`
  - Acceptance: Batch item grid renders with hover effect

- [ ] Migrate generation-loading.tsx to use Card with studio variant
  - Files: `src/components/generation-loading.tsx` (modify)
  - Changes: Replace `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Loading state renders correctly

- [ ] Migrate generation-result.tsx to use Card with studio variant
  - Files: `src/components/generation-result.tsx` (modify)
  - Changes: Replace `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Generation result renders correctly

- [ ] Migrate image-card.tsx to use Card with studio variant
  - Files: `src/components/image-card.tsx` (modify)
  - Changes: Replace `<StudioCard hover>` with `<Card variant="studio" hover>`
  - Acceptance: Image cards render with hover effect

- [ ] Migrate subscription-tiers.tsx to use Card with studio variant
  - Files: `src/components/pricing/subscription-tiers.tsx` (modify)
  - Changes: Replace `<StudioCard>` with conditional `<Card variant="studio" hover={...}>`
  - Acceptance: Pricing tiers render correctly

- [ ] Migrate credit-packs.tsx to use Card with studio variant
  - Files: `src/components/pricing/credit-packs.tsx` (modify)
  - Changes: Replace `<StudioCard hover>` with `<Card variant="studio" hover>`
  - Acceptance: Credit pack cards render correctly

- [ ] Migrate account-tab.tsx to use Card with studio variant
  - Files: `src/components/settings/account-tab.tsx` (modify)
  - Changes: Replace `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Account settings render correctly

- [ ] Migrate billing-tab.tsx to use Card with studio variant
  - Files: `src/components/settings/billing-tab.tsx` (modify)
  - Changes: Replace `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Billing settings render correctly

- [ ] Migrate credits-tab.tsx to use Card with studio variant (4 usages)
  - Files: `src/components/settings/credits-tab.tsx` (modify)
  - Changes: Replace all `<StudioCard>` with `<Card variant="studio">`
  - Acceptance: Credits history renders correctly

- [ ] Update StudioCard tests for Card studio variant
  - Files: `src/components/ui/__tests__/studio-card.test.tsx` (modify)
  - Changes: Update tests to test `<Card variant="studio">` instead of StudioCard
  - Acceptance: All tests pass

- [ ] Delete StudioCard component
  - Files:
    - `src/components/ui/studio-card.tsx` (delete)
    - `src/components/ui/index.ts` (modify - remove export)
  - Acceptance: No references to StudioCard remain, build passes

### Phase 3: Spinner Consolidation

- [ ] Rewrite Spinner component with CSS border approach and size variants
  - Files: `src/components/ui/spinner.tsx` (modify)
  - Changes:
    ```typescript
    import { cva, type VariantProps } from 'class-variance-authority'
    import { cn } from '@/lib/utils'

    const spinnerVariants = cva(
      'animate-spin rounded-full border-2 border-muted border-t-accent',
      {
        variants: {
          size: {
            sm: 'h-4 w-4',
            md: 'h-6 w-6',
            lg: 'h-8 w-8',
          },
        },
        defaultVariants: { size: 'md' },
      }
    )

    interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>,
      VariantProps<typeof spinnerVariants> {
      centered?: boolean
    }

    function Spinner({ size, centered = false, className, ...props }: SpinnerProps): React.ReactElement {
      const spinner = (
        <div
          className={cn(spinnerVariants({ size, className }))}
          role="status"
          aria-label="Loading"
          {...props}
        />
      )
      return centered ? <div className="flex items-center justify-center">{spinner}</div> : spinner
    }

    export { Spinner, spinnerVariants }
    ```
  - Tests: Add basic render tests
  - Acceptance: Spinner renders with correct sizes

- [ ] Migrate settings/page.tsx to use new Spinner
  - Files: `src/app/settings/page.tsx` (modify)
  - Changes: Replace `<LoadingSpinner size="lg" />` with `<Spinner size="lg" centered />`
  - Acceptance: Settings page loading state renders correctly

- [ ] Migrate batch-list.tsx to use new Spinner
  - Files: `src/components/batch/batch-list.tsx` (modify)
  - Changes: Replace `<LoadingSpinner size="lg" />` with `<Spinner size="lg" centered />`
  - Acceptance: Batch list loading state renders correctly

- [ ] Migrate csv-upload-form.tsx to use new Spinner
  - Files: `src/components/batch/csv-upload-form.tsx` (modify)
  - Changes: Replace `<LoadingSpinner size="md" />` with `<Spinner size="md" centered />`
  - Acceptance: CSV upload loading state renders correctly

- [ ] Migrate template-selector.tsx to use new Spinner
  - Files: `src/components/forms/template-selector.tsx` (modify)
  - Changes: Replace `<LoadingSpinner size="md" />` with `<Spinner size="md" centered />`
  - Acceptance: Template selector loading state renders correctly

- [ ] Migrate insufficient-credits-modal.tsx to use new Spinner
  - Files: `src/components/generation/insufficient-credits-modal.tsx` (modify)
  - Changes: Replace `<LoadingSpinner size="sm" />` with `<Spinner size="sm" />`
  - Acceptance: Modal loading state renders correctly

- [ ] Migrate generation-loading.tsx to use new Spinner
  - Files: `src/components/generation-loading.tsx` (modify)
  - Changes: Replace `<Spinner className="size-8" />` with `<Spinner size="lg" />`
  - Acceptance: Generation loading state renders correctly

- [ ] Migrate success-display.tsx to use new Spinner
  - Files: `src/app/success/success-display.tsx` (modify)
  - Changes: Replace `<Spinner className="size-6" />` with `<Spinner size="md" />`
  - Acceptance: Success page redirecting state renders correctly

- [ ] Delete LoadingSpinner component
  - Files:
    - `src/components/ui/loading-spinner.tsx` (delete)
    - `src/components/ui/index.ts` (modify - remove export)
  - Acceptance: No references to LoadingSpinner remain, build passes

### Phase 4: Cleanup and Fixes

- [ ] Delete unused Empty compound components
  - Files: `src/components/ui/empty.tsx` (delete)
  - Acceptance: Build passes, no broken imports

- [ ] Create Terms placeholder page
  - Files: `src/app/terms/page.tsx` (new)
  - Content: Simple page with "Terms of Service - Coming Soon" message
  - Acceptance: `/terms` route loads correctly

- [ ] Create Privacy placeholder page
  - Files: `src/app/privacy/page.tsx` (new)
  - Content: Simple page with "Privacy Policy - Coming Soon" message
  - Acceptance: `/privacy` route loads correctly

- [ ] Create Contact placeholder page
  - Files: `src/app/contact/page.tsx` (new)
  - Content: Simple page with "Contact - Coming Soon" message
  - Acceptance: `/contact` route loads correctly

- [ ] Update footer with real links
  - Files: `src/components/layout/footer.tsx` (modify)
  - Changes: Replace `href="#"` with proper Next.js Links to `/terms`, `/privacy`, `/contact`
  - Acceptance: Footer links navigate to correct pages

- [ ] Fix duplicate credits calculation in batch/new
  - Files: `src/app/batch/new/page.tsx` (modify)
  - Changes: Remove duplicate `creditsPerItem` and `totalCredits` calculation (lines 88-92), keep only lines 40-44
  - Acceptance: Credits calculation still works correctly

- [ ] Add StepIndicator to barrel exports
  - Files: `src/components/ui/index.ts` (modify)
  - Changes: Add `export { StepIndicator } from "./step-indicator"`
  - Acceptance: StepIndicator can be imported from '@/components/ui'

- [ ] Update barrel exports - final cleanup
  - Files: `src/components/ui/index.ts` (modify)
  - Changes:
    - Ensure Spinner export includes spinnerVariants
    - Remove any remaining Studio* exports
    - Remove LoadingSpinner export
  - Acceptance: All imports work, no broken references

- [ ] Delete obsolete test files
  - Files:
    - `src/components/ui/__tests__/studio-button.test.tsx` (delete if not already merged)
    - `src/components/ui/__tests__/studio-card.test.tsx` (delete if not already merged)
  - Acceptance: Test suite passes

## Acceptance Criteria

- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun build` succeeds)
- [ ] No references to deleted components (StudioCard, StudioButton, LoadingSpinner)
- [ ] Visual regression: UI renders identically before and after
- [ ] All checkout flows work (Stripe integration unaffected)
- [ ] All forms submit correctly

## Files Summary

### Files to Create (3)
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/contact/page.tsx`

### Files to Delete (6)
- `src/components/ui/studio-button.tsx`
- `src/components/ui/studio-card.tsx`
- `src/components/ui/loading-spinner.tsx`
- `src/components/ui/empty.tsx`
- `src/components/ui/__tests__/studio-button.test.tsx`
- `src/components/ui/__tests__/studio-card.test.tsx`

### Core Component Modifications (4)
- `src/components/ui/button.tsx` - add studio variant + xl size
- `src/components/ui/card.tsx` - add studio variant + hover prop
- `src/components/ui/spinner.tsx` - rewrite with CSS approach + sizes
- `src/components/ui/index.ts` - update exports

### Migration Files (22)
- `src/app/batch/new/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/success/success-display.tsx`
- `src/components/auth/login-form.tsx`
- `src/components/auth/signup-form.tsx`
- `src/components/batch/batch-actions.tsx`
- `src/components/batch/batch-item-grid.tsx`
- `src/components/batch/batch-list.tsx`
- `src/components/batch/batch-preview.tsx`
- `src/components/batch/csv-upload-form.tsx`
- `src/components/forms/template-selector.tsx`
- `src/components/generation-loading.tsx`
- `src/components/generation-result.tsx`
- `src/components/generation/insufficient-credits-modal.tsx`
- `src/components/image-card.tsx`
- `src/components/layout/footer.tsx`
- `src/components/pricing/credit-packs.tsx`
- `src/components/pricing/subscription-tiers.tsx`
- `src/components/settings/account-tab.tsx`
- `src/components/settings/billing-tab.tsx`
- `src/components/settings/credits-tab.tsx`

## Dependencies

- `class-variance-authority` - already installed (used by Button)
- No new external dependencies required

## Task Dependencies

```
Phase 1 (Button) → Phase 2 (Card) → Phase 3 (Spinner) → Phase 4 (Cleanup)
                                                              ↓
                                              Run tests + build after each phase
```

Each phase can only start after the previous phase completes to avoid import conflicts.
