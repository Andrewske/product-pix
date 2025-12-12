# Test Suite Fixes - Phase 4: UX Coverage (Forms, Errors, Interactions)

## Overview
Add comprehensive user experience testing for forms, error boundaries, error states, and interactive components. These tests ensure the application handles user interactions and edge cases gracefully.

**Priority: MEDIUM** - Improves user experience confidence and catches UX bugs.

**Status: IN PROGRESS** - Batch 1 completed (FormField validation/accessibility tests + Login form integration tests)

## Architecture Decisions

### Form Testing Strategy
- **User-centric**: Test from user's perspective (type, submit, see errors)
- **Validation flow**: Test client-side validation before submission
- **Error recovery**: Test that users can correct errors and retry
- **Accessibility**: Test keyboard navigation and screen reader support

### Error Boundary Testing Strategy
- **Error scenarios**: Component errors, async errors, render errors
- **Fallback UI**: Verify error boundary shows meaningful fallback
- **Error reporting**: Verify errors are logged/reported correctly
- **Recovery**: Test that app recovers gracefully after errors

### Interaction Testing Strategy
- **Mouse and keyboard**: Test both input methods
- **Touch**: Test mobile interactions where applicable
- **State changes**: Verify UI updates reflect state changes
- **Loading states**: Test loading indicators and disabled states

## Implementation Tasks

### Phase 4A: Form Testing

#### Task 1: FormField Component Tests
- [x] Add comprehensive input validation tests
  - Files: `src/components/forms/__tests__/form-field.test.tsx` (modify)
  - Current: Only basic rendering tests
  - Add tests:
    - User types in text input → value updates
    - Required field validation (empty → error)
    - Email validation (invalid format → error)
    - Number validation (out of range → error)
    - Error message display and clarity
    - Error cleared after correction
    - Disabled state prevents input
  - Acceptance: All validation paths tested

- [x] Add accessibility tests for FormField
  - Files: `src/components/forms/__tests__/form-field.test.tsx` (modify)
  - Tests:
    - Label properly associated with input
    - Error announced to screen readers (aria-describedby)
    - Required fields marked with aria-required
    - Invalid fields marked with aria-invalid
    - Keyboard navigation (tab order)
  - Acceptance: Full a11y coverage

#### Task 2: Form Submission Flow Tests
- [x] Create login form integration test
  - Files: `src/components/auth/__tests__/login-form.integration.test.tsx` (new)
  - Tests:
    - Valid email + password → submit succeeds
    - Invalid email → validation error before submit
    - Empty password → validation error
    - Server error → error message displayed
    - Loading state during submission
    - Form disabled during submission
    - Success redirects to dashboard
  - Acceptance: Complete login flow tested

- [ ] Create signup form integration test
  - Files: `src/components/auth/__tests__/signup-form.integration.test.tsx` (new)
  - Tests:
    - Password confirmation mismatch → error
    - Weak password → validation error
    - Email already exists → server error handling
    - Terms acceptance required
    - Success creates account and logs in
  - Acceptance: Complete signup flow tested

#### Task 3: AspectRatioSelector Tests
- [ ] Add user interaction tests
  - Files: `src/components/forms/__tests__/aspect-ratio-selector.test.tsx` (modify)
  - Current: Basic rendering only
  - Add tests:
    - User clicks ratio option → selection updates
    - Selected option visually indicated
    - Selection triggers onChange callback
    - Keyboard navigation between options
    - Default selection on mount
  - Acceptance: Selector interaction fully tested

### Phase 4B: Error Boundary Tests

#### Task 4: Error Boundary Component Tests
- [ ] Implement error boundary test suite
  - Files: `src/app/__tests__/error.test.tsx` (modify)
  - Current: Empty placeholder (4 tests that do nothing)
  - Add tests:
    - Component throws error → boundary catches it
    - Fallback UI displays error message
    - "Try again" button resets error boundary
    - Error is logged to console/service
    - Boundary doesn't catch errors outside tree
  - Acceptance: Error boundary fully functional

- [ ] Test error boundary with async errors
  - Files: `src/app/__tests__/error.test.tsx` (modify)
  - Tests:
    - Promise rejection in useEffect → caught
    - Async component error → caught
    - Network error during data fetch → caught
  - Acceptance: Async error handling tested

#### Task 5: Component Error States
- [ ] Add error state tests for image components
  - Files: `src/components/__tests__/before-after-slider.test.tsx` (modify)
  - Current: Only 2 tests (very thin)
  - Add tests:
    - Image load failure → placeholder shown
    - Missing image URL → error message
    - Invalid image format → error handling
    - Slow loading → loading indicator
  - Acceptance: All error scenarios covered

- [ ] Add error state tests for data fetching components
  - Files: Create tests for components that fetch data
  - Tests:
    - Network error → retry button shown
    - 404 error → "not found" message
    - 500 error → generic error message
    - Timeout → timeout message
  - Acceptance: Network error UX tested

### Phase 4C: Interactive Component Tests

#### Task 6: Before/After Slider Interaction Tests
- [ ] Expand slider interaction testing
  - Files: `src/components/__tests__/before-after-slider.test.tsx` (modify)
  - Current: Only 2 tests (minimal coverage)
  - Add tests:
    - Drag slider handle → position updates
    - Click on image → slider moves to click position
    - Keyboard arrow keys → slider moves
    - Touch drag (mobile) → position updates
    - Slider constrained to valid range (0-100%)
    - Before/after images swap positions
  - Acceptance: Full slider interaction tested

#### Task 7: Pricing Section Interaction Tests
- [ ] Add credit pack selection tests
  - Files: `src/components/landing/__tests__/pricing-section.test.tsx` (modify)
  - Add tests:
    - User clicks pack → selection state updates
    - Only one pack selected at a time
    - Selected pack highlighted visually
    - Purchase button uses correct price ID
    - Discount badge shown for best value
  - Acceptance: Pack selection UX tested

#### Task 8: Modal/Dialog Interaction Tests
- [ ] Create modal interaction test suite (if modals exist)
  - Files: `src/components/ui/__tests__/modal.test.tsx` (new)
  - Tests:
    - Open modal → content visible, background dimmed
    - Close button → modal closes
    - Escape key → modal closes
    - Click outside → modal closes (if enabled)
    - Focus trap → tab cycles within modal
    - Modal open → body scroll locked
  - Acceptance: Modal UX fully tested

### Phase 4D: Loading and Async States

#### Task 9: Loading State Tests
- [ ] Add loading indicator tests
  - Files: Multiple components with loading states
  - Tests:
    - Data loading → spinner/skeleton shown
    - Loading complete → content replaces loader
    - Loading error → error message, no loader
    - Slow loading → loading shown after delay (avoid flicker)
  - Acceptance: Loading UX tested

#### Task 10: Async Button States
- [ ] Test button loading states
  - Files: `src/components/ui/__tests__/button-studio.test.tsx` (modify)
  - Tests:
    - Click starts async action → button shows loading
    - Button disabled during loading
    - Loading complete → button enabled again
    - Error during action → button shows error state
    - Loading timeout → error state
  - Acceptance: Async button states tested

### Phase 4E: Accessibility Testing

#### Task 11: Keyboard Navigation Tests
- [ ] Create keyboard navigation test suite
  - Files: `src/__tests__/a11y/keyboard-navigation.test.tsx` (new)
  - Tests:
    - Tab key → moves through interactive elements
    - Shift+Tab → moves backward
    - Enter/Space → activates buttons
    - Arrow keys → navigate lists/grids
    - Escape → closes modals/dropdowns
    - Focus visible → focus indicator shown
  - Acceptance: Full keyboard navigation tested

#### Task 12: Screen Reader Tests
- [ ] Add ARIA live region tests
  - Files: Components with dynamic content
  - Tests:
    - Error message → aria-live="polite" announces
    - Success message → aria-live="polite" announces
    - Loading state → aria-busy="true"
    - Form validation → aria-invalid and aria-describedby
  - Acceptance: Screen reader support tested

## Detailed Implementation Examples

### Example 1: FormField Validation Tests

**File:** `src/components/forms/__tests__/form-field.test.tsx`

```typescript
import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from '../form-field';

describe('FormField - Validation', () => {
  it('shows error when required field is empty', async () => {
    const user = userEvent.setup();

    render(
      <FormField
        name="email"
        label="Email"
        type="email"
        required
        error=""
      />
    );

    const input = screen.getByLabelText('Email');

    // Focus and blur without entering value
    await user.click(input);
    await user.tab(); // Move focus away

    // Error should be displayed
    const error = screen.getByText(/required/i);
    expect(error).toBeDefined();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(
      <FormField
        name="email"
        label="Email"
        type="email"
      />
    );

    const input = screen.getByLabelText('Email') as HTMLInputElement;

    // Enter invalid email
    await user.type(input, 'notanemail');
    await user.tab();

    // Should show format error
    const error = screen.getByText(/valid email/i);
    expect(error).toBeDefined();
  });

  it('clears error when user corrects input', async () => {
    const user = userEvent.setup();

    render(
      <FormField
        name="email"
        label="Email"
        type="email"
        required
      />
    );

    const input = screen.getByLabelText('Email') as HTMLInputElement;

    // Trigger error
    await user.click(input);
    await user.tab();
    expect(screen.queryByText(/required/i)).toBeDefined();

    // Correct the error
    await user.type(input, 'valid@email.com');
    await user.tab();

    // Error should be gone
    expect(screen.queryByText(/required/i)).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('prevents input when disabled', async () => {
    const user = userEvent.setup();

    render(
      <FormField
        name="email"
        label="Email"
        disabled
      />
    );

    const input = screen.getByLabelText('Email') as HTMLInputElement;

    // Try to type
    await user.type(input, 'test');

    // Value should remain empty
    expect(input.value).toBe('');
    expect(input.hasAttribute('disabled')).toBe(true);
  });
});
```

---

### Example 2: Error Boundary Tests

**File:** `src/app/__tests__/error.test.tsx`

```typescript
import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../error';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('Error Boundary', () => {
  it('catches component errors and shows fallback UI', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = mock(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error fallback, not the component
    expect(screen.queryByText('No error')).toBeNull();
    expect(screen.getByText(/something went wrong/i)).toBeDefined();

    console.error = originalError;
  });

  it('shows "Try again" button that resets boundary', async () => {
    const user = userEvent.setup();
    console.error = mock(() => {});

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(screen.getByText(/something went wrong/i)).toBeDefined();

    // Click "Try again" button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('No error')).toBeDefined();
  });

  it('does not catch errors outside its tree', () => {
    // Errors outside the boundary should propagate
    const OutsideError = () => {
      throw new Error('Outside error');
    };

    expect(() => {
      render(
        <>
          <ErrorBoundary>
            <div>Protected content</div>
          </ErrorBoundary>
          <OutsideError />
        </>
      );
    }).toThrow('Outside error');
  });
});
```

---

### Example 3: Slider Interaction Tests

**File:** `src/components/__tests__/before-after-slider.test.tsx`

```typescript
import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BeforeAfterSlider } from '../before-after-slider';

describe('BeforeAfterSlider - Interactions', () => {
  const mockProps = {
    beforeImage: '/before.jpg',
    afterImage: '/after.jpg',
    alt: 'Product comparison',
  };

  it('updates slider position on drag', async () => {
    const user = userEvent.setup();
    const { container } = render(<BeforeAfterSlider {...mockProps} />);

    const handle = container.querySelector('[role="slider"]') as HTMLElement;
    expect(handle).toBeDefined();

    // Simulate drag to 75% position
    await user.pointer([
      { target: handle, keys: '[MouseLeft>]' },
      { coords: { x: 300, y: 0 } }, // Assuming 400px width
    ]);

    // Check slider position updated
    expect(handle.getAttribute('aria-valuenow')).toBe('75');
  });

  it('responds to keyboard arrow keys', async () => {
    const { container } = render(<BeforeAfterSlider {...mockProps} />);

    const handle = container.querySelector('[role="slider"]') as HTMLElement;
    handle.focus();

    // Press right arrow 5 times (should move slider right)
    await userEvent.keyboard('{ArrowRight>5}');

    const position = parseInt(handle.getAttribute('aria-valuenow') || '50');
    expect(position).toBeGreaterThan(50);
  });

  it('shows placeholder when image fails to load', () => {
    render(<BeforeAfterSlider beforeImage="" afterImage="" alt="Test" />);

    // Should show error state or placeholder
    const placeholder = screen.getByText(/failed to load/i);
    expect(placeholder).toBeDefined();
  });

  it('constrains slider to valid range (0-100)', async () => {
    const user = userEvent.setup();
    const { container } = render(<BeforeAfterSlider {...mockProps} />);

    const handle = container.querySelector('[role="slider"]') as HTMLElement;

    // Try to drag beyond right edge
    await user.pointer([
      { target: handle, keys: '[MouseLeft>]' },
      { coords: { x: 99999, y: 0 } }, // Way past edge
    ]);

    // Should be constrained to 100
    expect(handle.getAttribute('aria-valuenow')).toBe('100');
  });
});
```

## Acceptance Criteria

- [x] FormField component has comprehensive validation tests
- [x] Login form has complete integration tests
- [ ] Signup form has complete integration tests
- [ ] Error boundaries tested for all error scenarios
- [ ] Interactive components (sliders, modals) fully tested
- [ ] Loading and async states tested
- [ ] Keyboard navigation fully tested
- [ ] Screen reader announcements tested
- [ ] All tests pass consistently
- [ ] Coverage for UX components ≥80%

## Files to Create/Modify

### Files to Modify
- `src/components/forms/__tests__/form-field.test.tsx`
- `src/components/forms/__tests__/aspect-ratio-selector.test.tsx`
- `src/app/__tests__/error.test.tsx`
- `src/components/__tests__/before-after-slider.test.tsx`
- `src/components/landing/__tests__/pricing-section.test.tsx`
- `src/components/ui/__tests__/button-studio.test.tsx`

### Files to Create
- ✅ `src/components/auth/__tests__/login-form.integration.test.tsx` (created)
- `src/components/auth/__tests__/signup-form.integration.test.tsx`
- `src/components/ui/__tests__/modal.test.tsx` (if modals exist)
- `src/__tests__/a11y/keyboard-navigation.test.tsx`

## Dependencies

**Internal:**
- Bun test framework
- @testing-library/react
- @testing-library/user-event
- happy-dom (for DOM simulation)

**External:**
- None (all dependencies already installed)

## Testing Strategy

**User event simulation:**
```typescript
// Always setup user event for realistic interactions
const user = userEvent.setup();

// Type text
await user.type(input, 'Hello');

// Click
await user.click(button);

// Tab navigation
await user.tab();

// Keyboard shortcuts
await user.keyboard('{Escape}');
```

**Async state testing:**
```typescript
// Wait for async updates
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeDefined();
});

// Or use findBy queries (built-in waiting)
const element = await screen.findByText('Loaded');
```

## Estimated Effort

- Task 1 (FormField): **2-3 hours**
- Task 2 (Form flows): **3-4 hours**
- Task 3 (AspectRatio): **1 hour**
- Task 4 (Error boundary): **2-3 hours**
- Task 5 (Error states): **2 hours**
- Task 6 (Slider): **2-3 hours**
- Task 7 (Pricing): **1-2 hours**
- Task 8 (Modal): **2 hours**
- Task 9 (Loading): **2 hours**
- Task 10 (Async buttons): **1 hour**
- Task 11 (Keyboard): **3 hours**
- Task 12 (Screen reader): **2 hours**

**Total: 23-32 hours (3-4 days)**

## Success Metrics

- **UX confidence**: All user interactions tested
- **Error handling**: No uncaught errors reach users
- **Accessibility**: Full keyboard and screen reader support verified
- **Form quality**: Validation prevents bad data submission
- **Coverage**: 80%+ for interactive components

## Next Steps

After completing Phase 4, proceed to:
- **Phase 5: Test Suite Cleanup** (remove low-value tests, consolidate)
