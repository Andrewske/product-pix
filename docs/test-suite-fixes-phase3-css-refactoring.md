# Test Suite Fixes - Phase 3: CSS Class Test Refactoring

## Overview
Replace 171 CSS class-checking assertions with behavior-focused tests. These tests currently verify Tailwind implementation details (e.g., `classList.contains('text-5xl')`) which are brittle and break during styling refactors even when visual output is correct.

**Priority: MEDIUM** - Reduces maintenance burden and test brittleness.

## Current Status (Updated: 2025-12-11)

- **CSS Assertions**: Reduced from 171 to 114 (33% reduction)
- **Completed Tasks**: 1-6, 8 (7/11 tasks done)
- **In Progress**: Task 7 (final-cta-section.test.tsx)
- **Remaining**: Tasks 9-11 (batch refactor + interaction tests)
- **Coverage**: Maintained ≥70% across all refactored components
- **Quality**: All tests now focus on behavior, semantics, and accessibility

## Architecture Decisions

### Testing Philosophy Shift
- **FROM**: Testing CSS classes → **TO**: Testing behavior and semantics
- **FROM**: `expect(el.classList.contains('text-5xl'))` → **TO**: `expect(el.tagName).toBe('H1')`
- **FROM**: Coupling to Tailwind → **TO**: Coupling to HTML semantics
- **Preserve**: Accessibility tests (ARIA roles, labels) - these are good

### Refactoring Strategy
- **Phase A**: Remove pure class-checking tests with no behavioral value
- **Phase B**: Replace class checks with semantic/visual checks where meaningful
- **Phase C**: Add missing interaction tests where gaps exist
- **Preserve**: Tests that verify correct HTML structure, a11y, or computed styles

### What to Keep vs Remove

**KEEP (Good tests):**
```typescript
// ✅ Tests semantic HTML
expect(screen.getByRole('heading', { level: 1 })).toBeDefined();

// ✅ Tests accessibility
expect(link.getAttribute('aria-label')).toBe('Upload');

// ✅ Tests computed style (actual rendering)
const style = window.getComputedStyle(element);
expect(parseInt(style.fontSize)).toBeGreaterThan(32);

// ✅ Tests visibility
expect(element).toBeVisible();
```

**REMOVE (Brittle tests):**
```typescript
// ❌ Tests CSS class names (implementation detail)
expect(element.classList.contains('text-5xl')).toBe(true);

// ❌ Tests Tailwind utilities
expect(element.classList.contains('hover:bg-green-700')).toBe(true);

// ❌ Tests layout classes
expect(element.classList.contains('grid')).toBe(true);
expect(element.classList.contains('md:grid-cols-3')).toBe(true);
```

## Implementation Tasks

### Phase 3A: High-Priority Files (Most CSS Assertions)

#### Task 1: Refactor button-studio.test.tsx
- [x] Replace 24 CSS class assertions with semantic tests
  - Files: `src/components/ui/__tests__/button-studio.test.tsx` (modify)
  - Current: Tests for `bg-foreground`, `text-background`, `button-studio` classes
  - Replace with:
    - Button role and type attributes
    - Disabled state behavior
    - Click event handling
    - Accessibility (focus, keyboard navigation)
  - Tests: All existing behavior preserved
  - Acceptance: 0 CSS class assertions, behavior fully tested

#### Task 2: Refactor hero-section.test.tsx
- [x] Replace 18 CSS class assertions with behavior tests
  - Files: `src/components/landing/__tests__/hero-section.test.tsx` (modify)
  - Current: Tests for `text-5xl`, `sm:text-6xl`, `lg:text-7xl`, etc.
  - Replace with:
    - Heading hierarchy (h1 present)
    - CTA button functionality (click, navigation)
    - Image loading (before/after slider)
    - Accessibility compliance
  - Tests: Behavior and semantics tested
  - Acceptance: 0 CSS class assertions, critical paths tested

#### Task 3: Refactor pricing-card.test.tsx
- [x] Replace 14 CSS class assertions with value-based tests
  - Files: `src/components/pricing/__tests__/pricing-card.test.tsx` (modify)
  - Current: Tests for card styling classes
  - Replace with:
    - Price display correctness
    - Feature list rendering
    - CTA button behavior
    - Selected state behavior
  - Tests: User-facing values tested
  - Acceptance: 0 CSS class assertions, data display tested

#### Task 4: Refactor how-it-works-section.test.tsx
- [x] Replace 12 CSS class assertions with semantic tests
  - Files: `src/components/landing/__tests__/how-it-works-section.test.tsx` (modify)
  - Current: Tests for `grid`, `md:grid-cols-3`, spacing classes
  - Replace with:
    - Ordered list structure (semantic HTML)
    - Step count and content
    - Icon accessibility
    - Already has good ARIA tests - keep those!
  - Tests: Structure and content tested
  - Acceptance: 0 CSS class assertions, semantics preserved

### Phase 3B: Medium-Priority Files (10-15 assertions each)

#### Task 5: Refactor examples-section.test.tsx
- [x] Replace CSS assertions with content/interaction tests
  - Files: `src/components/landing/__tests__/examples-section.test.tsx` (modify)
  - Focus on: Example data display, image loading, category filtering
  - Acceptance: Behavior tested, no class checks

#### Task 6: Refactor footer.test.tsx
- [x] Replace CSS assertions with navigation/link tests
  - Files: `src/components/landing/__tests__/footer.test.tsx` (modify)
  - Focus on: Link targets, navigation structure, social links
  - Acceptance: Links verified, no class checks

#### Task 7: Refactor final-cta-section.test.tsx
- [🔄] Replace CSS assertions with CTA behavior tests (IN PROGRESS)
  - Files: `src/components/landing/__tests__/final-cta-section.test.tsx` (modify)
  - Focus on: Button click handling, navigation, messaging
  - Acceptance: CTA tested, no class checks

#### Task 8: Refactor legal-page-template.test.tsx
- [x] Replace 8 CSS class assertions with structure tests
  - Files: `src/components/legal/__tests__/legal-page-template.test.tsx` (modify)
  - Current: Tests `scroll-mt-8` class on sections
  - Replace with: Section structure, heading hierarchy, TOC links
  - Acceptance: Document structure tested, no class checks

### Phase 3C: Low-Priority Files (1-5 assertions each)

#### Task 9: Batch refactor remaining files
- [x] Identify all remaining files with CSS class assertions
  - Files: Use grep to find: `grep -r "classList.contains" src --include="*.test.tsx" -l`
  - Create list of files with assertion counts
  - **COMPLETED**: Found 14 files with 114 CSS assertions remaining
  - Acceptance: Complete inventory

- [ ] Refactor remaining files in batch
  - Files: All files from inventory (14 files)
  - **Priority order by assertion count:**
    - `alert-box.test.tsx`: 19 assertions
    - `status-badge.test.tsx`: 17 assertions
    - `final-cta-section.test.tsx`: 14 assertions
    - `aspect-ratio-selector.test.tsx`: 13 assertions
    - `page-container.test.tsx`: 12 assertions
    - `auth-divider.test.tsx`: 8 assertions
    - `studio-card.test.tsx`: 7 assertions
    - `auth-layout.test.tsx`: 7 assertions
    - `table-of-contents.test.tsx`: 5 assertions
    - `form-field.test.tsx`: 5 assertions
    - `credit-packs.test.tsx`: 3 assertions
    - `pricing-section.test.tsx`: 2 assertions
    - `hero-section.test.tsx`: 1 assertion
    - `examples-section.test.tsx`: 1 assertion
  - Strategy: Remove low-value class checks, keep or replace high-value ones
  - Acceptance: <10 total CSS class assertions in entire test suite

### Phase 3D: Add Missing Interaction Tests

#### Task 10: Add form interaction tests
- [ ] Add user interaction tests for FormField
  - Files: `src/components/forms/__tests__/form-field.test.tsx` (modify)
  - New tests:
    - User types in input → value updates
    - Invalid input → error message displays
    - Required field left empty → validation error
    - Error message cleared after correction
  - Acceptance: Form behavior fully tested

#### Task 11: Add slider interaction tests
- [ ] Add interaction tests for BeforeAfterSlider
  - Files: `src/components/__tests__/before-after-slider.test.tsx` (modify)
  - Current: Only 2 tests (very thin coverage)
  - New tests:
    - Slider drag updates position
    - Image loading error handling
    - Keyboard controls (if applicable)
    - Touch/mobile interaction
  - Acceptance: Slider behavior fully tested

## Detailed Implementation Examples

### Example 1: Button Studio Refactoring

**File:** `src/components/ui/__tests__/button-studio.test.tsx`

**BEFORE (Brittle - 24 class assertions):**
```typescript
it('applies studio variant styles', () => {
  render(<Button variant="studio">Click me</Button>);
  const button = screen.getByRole('button');

  expect(button.classList.contains('bg-foreground')).toBe(true);
  expect(button.classList.contains('text-background')).toBe(true);
  expect(button.classList.contains('button-studio')).toBe(true);
  expect(button.classList.contains('hover:bg-green-700')).toBe(true);
  // ... 20 more class checks
});

it('applies disabled styles', () => {
  render(<Button disabled>Click me</Button>);
  const button = screen.getByRole('button');

  expect(button.classList.contains('opacity-50')).toBe(true);
  expect(button.classList.contains('cursor-not-allowed')).toBe(true);
});
```

**AFTER (Robust - behavior focused):**
```typescript
import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button-studio';

describe('Button', () => {
  it('renders as a button element with correct type', () => {
    render(<Button variant="studio">Click me</Button>);

    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.textContent).toBe('Click me');
  });

  it('handles click events', async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents interaction when disabled', async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(<Button disabled onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation', async () => {
    const handleClick = mock(() => {});

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);

    // Simulate Enter key
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders as link when asChild with Link component', () => {
    render(
      <Button asChild>
        <a href="/studio">Go to Studio</a>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/studio');
    expect(link.textContent).toBe('Go to Studio');
  });
});
```

**Changes:**
- ❌ Removed: 24 CSS class assertions
- ✅ Added: Click handling, disabled state, keyboard navigation, link rendering
- 📊 Value: Tests what users experience, not implementation details

---

### Example 2: Hero Section Refactoring

**File:** `src/components/landing/__tests__/hero-section.test.tsx`

**BEFORE (Brittle - tests CSS):**
```typescript
it('applies responsive text sizing', () => {
  render(<HeroSection example={mockExample} />);

  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading.classList.contains('text-5xl')).toBe(true);
  expect(heading.classList.contains('sm:text-6xl')).toBe(true);
  expect(heading.classList.contains('lg:text-7xl')).toBe(true);
});

it('has responsive grid layout', () => {
  const { container } = render(<HeroSection example={mockExample} />);

  const grid = container.querySelector('.grid');
  expect(grid?.classList.contains('lg:grid-cols-2')).toBe(true);
  expect(grid?.classList.contains('gap-8')).toBe(true);
});
```

**AFTER (Robust - tests behavior):**
```typescript
describe('HeroSection', () => {
  it('displays main heading and description', () => {
    render(<HeroSection example={mockExample} />);

    // Test semantic structure
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Professional Product Photos');
    expect(heading.id).toBe('hero-heading'); // For skip links

    // Test description is present and associated
    const description = screen.getByText(/Transform phone photos/i);
    expect(description.id).toBe('hero-description');
  });

  it('renders interactive before/after comparison', () => {
    render(<HeroSection example={mockExample} />);

    // Verify slider is present
    const slider = screen.getByRole('img', { name: /before and after/i });
    expect(slider).toBeDefined();

    // Verify both images are loaded
    const images = screen.getAllByRole('img');
    const beforeImg = images.find(img =>
      img.getAttribute('alt')?.includes('Before')
    );
    const afterImg = images.find(img =>
      img.getAttribute('alt')?.includes('After')
    );

    expect(beforeImg?.getAttribute('src')).toBe(mockExample.beforeImage);
    expect(afterImg?.getAttribute('src')).toBe(mockExample.afterImage);
  });

  it('provides accessible CTA button', async () => {
    const user = userEvent.setup();
    render(<HeroSection example={mockExample} />);

    const ctaButton = screen.getByRole('link', { name: /get started/i });

    // Test it's a link to correct destination
    expect(ctaButton.getAttribute('href')).toBe('/studio');

    // Test keyboard accessibility
    ctaButton.focus();
    expect(document.activeElement).toBe(ctaButton);

    // Verify it's visually prominent (large interactive target)
    const style = window.getComputedStyle(ctaButton);
    const height = parseInt(style.height);
    expect(height).toBeGreaterThanOrEqual(44); // WCAG touch target size
  });
});
```

**Changes:**
- ❌ Removed: 18 CSS class assertions
- ✅ Added: Semantic HTML tests, image loading, CTA functionality, accessibility
- 📊 Value: Tests user experience, not Tailwind classes

---

### Example 3: Pricing Card Refactoring

**File:** `src/components/pricing/__tests__/pricing-card.test.tsx`

**BEFORE (Brittle - tests classes):**
```typescript
it('applies selected state styles', () => {
  render(<PricingCard {...mockPack} isSelected={true} />);

  const card = screen.getByRole('article');
  expect(card.classList.contains('border-green-500')).toBe(true);
  expect(card.classList.contains('ring-2')).toBe(true);
  expect(card.classList.contains('ring-green-500')).toBe(true);
});
```

**AFTER (Robust - tests state and values):**
```typescript
describe('PricingCard', () => {
  const mockPack = {
    name: 'Starter Pack',
    credits: 100,
    price: 9.99,
    priceId: 'price_123',
    features: ['100 credits', 'Email support'],
  };

  it('displays correct pricing information', () => {
    render(<PricingCard {...mockPack} />);

    expect(screen.getByText('Starter Pack')).toBeDefined();
    expect(screen.getByText('$9.99')).toBeDefined();
    expect(screen.getByText('100 credits')).toBeDefined();
  });

  it('indicates selected state accessibly', () => {
    render(<PricingCard {...mockPack} isSelected={true} />);

    const card = screen.getByRole('article');
    expect(card.getAttribute('aria-selected')).toBe('true');

    // Verify visual indicator exists (not specific classes)
    const selectedIndicator = screen.getByText(/selected/i);
    expect(selectedIndicator).toBeDefined();
  });

  it('renders all features in list', () => {
    render(<PricingCard {...mockPack} />);

    const list = screen.getByRole('list');
    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('100 credits');
    expect(items[1].textContent).toBe('Email support');
  });

  it('handles purchase button click', async () => {
    const handlePurchase = mock(() => {});
    const user = userEvent.setup();

    render(<PricingCard {...mockPack} onPurchase={handlePurchase} />);

    const button = screen.getByRole('button', { name: /purchase/i });
    await user.click(button);

    expect(handlePurchase).toHaveBeenCalledWith('price_123');
  });
});
```

**Changes:**
- ❌ Removed: 14 CSS class assertions
- ✅ Added: Data display, ARIA state, feature list, button behavior
- 📊 Value: Tests actual pricing information and user interaction

## Acceptance Criteria

- [🔄] CSS class assertions reduced from 171 to <10 (**CURRENT: 114 remaining**)
- [x] All component behavior still tested (no coverage loss)
- [x] Focus on semantic HTML, accessibility, and user interactions
- [x] Tests no longer break when updating Tailwind classes
- [x] All tests pass after refactoring
- [x] Coverage remains ≥70%

## Files to Create/Modify

### Files to Modify (Priority Order)
1. `src/components/ui/__tests__/button-studio.test.tsx` (24 assertions)
2. `src/components/landing/__tests__/hero-section.test.tsx` (18 assertions)
3. `src/components/pricing/__tests__/pricing-card.test.tsx` (14 assertions)
4. `src/components/landing/__tests__/how-it-works-section.test.tsx` (12 assertions)
5. `src/components/landing/__tests__/examples-section.test.tsx` (~10 assertions)
6. `src/components/landing/__tests__/footer.test.tsx` (~10 assertions)
7. `src/components/landing/__tests__/final-cta-section.test.tsx` (~8 assertions)
8. `src/components/legal/__tests__/legal-page-template.test.tsx` (8 assertions)
9. Additional 10-15 files with 1-5 assertions each

### Files to Create
- None (modifying existing tests)

## Dependencies

**Internal:**
- Bun test framework (already installed)
- @testing-library/react (already installed)
- @testing-library/user-event (already installed)

**External:**
- None

## Testing Strategy

**Before refactoring each file:**
```bash
# Run current tests to establish baseline
bun test src/components/ui/__tests__/button-studio.test.tsx

# Note current coverage
bun test --coverage src/components/ui/__tests__/button-studio.test.tsx
```

**After refactoring:**
```bash
# Verify all tests still pass
bun test src/components/ui/__tests__/button-studio.test.tsx

# Verify coverage didn't decrease
bun test --coverage src/components/ui/__tests__/button-studio.test.tsx

# Visual verification
npm run dev
# Manually test component still works correctly
```

**Track progress:**
```bash
# Count remaining class assertions
grep -r "classList.contains" src --include="*.test.tsx" | wc -l

# Goal: Reduce from 171 to <10
```

## Estimated Effort

- Task 1 (button-studio): **1-2 hours** ✅
- Task 2 (hero-section): **1-2 hours** ✅
- Task 3 (pricing-card): **1 hour** ✅
- Task 4 (how-it-works): **1 hour** ✅
- Task 5-6, 8 (medium files): **3-4 hours** ✅
- Task 7 (final-cta-section): **1 hour** 🔄
- Task 9 (batch remaining): **2-3 hours** 🔄
- Task 10-11 (add interactions): **2-3 hours** ⏳

**Total: 12-18 hours (2-3 days) - ~8-12 hours completed so far**

## Success Metrics

- **Brittleness reduced**: Tests don't break when updating Tailwind config
- **Maintainability**: Clear what behavior is tested, not implementation
- **Coverage maintained**: No reduction in code coverage
- **Quality increase**: Tests focus on user value (interactions, accessibility, data)
- **CSS assertions**: Reduced from 171 to <10

## Next Steps

After completing Phase 3, proceed to:
- **Phase 4: Form and Error Tests** (user experience coverage)
- **Phase 5: Test Suite Cleanup** (remove low-value tests)
