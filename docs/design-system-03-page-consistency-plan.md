# Design System Phase 3: Page Consistency Updates

## Overview
Apply design system consistently across all 18 pages. Uses the Generate page as the reference implementation. Focuses on typography, spacing, card usage, and accent color application.

## Architecture Decisions

- **Generate page is reference**: All other pages should match its visual patterns
- **PageContainer usage**: All pages should use consistent layout wrapper
- **Card variant assignment**: Result/output panels use `hero`, control panels use `control`
- **Accent color rules**: Green for primary actions, teal for info badges
- **Contact page rebuild**: Currently placeholder, needs full implementation

## Implementation Tasks

### Batch A: Core App Pages (Highest Traffic)

- [ ] Verify Generate page alignment
  - Files: `src/app/generate/page.tsx` (verify)
  - Changes: Confirm it matches screenshot, uses proper Card variants
  - Tests: Visual verification
  - Acceptance: Generate page matches design system reference

- [ ] Update Dashboard page
  - Files: `src/app/dashboard/page.tsx` (modify)
  - Changes:
    - Fix excessive vertical spacing (if any)
    - Use `Card variant="hero"` for image gallery cards
    - Ensure consistent section headers with `font-display`
  - Tests: Visual verification
  - Acceptance: Dashboard matches Generate page patterns

- [ ] Verify Pricing page
  - Files: `src/app/pricing/page.tsx` (modify)
  - Changes:
    - Verify pricing cards use proper hierarchy
    - Ensure CTA buttons use accent color
    - Check font usage on prices (mono OK for numbers)
  - Tests: Visual verification
  - Acceptance: Pricing page aligned with design system

### Batch B: Auth Pages

- [ ] Update Login page typography
  - Files: `src/app/login/page.tsx` (modify)
  - Changes:
    - Verify title uses `font-display`
    - Ensure Card variant is appropriate
    - Check button uses accent color for primary CTA
  - Tests: Visual verification
  - Acceptance: Login page matches design system

- [ ] Update Signup page typography
  - Files: `src/app/signup/page.tsx` (modify)
  - Changes: Same as Login page
  - Tests: Visual verification
  - Acceptance: Signup page matches design system

- [ ] Update Reset Password page
  - Files: `src/app/auth/reset-password/page.tsx` (modify)
  - Changes: Same as Login page
  - Tests: Visual verification
  - Acceptance: Reset password page matches design system

### Batch C: Batch Operations

- [ ] Update Batch List page
  - Files: `src/app/batch/page.tsx` (modify)
  - Changes:
    - Verify Card styling for batch items
    - Ensure status badges use proper variants (teal for info, success for complete)
  - Tests: Visual verification
  - Acceptance: Batch list matches design system

- [ ] Update Batch New page
  - Files: `src/app/batch/new/page.tsx` (modify)
  - Changes:
    - Use `Card variant="control"` for upload form
    - Verify mono font only on technical info
  - Tests: Visual verification
  - Acceptance: Batch new page matches design system

- [ ] Update Batch Detail page
  - Files: `src/app/batch/[batchId]/page.tsx` (modify)
  - Changes:
    - Use `Card variant="hero"` for result images
    - Use `Card variant="control"` for batch info panel
  - Tests: Visual verification
  - Acceptance: Batch detail page matches design system

### Batch D: Settings

- [ ] Update Settings page
  - Files: `src/app/settings/page.tsx` (modify)
  - Changes:
    - Verify PageContainer usage
    - Use proper Card variants for settings panels
  - Tests: Visual verification
  - Acceptance: Settings page matches design system

- [ ] Update Billing page
  - Files: `src/app/settings/billing/page.tsx` (modify)
  - Changes:
    - Use mono font for transaction amounts/dates
    - Proper card styling for billing history
  - Tests: Visual verification
  - Acceptance: Billing page matches design system

### Batch E: Help & Legal

- [ ] Verify Help redirect
  - Files: `src/app/help/page.tsx` (verify)
  - Changes: Confirm redirect works correctly
  - Tests: Navigation test
  - Acceptance: Help redirects properly

- [ ] Update Help Article pages
  - Files: `src/app/help/[...slug]/page.tsx` (modify)
  - Changes:
    - Ensure MDX content uses proper typography
    - Headings in display font, body in body font
  - Tests: Visual verification on sample article
  - Acceptance: Help articles match design system

- [ ] Verify Terms page
  - Files: `src/app/terms/page.tsx` (verify)
  - Changes: Uses LegalPageTemplate - verify template is styled correctly
  - Tests: Visual verification
  - Acceptance: Terms page matches design system

- [ ] Verify Privacy page
  - Files: `src/app/privacy/page.tsx` (verify)
  - Changes: Same as Terms
  - Tests: Visual verification
  - Acceptance: Privacy page matches design system

- [ ] Rebuild Contact page
  - Files: `src/app/contact/page.tsx` (modify - complete rebuild)
  - Changes:
    - Add PageContainer wrapper
    - Add proper heading with `font-display`
    - Add contact form with Card variant="control"
    - Add email links (support@productpix.ai)
    - Use accent button for submit
    - Add helpful copy per design system tone
  - Tests: `src/app/__tests__/contact-page.test.tsx` (new)
  - Acceptance:
    - Contact page has working form
    - Matches design system aesthetics
    - Proper typography and spacing

- [ ] Verify Success page
  - Files: `src/app/success/page.tsx` (verify/modify)
  - Changes:
    - Verify success icon uses accent color
    - Proper typography on success message
  - Tests: Visual verification
  - Acceptance: Success page matches design system

### Batch F: Landing Page

- [ ] Update Landing page typography
  - Files: `src/app/page.tsx` (modify)
  - Changes:
    - Verify hero heading uses `font-display`
    - Verify body copy uses `font-body`
    - Check CTAs use accent buttons
  - Tests: Visual verification
  - Acceptance: Landing page typography matches design system

- [ ] Update Landing sections
  - Files: `src/components/landing/*.tsx` (modify as needed)
  - Changes:
    - `hero-section.tsx`: Display font on main heading
    - `how-it-works-section.tsx`: Display font on section title
    - `examples-section.tsx`: Proper card styling
    - `pricing-section.tsx`: Proper pricing card hierarchy
    - `final-cta-section.tsx`: Accent button for CTA
  - Tests: Visual verification
  - Acceptance: All landing sections match design system

## Acceptance Criteria

- [ ] All 18 pages render correctly in light mode
- [ ] All 18 pages render correctly in dark mode
- [ ] Consistent typography: headings in Space Grotesk, body in Inter
- [ ] Consistent spacing rhythm across pages
- [ ] Green accent on primary CTAs
- [ ] Teal accent on info badges
- [ ] Card hierarchy visible in dark mode (hero vs control)
- [ ] Contact page fully functional (not placeholder)
- [ ] No TypeScript errors
- [ ] No visual regressions

## Files to Create/Modify

### Core Pages
| File | Action | Description |
|------|--------|-------------|
| `src/app/generate/page.tsx` | Verify | Reference implementation |
| `src/app/dashboard/page.tsx` | Modify | Spacing, card variants |
| `src/app/pricing/page.tsx` | Modify | Card variants, CTA colors |

### Auth Pages
| File | Action | Description |
|------|--------|-------------|
| `src/app/login/page.tsx` | Modify | Typography, card variant |
| `src/app/signup/page.tsx` | Modify | Typography, card variant |
| `src/app/auth/reset-password/page.tsx` | Modify | Typography, card variant |

### Batch Pages
| File | Action | Description |
|------|--------|-------------|
| `src/app/batch/page.tsx` | Modify | Card styling, badges |
| `src/app/batch/new/page.tsx` | Modify | Card variant, mono usage |
| `src/app/batch/[batchId]/page.tsx` | Modify | Card hierarchy |

### Settings Pages
| File | Action | Description |
|------|--------|-------------|
| `src/app/settings/page.tsx` | Modify | Card variants |
| `src/app/settings/billing/page.tsx` | Modify | Mono font, card styling |

### Help & Legal Pages
| File | Action | Description |
|------|--------|-------------|
| `src/app/help/page.tsx` | Verify | Redirect only |
| `src/app/help/[...slug]/page.tsx` | Modify | MDX typography |
| `src/app/terms/page.tsx` | Verify | LegalPageTemplate |
| `src/app/privacy/page.tsx` | Verify | LegalPageTemplate |
| `src/app/contact/page.tsx` | Rebuild | Complete page build |
| `src/app/success/page.tsx` | Modify | Icon color, typography |

### Landing Page
| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Modify | Typography update |
| `src/components/landing/hero-section.tsx` | Modify | Display font |
| `src/components/landing/how-it-works-section.tsx` | Modify | Display font |
| `src/components/landing/examples-section.tsx` | Modify | Card styling |
| `src/components/landing/pricing-section.tsx` | Modify | Card hierarchy |
| `src/components/landing/final-cta-section.tsx` | Modify | Accent button |

### New Files
| File | Action | Description |
|------|--------|-------------|
| `src/app/__tests__/contact-page.test.tsx` | Create | Contact page tests |

## Dependencies

- **Depends on**:
  - Phase 1 (Typography Foundation) - fonts must be configured
  - Phase 2 (Core Components) - Card variants must exist
- **LegalPageTemplate**: Used by terms/privacy - may need update
- **PageContainer**: Shared layout component

## Contact Page Specification

Since contact page needs complete rebuild, here's the spec:

```tsx
// Structure
<PageContainer>
  <div className="max-w-2xl mx-auto">
    <h1 className="font-display text-3xl font-bold mb-2">Get in Touch</h1>
    <p className="text-muted-foreground mb-8">
      Have a question or need help? We'd love to hear from you.
    </p>

    <Card variant="control">
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
        <CardDescription>We typically respond within 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Contact form: name, email, message */}
        {/* Submit button: variant="accent" */}
      </CardContent>
    </Card>

    <div className="mt-8 text-center text-muted-foreground">
      <p>Or email us directly at</p>
      <a href="mailto:support@productpix.ai" className="text-accent hover:underline">
        support@productpix.ai
      </a>
    </div>
  </div>
</PageContainer>
```

## Verification Commands

```bash
# Build to check for errors
bun build

# Run all tests
bun test

# Visual verification checklist (run dev server)
bun dev

# Check each page:
# - / (landing)
# - /login, /signup
# - /generate
# - /dashboard
# - /batch, /batch/new
# - /pricing
# - /settings, /settings/billing
# - /help
# - /terms, /privacy
# - /contact
# - /success
```

## Page Verification Checklist

For each page, verify:
- [ ] Headings use Space Grotesk (font-display)
- [ ] Body text uses Inter (font-body)
- [ ] Primary CTAs use green accent color
- [ ] Info badges use teal
- [ ] Cards have visible hierarchy in dark mode
- [ ] Spacing is consistent with other pages
- [ ] No pure black backgrounds in dark mode
- [ ] Product images sit on defined surfaces
