# ProductPix Component Reduction & Reusability Implementation Plan

## Overview

Reduce code duplication across ProductPix by creating 8 reusable components that enforce design system consistency. This plan eliminates ~615 lines of duplicated code while standardizing the auth experience, legal pages, form patterns, and pricing displays.

**User Requirements**:
- Balance visual consistency with easier maintenance
- Keep shadcn/ui as foundation
- Completely redesign auth experience (login/signup)
- Make legal pages (terms/privacy) data-driven templates

**Expected Impact**: 615+ lines reduced, 8 new reusable components, consistent design system enforcement

---

## Architecture Decisions

### Decision 1: Component Composition Over Inheritance
**Rationale**: Use compound components (AuthLayout wraps children, LegalPageTemplate accepts sections array) rather than inheritance. Aligns with React patterns and shadcn/ui approach.

### Decision 2: CVA for Variant Management
**Rationale**: Use `class-variance-authority` for component variants (StatusBadge, AlertBox) to ensure type safety and consistent styling patterns across the codebase.

### Decision 3: Data-Driven Legal Pages
**Rationale**: Extract terms/privacy content into structured data rather than maintaining duplicate markup. Reduces maintenance burden and ensures consistency.

### Decision 4: Preserve Existing shadcn/ui Components
**Rationale**: Build on existing 59 shadcn/ui primitives (Button, Card, Input, etc.) rather than replacing them. FormField wraps Label + Input, AuthLayout uses Card component.

### Decision 5: Auth Experience Complete Redesign
**Rationale**: Fix inconsistencies (login vs signup styling, title sizes) by creating unified AuthLayout rather than incremental fixes. Ensures future consistency.

---

## Implementation Tasks

### Phase 1: Foundation Components

#### Task 1.1: Create AlertBox Component
- [ ] Create AlertBox component with error/success/info/warning variants
  - **Files**:
    - `src/components/ui/alert-box.tsx` (new)
    - `src/components/ui/__tests__/alert-box.test.tsx` (new)
  - **Tests**: Unit tests for all 4 variants, verify styling matches design system
  - **Acceptance**:
    - All variants render with correct bg/border/text colors
    - Optional title prop displays correctly
    - Component is fully typed (no `any`)

#### Task 1.2: Create AuthDivider Component
- [ ] Create AuthDivider component for "Or continue with email" pattern
  - **Files**:
    - `src/components/auth/auth-divider.tsx` (new)
    - `src/components/auth/__tests__/auth-divider.test.tsx` (new)
  - **Tests**: Unit test for default text and custom text prop
  - **Acceptance**:
    - Renders horizontal line with centered text
    - Default text is "Or continue with email"
    - Custom text prop works

#### Task 1.3: Create FormField Component
- [ ] Create FormField component combining Label + Input + Error
  - **Files**:
    - `src/components/forms/form-field.tsx` (new)
    - `src/components/forms/__tests__/form-field.test.tsx` (new)
    - `src/components/forms/index.ts` (modify - add export)
  - **Tests**: Unit tests for label, input, error display, required state
  - **Acceptance**:
    - Wraps existing Label and Input components
    - Error state displays with destructive styling
    - Consistent spacing (space-y-2)
    - All input props forwarded correctly
    - TypeScript types fully defined

---

### Phase 2: Auth Experience Redesign

#### Task 2.1: Create AuthLayout Component
- [ ] Create unified AuthLayout wrapper for auth pages
  - **Files**:
    - `src/components/auth/auth-layout.tsx` (new)
    - `src/components/auth/__tests__/auth-layout.test.tsx` (new)
    - `src/components/auth/index.ts` (modify - add export)
  - **Dependencies**: AlertBox, AuthDivider from Phase 1
  - **Tests**: Unit tests for error display, spotlight variant, footer slot
  - **Acceptance**:
    - Uses Card with variant="studio"
    - Title is text-3xl (not text-xl)
    - Optional error prop displays AlertBox
    - Spotlight background renders when showSpotlight=true
    - Footer slot renders navigation links

#### Task 2.2: Refactor LoginForm to Use FormField
- [ ] Replace inline Label + Input with FormField in LoginForm
  - **Files**:
    - `src/components/auth/login-form.tsx` (modify)
  - **Dependencies**: FormField from Phase 1
  - **Tests**: Integration test for login flow
  - **Acceptance**:
    - Email and password fields use FormField
    - Error handling unchanged
    - Form submission works
    - ~20 lines removed

#### Task 2.3: Refactor SignupForm to Use FormField
- [ ] Replace inline Label + Input with FormField in SignupForm
  - **Files**:
    - `src/components/auth/signup-form.tsx` (modify)
  - **Dependencies**: FormField from Phase 1
  - **Tests**: Integration test for signup flow
  - **Acceptance**:
    - Email, password, and confirm password fields use FormField
    - Validation logic unchanged
    - Success state rendering unchanged
    - ~25 lines removed

#### Task 2.4: Refactor Login Page with AuthLayout
- [ ] Migrate login page to use AuthLayout
  - **Files**:
    - `src/app/login/page.tsx` (modify)
  - **Dependencies**: AuthLayout, AlertBox, AuthDivider from Phase 1-2
  - **Tests**: E2E test for login flow, visual regression test
  - **Acceptance**:
    - Uses AuthLayout wrapper
    - Error param displays via AuthLayout error prop
    - Divider uses AuthDivider component
    - Card styling is variant="studio" (not inline classes)
    - Title is text-3xl
    - ~35 lines removed
    - Visual appearance matches current design

#### Task 2.5: Refactor Signup Page with AuthLayout
- [ ] Migrate signup page to use AuthLayout
  - **Files**:
    - `src/app/signup/page.tsx` (modify)
  - **Dependencies**: AuthLayout, AuthDivider from Phase 1-2
  - **Tests**: E2E test for signup flow, visual regression test
  - **Acceptance**:
    - Uses AuthLayout wrapper
    - Consistent with login page styling
    - ~35 lines removed
    - Visual appearance matches current design

---

### Phase 3: Status & Display Components

#### Task 3.1: Create StatusBadge Component
- [ ] Create StatusBadge with CVA variants for pending/processing/completed/failed/cancelled
  - **Files**:
    - `src/components/ui/status-badge.tsx` (new)
    - `src/components/ui/__tests__/status-badge.test.tsx` (new)
  - **Tests**: Unit tests for all 5 status variants
  - **Acceptance**:
    - pending → info variant (bg-info/10, text-info, border-info/30)
    - processing → accent variant (bg-accent/10, text-accent, border-accent/30)
    - completed → success variant (bg-success/10, text-success, border-success/30)
    - failed → destructive variant (bg-destructive/10, text-destructive, border-destructive/30)
    - cancelled → muted (bg-muted, text-muted-foreground, border-muted)
    - Colors match existing hardcoded values exactly

#### Task 3.2: Create TableOfContents Component
- [ ] Create auto-generated TOC for legal/documentation pages
  - **Files**:
    - `src/components/ui/table-of-contents.tsx` (new)
    - `src/components/ui/__tests__/table-of-contents.test.tsx` (new)
  - **Tests**: Unit test for rendering, click navigation test
  - **Acceptance**:
    - Renders numbered list (list-decimal)
    - Hover effects on links
    - Card styling (bg-card, rounded-lg, border)
    - Smooth scroll to anchors

#### Task 3.3: Refactor Dashboard to Use StatusBadge
- [ ] Replace hardcoded statusStyles object with StatusBadge component
  - **Files**:
    - `src/app/dashboard/page.tsx` (modify)
  - **Dependencies**: StatusBadge from Task 3.1
  - **Tests**: Visual regression test for batch status display
  - **Acceptance**:
    - statusStyles object removed
    - StatusBadge component used for batch.status
    - Colors match existing exactly
    - ~25 lines removed

---

### Phase 4: Legal Page Templates

#### Task 4.1: Create LegalPageTemplate Component
- [ ] Create data-driven template for legal pages
  - **Files**:
    - `src/components/legal/legal-page-template.tsx` (new)
    - `src/components/legal/__tests__/legal-page-template.test.tsx` (new)
    - `src/components/legal/index.ts` (new - barrel export)
  - **Dependencies**: TableOfContents from Phase 3, PageContainer (existing)
  - **Tests**: Unit tests for TOC generation, section rendering, scroll anchors
  - **Acceptance**:
    - Auto-generates TOC from sections array
    - Scroll anchors work (scroll-mt-8)
    - Typography hierarchy: h1 (4xl), h2 (2xl), h3 (xl)
    - PageContainer with narrow prop
    - Footer with related links
    - Fully typed interface for sections

#### Task 4.2: Extract Terms Content to Data Structure
- [ ] Convert terms page content to structured data
  - **Files**:
    - `src/data/legal/terms-content.tsx` (new)
  - **Tests**: Content validation test (verify all 12 sections present)
  - **Acceptance**:
    - All 12 sections extracted to LegalSection[] array
    - Subsections included where applicable
    - Content matches existing terms.tsx exactly
    - Proper React.ReactNode types for content

#### Task 4.3: Refactor Terms Page with LegalPageTemplate
- [ ] Migrate terms page to use LegalPageTemplate
  - **Files**:
    - `src/app/terms/page.tsx` (modify)
  - **Dependencies**: LegalPageTemplate, terms-content from Phase 4
  - **Tests**: Visual regression test, scroll anchor test, content parity test
  - **Acceptance**:
    - Uses LegalPageTemplate component
    - Imports TERMS_SECTIONS from data file
    - ~220 lines removed from page file
    - Visual appearance matches current
    - All scroll anchors work
    - TOC navigation functional

#### Task 4.4: Extract Privacy Content to Data Structure
- [ ] Convert privacy page content to structured data
  - **Files**:
    - `src/data/legal/privacy-content.tsx` (new)
  - **Tests**: Content validation test (verify all 11 sections present)
  - **Acceptance**:
    - All 11 sections extracted to LegalSection[] array
    - Table structure preserved in content
    - Content matches existing privacy.tsx exactly
    - Proper React.ReactNode types for content

#### Task 4.5: Refactor Privacy Page with LegalPageTemplate
- [ ] Migrate privacy page to use LegalPageTemplate
  - **Files**:
    - `src/app/privacy/page.tsx` (modify)
  - **Dependencies**: LegalPageTemplate, privacy-content from Phase 4
  - **Tests**: Visual regression test, scroll anchor test, content parity test
  - **Acceptance**:
    - Uses LegalPageTemplate component
    - Imports PRIVACY_SECTIONS from data file
    - Table renders correctly
    - ~220 lines removed from page file
    - Visual appearance matches current
    - All scroll anchors work

---

### Phase 5: Pricing Unification

#### Task 5.1: Create PricingCard Component
- [ ] Extract pricing card pattern from home + CreditPacks
  - **Files**:
    - `src/components/pricing/pricing-card.tsx` (new)
    - `src/components/pricing/__tests__/pricing-card.test.tsx` (new)
    - `src/components/pricing/index.ts` (modify - add export)
  - **Dependencies**: Card (existing), Button (existing)
  - **Tests**: Unit tests for featured/default variants, loading state, click handler
  - **Acceptance**:
    - Featured variant: bg-foreground, text-background, scale-105, shadow-2xl
    - Default variant: bg-card, border, hover effects
    - Button styling adapts to featured state
    - Loading state disables button and shows "Creating..."
    - Consistent typography (title: 2xl, price: 3xl)

#### Task 5.2: Refactor CreditPacks to Use PricingCard
- [ ] Replace inline card markup with PricingCard component
  - **Files**:
    - `src/components/pricing/credit-packs.tsx` (modify)
  - **Dependencies**: PricingCard from Task 5.1
  - **Tests**: Integration test for Stripe checkout flow
  - **Acceptance**:
    - Uses PricingCard for each pack
    - Featured logic preserved (pack_200)
    - Price formatting functions removed (moved to PricingCard)
    - Checkout flow unchanged
    - ~40 lines removed

#### Task 5.3: Refactor Home Page Pricing Section
- [ ] Replace inline pricing cards with PricingCard component
  - **Files**:
    - `src/app/page.tsx` (modify)
  - **Dependencies**: PricingCard from Task 5.1
  - **Tests**: Visual regression test for pricing section
  - **Acceptance**:
    - Uses PricingCard for each pack
    - Featured styling preserved
    - ~40 lines removed
    - Visual appearance matches current

---

## Acceptance Criteria

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No `any` types introduced
- [ ] All new components follow existing naming conventions (kebab-case files, PascalCase components)
- [ ] All components use CVA for variants where applicable
- [ ] Consistent import patterns (absolute paths with `@/*` aliases)

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Visual regression tests show no unintended changes
- [ ] Test coverage ≥70% for new components

### Design System
- [ ] Auth title size standardized to text-3xl
- [ ] Card variant usage standardized (variant="studio" for auth)
- [ ] Status colors centralized in StatusBadge CVA variants
- [ ] Alert boxes use consistent variant patterns
- [ ] Typography scale consistent across pages
- [ ] Spacing patterns preserved (space-y-4, space-y-2, py-16, mb-12)

### Functionality
- [ ] All existing functionality preserved
- [ ] Auth flows (login, signup, Google OAuth) work unchanged
- [ ] Legal page scroll anchors work
- [ ] Pricing checkout flow works unchanged
- [ ] Dashboard status badges display correctly
- [ ] Form validation unchanged
- [ ] Error/success messages display correctly

### Code Reduction
- [ ] Auth pages: ~70 lines reduced
- [ ] Legal pages: ~440 lines reduced (220 per page)
- [ ] Form inputs: ~80 lines reduced
- [ ] Alert boxes: ~48 lines reduced
- [ ] Pricing cards: ~80 lines reduced
- [ ] Status badges: ~25 lines reduced
- [ ] Dividers: ~18 lines reduced
- [ ] TOC: ~30 lines reduced
- [ ] **Total: ≥615 lines reduced**

---

## Files to Create/Modify

### New Component Files (8 components, 16 files)
1. `src/components/ui/alert-box.tsx`
2. `src/components/ui/__tests__/alert-box.test.tsx`
3. `src/components/auth/auth-divider.tsx`
4. `src/components/auth/__tests__/auth-divider.test.tsx`
5. `src/components/forms/form-field.tsx`
6. `src/components/forms/__tests__/form-field.test.tsx`
7. `src/components/auth/auth-layout.tsx`
8. `src/components/auth/__tests__/auth-layout.test.tsx`
9. `src/components/ui/status-badge.tsx`
10. `src/components/ui/__tests__/status-badge.test.tsx`
11. `src/components/ui/table-of-contents.tsx`
12. `src/components/ui/__tests__/table-of-contents.test.tsx`
13. `src/components/legal/legal-page-template.tsx`
14. `src/components/legal/__tests__/legal-page-template.test.tsx`
15. `src/components/pricing/pricing-card.tsx`
16. `src/components/pricing/__tests__/pricing-card.test.tsx`

### New Data Files (2 files)
17. `src/data/legal/terms-content.tsx`
18. `src/data/legal/privacy-content.tsx`

### New Index/Barrel Export Files (1 file)
19. `src/components/legal/index.ts`

### Modified Component Files (2 files)
20. `src/components/auth/login-form.tsx`
21. `src/components/auth/signup-form.tsx`

### Modified Index Files (2 files)
22. `src/components/forms/index.ts`
23. `src/components/auth/index.ts`
24. `src/components/pricing/index.ts`

### Modified Page Files (6 files)
25. `src/app/login/page.tsx`
26. `src/app/signup/page.tsx`
27. `src/app/terms/page.tsx`
28. `src/app/privacy/page.tsx`
29. `src/app/page.tsx`
30. `src/app/dashboard/page.tsx`

### Modified Pricing Component (1 file)
31. `src/components/pricing/credit-packs.tsx`

**Total: 31 files (19 new, 12 modified)**

---

## Dependencies

### External Dependencies (Existing)
- `class-variance-authority` - Already in use for Button, Card variants
- `react` - Core React library
- `next` - Next.js framework
- Existing shadcn/ui components: Button, Card, Input, Label, Badge

### Internal Dependencies
- Phase 1 must complete before Phase 2 (AuthLayout depends on AlertBox, AuthDivider, FormField)
- Phase 3 Task 3.2 must complete before Phase 4 Task 4.1 (LegalPageTemplate depends on TableOfContents)
- Phase 5 Task 5.1 must complete before Tasks 5.2 and 5.3 (both depend on PricingCard)

### Design System Dependencies
- `src/app/globals.css` - CSS custom properties for colors (no changes needed)
- `src/components/ui/card.tsx` - Existing Card component with studio variant
- `src/components/ui/button.tsx` - Existing Button component with studio variant
- `src/components/layout/page-container.tsx` - Existing PageContainer component

---

## Implementation Notes

### Color System (from globals.css)
```css
--primary: oklch(0.55 0.15 145);     /* Green */
--accent: oklch(0.5 0.12 190);       /* Teal */
--success: oklch(0.55 0.15 145);     /* Green */
--info: oklch(0.5 0.12 190);         /* Teal */
--destructive: oklch(0.55 0.22 25);  /* Red */
```

### Typography Scale
- h1: `text-4xl font-bold tracking-tight`
- h2: `text-3xl font-bold`
- h3: `text-2xl font-semibold`
- h4: `text-xl font-medium`
- Auth titles: `text-3xl font-bold tracking-tight`

### Spacing Patterns
- Form groups: `space-y-4`
- Field groups: `space-y-2`
- PageContainer: `py-16 px-4`
- SectionHeader: `mb-12`
- Card padding: `p-6` or `p-8`

### CVA Variant Pattern Example
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const alertVariants = cva(
  'rounded border px-4 py-3', // base classes
  {
    variants: {
      variant: {
        error: 'bg-destructive/10 border-destructive/20 text-destructive',
        success: 'bg-success/10 border-success/20 text-success',
        info: 'bg-info/10 border-info/20 text-info',
        warning: 'bg-accent/10 border-accent/20 text-accent',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);
```

### Compound Component Pattern Example
```typescript
// AuthLayout wraps children, provides structure
export function AuthLayout({ title, children, footer }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card variant="studio">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </div>
  );
}
```

---

## Testing Guidelines

### Unit Test Structure
```typescript
import { render, screen } from '@testing-library/react';
import { AlertBox } from '../alert-box';

describe('AlertBox', () => {
  it('renders error variant with correct styles', () => {
    render(<AlertBox variant="error">Error message</AlertBox>);
    const alert = screen.getByText('Error message').parentElement;
    expect(alert).toHaveClass('bg-destructive/10');
    expect(alert).toHaveClass('border-destructive/20');
    expect(alert).toHaveClass('text-destructive');
  });

  it('renders optional title', () => {
    render(<AlertBox variant="info" title="Info Title">Content</AlertBox>);
    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Info Title')).toHaveClass('font-medium');
  });
});
```

### Integration Test Example (Auth Flow)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../login-form';

describe('LoginForm Integration', () => {
  it('submits form with email and password', async () => {
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

### Visual Regression Test Example
```typescript
// Using Chromatic or Percy
import { render } from '@testing-library/react';
import { AuthLayout } from '../auth-layout';

describe('AuthLayout Visual Regression', () => {
  it('matches snapshot for login variant', () => {
    const { container } = render(
      <AuthLayout title="ProductPix" description="Sign in">
        <div>Login Form</div>
      </AuthLayout>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with error', () => {
    const { container } = render(
      <AuthLayout title="ProductPix" description="Sign in" error="Invalid credentials">
        <div>Login Form</div>
      </AuthLayout>
    );
    expect(container).toMatchSnapshot();
  });
});
```

---

## Rollback Plan

If issues arise during implementation:

1. **Phase 1-2 Issues**: Revert auth pages to original inline structure
   - Files: `src/app/login/page.tsx`, `src/app/signup/page.tsx`
   - Forms: `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`

2. **Phase 4 Issues**: Revert legal pages to original markup
   - Files: `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`

3. **Phase 3 Issues**: Revert dashboard to hardcoded statusStyles
   - File: `src/app/dashboard/page.tsx`

4. **Phase 5 Issues**: Revert pricing to original CreditPacks implementation
   - Files: `src/components/pricing/credit-packs.tsx`, `src/app/page.tsx`

Each phase is independent except for Phase 1 → Phase 2 dependency. Rollback individual phases without affecting others.

---

## Success Criteria Summary

✅ **615+ lines of code removed**
✅ **8 new reusable components created**
✅ **All tests passing (unit, integration, E2E, visual regression)**
✅ **No TypeScript errors**
✅ **Design system consistency enforced**
✅ **All existing functionality preserved**
✅ **Test coverage ≥70% for new components**
✅ **Auth experience standardized (text-3xl titles, variant="studio" cards)**
✅ **Legal pages data-driven (single template, structured content)**
✅ **Status colors centralized (CVA variants)**
✅ **Form patterns unified (FormField component)**

---

## Estimated Timeline

- **Phase 1**: 3.5 hours (foundation components)
- **Phase 2**: 5 hours (auth redesign)
- **Phase 3**: 2 hours (status & display)
- **Phase 4**: 7 hours (legal templates)
- **Phase 5**: 4 hours (pricing unification)

**Total: ~21.5 hours** (approximately 3 weeks at 7-8 hours/week)
