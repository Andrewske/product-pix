# Landing Page Code Review Fixes Implementation Plan

## Overview

Fix critical and important issues identified in code review of commit `0d904a60` (ProductPix landing page MVP). Addresses 12 action items including package manager violations, error handling, accessibility improvements, and performance optimizations.

## Architecture Decisions

### Decision 1: Error Boundary Strategy
**Choice**: Use Next.js 16 `error.tsx` file convention at app root level
**Rationale**:
- Idiomatic Next.js pattern for handling server component errors
- Cleaner separation of concerns than inline try/catch
- Handles all unhandled errors in page tree automatically
- Follows existing codebase patterns (no error boundaries currently exist)

### Decision 2: Landing Page Config Location
**Choice**: Create `src/lib/landing/config.ts` following const + Zod validation pattern
**Rationale**:
- Matches existing patterns in `src/lib/pricing/pricing.config.ts`
- Type-safe with Zod schema validation at module load
- Centralized configuration makes URL updates easier
- Supports multiple environments without code changes

### Decision 3: Image Loading Strategy
**Choice**: Add `priority` prop to hero images, defer blur placeholders
**Rationale**:
- Priority prop is zero-cost improvement for LCP (Largest Contentful Paint)
- Blur placeholders require image processing and can be added later
- Hero section is above-the-fold, needs fastest possible load

### Decision 4: Footer Navigation Pattern
**Choice**: Use anchor scroll (`href="#pricing"`) for pricing link, keep placeholder `#` for others
**Rationale**:
- Pricing section exists on same page - anchor scroll is appropriate
- Terms/Privacy/Contact pages don't exist yet - placeholders preferred per user
- Avoids creating unnecessary stub pages

### Decision 5: Keyboard Accessibility Implementation
**Choice**: Add keyboard handlers directly to slider component with ARIA attributes
**Rationale**:
- WCAG 2.1 Level A compliance requires keyboard access for interactive elements
- Arrow key increments (5%) provide good UX
- ARIA role="slider" with aria-value* attributes announces state to screen readers
- Minimal complexity, no external dependencies

## Implementation Tasks

### Phase 1: Critical Fixes (Must Complete Before Merge)

#### Task 1.1: Delete pnpm-lock.yaml and regenerate with bun
**Priority**: CRITICAL
**Risk**: HIGH - Package manager conflicts can cause deployment failures

- [ ] Delete `pnpm-lock.yaml` file
  - Files: `pnpm-lock.yaml` (delete)
  - Command: `rm pnpm-lock.yaml`
  - Acceptance: File deleted, git shows deletion

- [ ] Regenerate bun lockfile
  - Command: `bun install`
  - Files: `bun.lockb` (auto-generated)
  - Acceptance: `bun.lockb` updated, no dependency errors

- [ ] Verify package.json integrity
  - Files: `package.json` (read-only verification)
  - Acceptance: TypeScript version remains `^5.9.3`, all dependencies resolve

**Dependencies**: None
**Estimated Impact**: Low complexity, high importance

---

#### Task 1.2: Create error.tsx boundary for pricing fetch failures
**Priority**: CRITICAL
**Risk**: MEDIUM - Unhandled errors crash entire page during SSR

- [ ] Create root error boundary
  - Files: `src/app/error.tsx` (create)
  - Type: Client component
  - Acceptance: Exports default Error component with error/reset props

**Implementation Details**:
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Landing page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We're having trouble loading the page. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

**Tests**: Manual testing required
- Simulate error by breaking `getPricing()` in `src/lib/pricing/actions.ts`
- Verify error boundary renders
- Verify reset button reloads page

**Dependencies**: Requires `@/components/ui/button` (exists)

---

#### Task 1.3: Remove non-functional "See Examples" button
**Priority**: CRITICAL
**Risk**: LOW - Dead UI element confuses users

- [ ] Remove button from hero section
  - Files: `src/app/page.tsx` (modify, lines 59-62)
  - Change: Delete entire Button element
  - Acceptance: Button removed, hero section renders correctly

**Before**:
```typescript
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  <Link href="/signup">
    <Button size="lg" className="text-lg px-8 py-3">
      Get 5 Free Photos
    </Button>
  </Link>
  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
    See Examples
  </Button>
</div>
```

**After**:
```typescript
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  <Link href="/signup">
    <Button size="lg" className="text-lg px-8 py-3">
      Get 5 Free Photos
    </Button>
  </Link>
</div>
```

**Tests**: Visual regression - hero section should center single button

**Dependencies**: None

---

#### Task 1.4: Fix footer pricing link to scroll to pricing section
**Priority**: CRITICAL
**Risk**: LOW - Dead link frustrates users

- [ ] Add ID to pricing section
  - Files: `src/app/page.tsx` (modify, line 110)
  - Change: Add `id="pricing"` to section tag
  - Acceptance: Section has id attribute

**Before**:
```typescript
<section className="py-20 px-4 sm:px-6 lg:px-8">
```

**After**:
```typescript
<section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
```

- [ ] Update footer link from route to anchor
  - Files: `src/app/page.tsx` (modify, lines 171-173)
  - Change: Convert Link to anchor tag with `href="#pricing"`
  - Acceptance: Clicking link scrolls to pricing section smoothly

**Before**:
```typescript
<Link href="/pricing" className="text-muted-foreground hover:text-foreground text-sm">
  Pricing
</Link>
```

**After**:
```typescript
<a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm">
  Pricing
</a>
```

**Tests**:
- Manual: Click footer "Pricing" link, verify smooth scroll
- Visual: Verify pricing section comes into view

**Dependencies**: None

---

### Phase 2: Important Fixes (Should Complete Before Merge)

#### Task 2.1: Add keyboard accessibility to slider component
**Priority**: IMPORTANT
**Risk**: MEDIUM - Accessibility compliance requirement (WCAG 2.1)

- [ ] Add keyboard event handler
  - Files: `src/components/before-after-slider.tsx` (modify)
  - Location: After line 34
  - Acceptance: Arrow keys adjust slider position by 5%

**Implementation**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'ArrowLeft') {
    setSliderPosition(Math.max(sliderPosition - 5, 0));
  } else if (e.key === 'ArrowRight') {
    setSliderPosition(Math.min(sliderPosition + 5, 100));
  }
};
```

- [ ] Add ARIA attributes and keyboard handler to container
  - Files: `src/components/before-after-slider.tsx` (modify, lines 38-45)
  - Changes: Add `tabIndex`, `role`, `aria-*` attributes, `onKeyDown` handler
  - Acceptance: Div is focusable, announces as slider to screen readers

**Before**:
```typescript
<div
  className="relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-ew-resize select-none"
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onMouseMove={handleMouseMove}
  onTouchMove={handleTouchMove}
>
```

**After**:
```typescript
<div
  className="relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-ew-resize select-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onMouseMove={handleMouseMove}
  onTouchMove={handleTouchMove}
  onKeyDown={handleKeyDown}
  tabIndex={0}
  role="slider"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(sliderPosition)}
  aria-label={`Compare ${product} before and after images`}
>
```

**Tests**: Manual accessibility testing
- Tab to slider component, verify focus ring appears
- Press left/right arrow keys, verify slider moves
- Use screen reader (NVDA/VoiceOver), verify announces "slider" role and values

**Dependencies**: None

---

#### Task 2.2: Validate touch events before accessing touches[0]
**Priority**: IMPORTANT
**Risk**: LOW - Edge case crash on touch end

- [ ] Add defensive check to handleTouchMove
  - Files: `src/components/before-after-slider.tsx` (modify, lines 29-34)
  - Change: Guard clause for empty touches array
  - Acceptance: Function returns early if no touch exists

**Before**:
```typescript
const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const percentage = (x / rect.width) * 100;
  setSliderPosition(Math.min(Math.max(percentage, 0), 100));
};
```

**After**:
```typescript
const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
  if (!e.touches[0]) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const percentage = (x / rect.width) * 100;
  setSliderPosition(Math.min(Math.max(percentage, 0), 100));
};
```

**Tests**: Manual testing on mobile device
- Rapidly lift finger during drag, verify no crash
- Multi-touch gestures should not break slider

**Dependencies**: None

---

#### Task 2.3: Move hardcoded example URLs to config
**Priority**: IMPORTANT
**Risk**: LOW - Improves maintainability, testability

- [ ] Create landing page types
  - Files: `src/lib/landing/types.ts` (create)
  - Acceptance: Exports BeforeAfterExampleSchema and type

**Implementation**:
```typescript
import { z } from 'zod';

export const BeforeAfterExampleSchema = z.object({
  beforeImage: z.string().url(),
  afterImage: z.string().url(),
  product: z.string(),
  category: z.string(),
});

export type BeforeAfterExample = z.infer<typeof BeforeAfterExampleSchema>;
```

- [ ] Create landing page config
  - Files: `src/lib/landing/config.ts` (create)
  - Pattern: Const + Zod validation (matches `src/lib/pricing/pricing.config.ts`)
  - Acceptance: Exports landingConfig with validated examples array

**Implementation**:
```typescript
import { z } from 'zod';
import { BeforeAfterExampleSchema, type BeforeAfterExample } from './types';

const BEFORE_AFTER_EXAMPLES = [
  {
    beforeImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/ffb69068ef4b0e9511d6198bc12b0068fe65a5365c6339f22c3ec2cc1ce1222e.jpg",
    afterImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png",
    product: "Peanut Butter Jar",
    category: "Food/Consumer"
  }
] as const;

// Validate at module load
z.array(BeforeAfterExampleSchema).parse(BEFORE_AFTER_EXAMPLES);

export const landingConfig = {
  examples: BEFORE_AFTER_EXAMPLES,
} as const;

export type LandingConfig = typeof landingConfig;
```

- [ ] Create barrel export
  - Files: `src/lib/landing/index.ts` (create)
  - Acceptance: Re-exports all public APIs

**Implementation**:
```typescript
export { landingConfig, type LandingConfig } from './config';
export type { BeforeAfterExample } from './types';
```

- [ ] Update page.tsx to use config
  - Files: `src/app/page.tsx` (modify)
  - Changes:
    1. Add import: `import { landingConfig } from '@/lib/landing';` (line 7)
    2. Delete hardcoded examples const (lines 28-36)
    3. Update BeforeAfterSlider usage (line 66): `<BeforeAfterSlider {...landingConfig.examples[0]} />`
  - Acceptance: Page uses config, no hardcoded URLs

**Tests**:
- Unit test for config validation (optional)
- Manual: Verify landing page renders with images from config

**Dependencies**: Requires `zod` (already installed)

---

#### Task 2.4: Add priority prop to hero images for LCP optimization
**Priority**: IMPORTANT
**Risk**: LOW - Performance optimization for Core Web Vitals

- [ ] Add priority prop to after image
  - Files: `src/components/before-after-slider.tsx` (modify, lines 47-53)
  - Change: Add `priority` prop to Image component
  - Acceptance: Image loads with high priority

**Before**:
```typescript
<Image
  src={afterImage}
  alt={`${product} - Enhanced`}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**After**:
```typescript
<Image
  src={afterImage}
  alt={`${product} - Enhanced`}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
  priority
/>
```

- [ ] Add priority prop to before image
  - Files: `src/components/before-after-slider.tsx` (modify, lines 60-66)
  - Change: Add `priority` prop to Image component
  - Acceptance: Image loads with high priority

**Before**:
```typescript
<Image
  src={beforeImage}
  alt={`${product} - Original`}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**After**:
```typescript
<Image
  src={beforeImage}
  alt={`${product} - Original`}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
  priority
/>
```

**Tests**: Performance testing
- Run Lighthouse audit before/after
- Verify LCP score improves
- Check Network tab shows images load early

**Dependencies**: None

---

### Phase 3: Enhancements (Nice to Have)

#### Task 3.1: Create loading.tsx for pricing fetch loading states
**Priority**: ENHANCEMENT
**Risk**: LOW - UX improvement, not critical

- [ ] Create root loading skeleton
  - Files: `src/app/loading.tsx` (create)
  - Acceptance: Exports default Loading component with skeleton UI

**Implementation**:
```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-16 w-3/4 mx-auto mb-6" />
            <Skeleton className="h-6 w-2/3 mx-auto mb-8" />
            <div className="flex gap-4 justify-center">
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
          <Skeleton className="aspect-square max-w-md mx-auto rounded-lg" />
        </div>
      </section>

      {/* Pricing Section Skeleton */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mx-auto mb-16" />
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Tests**: Manual testing
- Hard refresh page, verify skeleton shows briefly
- Network throttling to see loading state longer

**Dependencies**: Requires `@/components/ui/skeleton` (already exists)

---

#### Task 3.2: Verify auth routes exist and work
**Priority**: ENHANCEMENT
**Risk**: NONE - Routes already fully implemented

- [ ] Verify /signup route exists and works
  - Files: `src/app/signup/page.tsx` (read-only verification)
  - Acceptance: Route exists, renders signup form, Google OAuth works

- [ ] Verify /login route exists and works
  - Files: `src/app/login/page.tsx` (read-only verification)
  - Acceptance: Route exists, renders login form, Google OAuth works

**Tests**: Manual navigation
- Navigate to `/signup`, verify form renders
- Navigate to `/login`, verify form renders
- Verify both routes link to each other

**Dependencies**: None - verification only, no changes needed

**Status**: ✅ Already implemented, no action required

---

## Acceptance Criteria

### Functional Requirements
- [ ] Landing page renders without errors
- [ ] Error boundary shows when server errors occur
- [ ] All navigation links work (signup, login, pricing scroll)
- [ ] Slider component is keyboard accessible (tab, arrow keys)
- [ ] Slider component works on touch devices without crashes
- [ ] Hero images load with priority for optimal LCP
- [ ] Example images load from centralized config

### Quality Requirements
- [ ] No TypeScript errors: `bun run tsc --noEmit`
- [ ] No ESLint errors: `bun run lint`
- [ ] Build succeeds: `bun run build` (with proper env vars)
- [ ] Only `bun.lockb` exists (no `pnpm-lock.yaml`)

### Accessibility Requirements
- [ ] Slider can be operated with keyboard (arrow keys)
- [ ] Slider has visible focus indicator
- [ ] Slider announces as "slider" role to screen readers
- [ ] Slider announces current value to screen readers

### Performance Requirements
- [ ] Hero images load with `priority` prop
- [ ] Lighthouse LCP score improves (before: baseline, after: measure)
- [ ] No layout shift during image load

### Code Quality Requirements
- [ ] Functions ≤20 lines (all new functions comply)
- [ ] No `any` types used
- [ ] Explicit return types on functions
- [ ] Error handling follows project patterns

## Files to Create

### New Files (5)
1. `src/app/error.tsx` - Root error boundary
2. `src/app/loading.tsx` - Root loading skeleton
3. `src/lib/landing/types.ts` - Landing page type definitions
4. `src/lib/landing/config.ts` - Landing page configuration
5. `src/lib/landing/index.ts` - Barrel export

## Files to Modify

### Modified Files (2)
1. `src/app/page.tsx` - Landing page fixes
   - Remove "See Examples" button (lines 59-62)
   - Add `id="pricing"` to pricing section (line 110)
   - Change footer pricing link to anchor (lines 171-173)
   - Import landingConfig (line 7)
   - Delete hardcoded examples (lines 28-36)
   - Use config for BeforeAfterSlider (line 66)

2. `src/components/before-after-slider.tsx` - Accessibility & performance
   - Add handleKeyDown function (after line 34)
   - Add ARIA attributes to container div (lines 38-45)
   - Add focus styling to className (line 39)
   - Add guard clause to handleTouchMove (line 29)
   - Add `priority` prop to both Image components (lines 47-53, 60-66)

## Files to Delete

### Deleted Files (1)
1. `pnpm-lock.yaml` - Package manager violation

## Dependencies

### External Dependencies
- **zod**: Already installed - used for config validation
- **next/image**: Already installed - priority prop support
- **@/components/ui/button**: Already exists
- **@/components/ui/skeleton**: Already exists

### Internal Dependencies

**Task Dependencies**:
- Task 2.3 depends on completion before Task 2.3 page.tsx changes
- All Phase 1 tasks should complete before Phase 2
- Phase 3 can be done in parallel with Phase 2

**File Dependencies**:
- `src/app/page.tsx` depends on `src/lib/landing/index.ts`
- `src/lib/landing/index.ts` depends on `src/lib/landing/config.ts` and `types.ts`
- `src/app/error.tsx` depends on `@/components/ui/button`
- `src/app/loading.tsx` depends on `@/components/ui/skeleton`

## Testing Strategy

### Manual Testing Checklist
- [ ] Delete pnpm-lock.yaml, run `bun install`, verify no errors
- [ ] Navigate to `/` (landing page), verify renders without errors
- [ ] Break `getPricing()` temporarily, verify error boundary shows
- [ ] Fix `getPricing()`, click error boundary "Try again" button, verify page recovers
- [ ] Verify "See Examples" button removed from hero section
- [ ] Click footer "Pricing" link, verify smooth scroll to pricing section
- [ ] Tab to slider component, verify focus ring appears
- [ ] Press left/right arrow keys on slider, verify slider moves
- [ ] Use screen reader on slider, verify announces "slider" role and current value
- [ ] Test slider on touch device, rapidly lift finger, verify no crash
- [ ] Check Network tab, verify hero images load early (priority)
- [ ] Navigate to `/signup`, verify page renders (already exists)
- [ ] Navigate to `/login`, verify page renders (already exists)

### Automated Testing
- [ ] Run TypeScript compiler: `bun run tsc --noEmit`
- [ ] Run ESLint: `bun run lint`
- [ ] Run build: `bun run build` (requires env vars)

### Performance Testing
- [ ] Run Lighthouse audit on landing page
- [ ] Verify LCP includes hero image load time
- [ ] Check priority images load before non-priority assets

### Accessibility Testing
- [ ] Tab through landing page, verify all interactive elements reachable
- [ ] Use screen reader (NVDA/VoiceOver), verify announcements correct
- [ ] Test keyboard navigation (arrow keys on slider)
- [ ] Verify focus indicators visible on all interactive elements

## Rollback Plan

If issues arise during implementation:

1. **Phase 1 rollback**:
   - Run `git checkout HEAD~1 pnpm-lock.yaml` to restore lockfile
   - Run `bun install` to sync dependencies
   - Delete `src/app/error.tsx` if created

2. **Phase 2 rollback**:
   - Revert changes to `src/components/before-after-slider.tsx`
   - Delete `src/lib/landing/` directory
   - Restore hardcoded examples to `src/app/page.tsx`

3. **Phase 3 rollback**:
   - Delete `src/app/loading.tsx` if causing issues

## Success Metrics

- **Accessibility**: Slider fully keyboard accessible, screen reader compatible
- **Performance**: Hero images load with priority, improve LCP score
- **Quality**: Zero TypeScript/ESLint errors, successful build
- **Reliability**: Error boundary prevents page crashes
- **Maintainability**: Config centralized, easy to update URLs

## Notes

- Auth routes (`/signup`, `/login`) already fully implemented with Supabase - no work needed
- Pricing route doesn't exist as separate page - footer link changed to anchor scroll
- Terms/Privacy/Contact footer links kept as placeholders (`href="#"`) per user preference
- Loading.tsx provides enhanced UX but is optional (Phase 3)
- Blur placeholders deferred to future optimization work
