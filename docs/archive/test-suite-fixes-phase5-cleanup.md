# Test Suite Fixes - Phase 5: Test Suite Cleanup

## Overview
Remove low-value tests, consolidate overlapping tests, and simplify test utilities. This phase reduces maintenance burden without losing meaningful coverage.

**Priority: LOW** - Nice to have, but lower impact than other phases.

## Architecture Decisions

### Cleanup Strategy
- **Remove**: Tests that only verify library/framework behavior
- **Remove**: Trivial "it renders" tests with no assertions
- **Consolidate**: Overlapping tests across multiple files
- **Simplify**: Over-engineered test utilities that add complexity
- **Preserve**: Any test that verifies business logic or user-facing behavior

### What to Remove vs Keep

**REMOVE:**
- Tests that only verify React works (`expect(screen.getByText('X')).toBeDefined()`)
- Tests that only verify TypeScript types (covered by compiler)
- Duplicate scenarios across test files
- Tests for getter/setter methods with no logic

**KEEP:**
- Business logic tests (calculations, transformations)
- User interaction tests (clicks, forms, navigation)
- Error handling tests
- Accessibility tests
- Integration tests

## Implementation Tasks

### Phase 5A: Remove Trivial Tests

#### Task 1: Identify Trivial "It Renders" Tests
- [ ] Scan codebase for minimal-value tests
  - Files: All test files
  - Pattern to find: Tests with only `expect(screen.getByText(...)).toBeDefined()`
  - Create inventory: List files with trivial tests
  - Acceptance: Complete list of candidates for removal

#### Task 2: Remove Pure Rendering Tests
- [ ] Remove tests that only verify component renders
  - Files: Multiple component test files
  - Examples:
    - `it('renders the divider text')` - Only checks "or" text exists
    - `it('renders without crashing')` - No assertions
    - `it('displays the heading')` - Only checks heading exists
  - Keep: Tests that verify correct data, state, or behavior
  - Acceptance: <20 pure "renders X" tests remain

#### Task 3: Remove Library Behavior Tests
- [ ] Remove tests that verify React/library behavior
  - Files: Component test files
  - Examples:
    - Testing that `<img src={...}>` renders with correct src (React's job)
    - Testing that CSS classes apply (Tailwind's job)
    - Testing that props are passed through (React's job)
  - Acceptance: Only ProductPix behavior tested, not libraries

### Phase 5B: Consolidate Overlapping Tests

#### Task 4: Consolidate Pricing Tests
- [ ] Merge overlapping pricing test files
  - Files:
    - `src/lib/pricing/__tests__/calculator.test.ts`
    - `src/lib/pricing/__tests__/models.test.ts`
    - `src/lib/pricing/__tests__/integration.test.ts`
  - Current: 3 files test similar scenarios with different mocking
  - Strategy:
    - Keep `integration.test.ts` for real pricing with actual config
    - Remove redundant unit tests that duplicate integration coverage
    - Fix 3 failing integration tests
  - Acceptance: Single source of truth for pricing tests

#### Task 5: Consolidate Legal Content Tests
- [ ] Merge or remove legal content tests
  - Files:
    - `src/data/legal/__tests__/terms-content.test.ts`
    - `src/data/legal/__tests__/privacy-content.test.ts`
  - Current: Only verify TypeScript types (compiler already does this)
  - Strategy: Remove entirely or merge into single validation test
  - Acceptance: Minimal or no tests for static legal content

#### Task 6: Consolidate Component Variant Tests
- [ ] Remove duplicate variant tests
  - Files: Button, card, and other component tests
  - Pattern: Same component tested in multiple files
  - Strategy: Test each variant once, in its primary test file
  - Acceptance: No duplicate variant coverage

### Phase 5C: Simplify Test Utilities

#### Task 7: Audit Test Utils Usage
- [ ] Analyze test-utils.ts usage across codebase
  - Files: `src/__tests__/test-utils.ts`
  - Analysis:
    - Which helpers are actually used?
    - Which add value vs complexity?
    - Which are broken or low-value?
  - Create report: Usage frequency and value assessment
  - Acceptance: Clear picture of utils value

#### Task 8: Remove or Simplify Low-Value Helpers
- [ ] Remove `testResponsiveBehavior` helper
  - Files: `src/__tests__/test-utils.ts` (modify)
  - Reason: Creates 4 tests per call, doesn't test real responsive behavior
  - Already addressed in Phase 3
  - Acceptance: Helper removed or significantly simplified

- [ ] Remove `testColorContrast` helper
  - Files: `src/__tests__/test-utils.ts` (modify)
  - Reason: Doesn't actually test color contrast, just that colors are defined
  - Has inverted logic bug (already fixed in Phase 1)
  - Acceptance: Helper removed

- [ ] Simplify `testAccessibility` helper
  - Files: `src/__tests__/test-utils.ts` (modify)
  - Current: Uses axe-core for automated a11y testing
  - Keep: This is valuable
  - Simplify: Add common test scenarios as presets
  - Acceptance: Helper remains but easier to use

- [ ] Simplify `testAnimationPerformance` helper
  - Files: `src/__tests__/test-utils.ts` (modify)
  - Current: Checks for transform usage
  - Reality: Doesn't actually test performance
  - Strategy: Remove or rename to `testHasAnimations`
  - Acceptance: Helper removed or renamed appropriately

#### Task 9: Remove Mock Performance API
- [ ] Remove `mockPerformanceAPI` and `testCoreWebVitals`
  - Files: `src/__tests__/test-utils.ts` (modify)
  - Reason: Doesn't actually measure Core Web Vitals
  - Alternative: Use real performance monitoring in E2E tests
  - Acceptance: Mock removed, documented for E2E testing instead

### Phase 5D: Improve Test Organization

#### Task 10: Reorganize Test Files
- [ ] Group related tests into describe blocks
  - Files: Test files with flat test structure
  - Pattern: Add logical grouping with describe blocks
  - Example:
    ```typescript
    // Before: Flat structure
    it('test 1', ...)
    it('test 2', ...)
    it('test 3', ...)

    // After: Organized
    describe('ComponentName', () => {
      describe('Rendering', () => {
        it('test 1', ...)
      });

      describe('Interactions', () => {
        it('test 2', ...)
      });

      describe('Error Handling', () => {
        it('test 3', ...)
      });
    });
    ```
  - Acceptance: Tests logically grouped and easier to navigate

#### Task 11: Standardize Test Names
- [ ] Ensure consistent test naming convention
  - Files: All test files
  - Pattern: `should [behavior] when [condition]` or `[action] -> [result]`
  - Examples:
    - ✅ `'validates email format when user types invalid email'`
    - ✅ `'user clicks submit -> form submits data'`
    - ❌ `'test email'` (too vague)
    - ❌ `'it works'` (meaningless)
  - Acceptance: All tests have descriptive names

### Phase 5E: Fix Failing Tests

#### Task 12: Fix 3 Failing Pricing Integration Tests
- [ ] Debug and fix failing integration tests
  - Files: `src/lib/pricing/__tests__/integration.test.ts`
  - Current failures:
    1. Expected 3, received 0.075 (model pricing mismatch)
    2. Expected 3, received 0.075 (validation fixture)
    3. Expected "anthropic", received "google" (prefix matching)
  - Root cause: Mocks don't match actual pricing config
  - Strategy: Use real pricing config instead of mocks
  - Acceptance: All pricing tests pass

#### Task 13: Investigate and Fix Other Failing Tests
- [ ] Review all test failures
  - Files: Run `bun test` and collect failures
  - Current: 37 failing tests out of 672
  - Categorize:
    - True bugs (fix in implementation)
    - Test bugs (fix in test)
    - Environment issues (fix setup)
  - Acceptance: <5 failing tests (95%+ pass rate)

## Detailed Implementation Examples

### Example 1: Remove Trivial Tests

**File:** `src/components/auth/__tests__/auth-divider.test.tsx`

**BEFORE (Low value):**
```typescript
describe('AuthDivider', () => {
  it('renders the divider', () => {
    render(<AuthDivider />);
    // Test passes if component doesn't throw
  });

  it('renders the divider text', () => {
    render(<AuthDivider />);
    expect(screen.getByText('or')).not.toBeNull();
  });

  it('has separator role', () => {
    render(<AuthDivider />);
    expect(screen.getByRole('separator')).not.toBeNull();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<AuthDivider className="custom" />);
    const divider = container.querySelector('[role="separator"]');
    expect(divider?.classList.contains('custom')).toBe(true);
  });
});
```

**AFTER (Removed or consolidated):**
```typescript
describe('AuthDivider', () => {
  it('provides accessible separator between auth methods', () => {
    render(<AuthDivider />);

    const separator = screen.getByRole('separator');
    expect(separator.textContent).toBe('or');
    expect(separator.getAttribute('aria-label')).toBe('or');
  });
});
```

**Removed:** 3 trivial tests
**Kept:** 1 meaningful test verifying accessibility and content

---

### Example 2: Consolidate Pricing Tests

**BEFORE: 3 separate files with overlapping coverage**

**File 1:** `calculator.test.ts` (mocked)
```typescript
it('should calculate costs correctly', () => {
  mockGetPricingForModel.mockReturnValue({ input: 3.0, output: 15.0 });
  const result = calculateCost('claude-sonnet-4', { input: 1_000_000, output: 500_000 });
  expect(result.inputCost).toBe(3.0);
});
```

**File 2:** `models.test.ts` (mocked)
```typescript
it('should return correct pricing for model', () => {
  const pricing = getPricingForModel('claude-sonnet-4');
  expect(pricing.input).toBe(3.0);
  expect(pricing.output).toBe(15.0);
});
```

**File 3:** `integration.test.ts` (real config)
```typescript
it('should calculate real pricing from config', () => {
  const cost = calculateCost('claude-sonnet-4', { input: 1_000_000, output: 500_000 });
  expect(cost.inputCost).toBeCloseTo(3.0, 2);
});
```

**AFTER: Single integration test file**

**File:** `pricing.integration.test.ts`
```typescript
import { describe, it, expect } from 'bun:test';
import { calculateCost, getPricingForModel } from '../';

describe('Pricing Integration', () => {
  it('calculates costs using real pricing config', () => {
    const cost = calculateCost('claude-sonnet-4-20250514', {
      input: 1_000_000,
      output: 500_000,
    });

    // Uses actual pricing from prompt-bench.toml
    expect(cost.provider).toBe('anthropic');
    expect(cost.inputCost).toBeCloseTo(3.0, 2);
    expect(cost.outputCost).toBeCloseTo(7.5, 2);
    expect(cost.total).toBeCloseTo(10.5, 2);
  });

  it('handles model prefix matching correctly', () => {
    // Test both exact and prefix matching
    const exactCost = calculateCost('gemini-3-pro-image-preview', {
      input: 1_000_000,
      output: 1_000_000,
    });

    const prefixCost = calculateCost('gemini-3-pro-image-preview-002', {
      input: 1_000_000,
      output: 1_000_000,
    });

    // Should use same pricing (prefix match)
    expect(exactCost.provider).toBe('google');
    expect(prefixCost.provider).toBe('google');
    expect(exactCost.inputCost).toBe(prefixCost.inputCost);
  });

  it('throws error for unknown models', () => {
    expect(() => {
      calculateCost('unknown-model-xyz', { input: 1000, output: 1000 });
    }).toThrow(/unknown model/i);
  });
});
```

**Result:** Removed 2 files, consolidated to 1 with real config

---

### Example 3: Simplify Test Utils

**File:** `src/__tests__/test-utils.ts`

**BEFORE (Complex, low value):**
```typescript
export const testColorContrast = (element: HTMLElement, minRatio = 4.5) => {
  if (typeof window !== 'undefined') {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;

    // This doesn't actually test contrast ratio!
    expect(backgroundColor).toBeDefined();
    expect(color).toBeDefined();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
    // Has inverted logic bug: .not.not.toBeNull()
  }
};

export const testAnimationPerformance = (container: HTMLElement) => {
  if (typeof window !== 'undefined') {
    const animatedElements = container.querySelectorAll('[style*="transform"]');
    animatedElements.forEach(element => {
      const style = window.getComputedStyle(element);
      expect(style.transform || style.willChange).toBeDefined();
    });
  }
};
```

**AFTER (Simplified or removed):**
```typescript
// testColorContrast REMOVED - doesn't test actual contrast
// testAnimationPerformance REMOVED - doesn't test actual performance

// Keep only valuable helpers:

/** Test component with axe-core for accessibility violations */
export const testAccessibility = async (component: React.ReactElement) => {
  const { container } = render(component);
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
};

/** Create authenticated test user for integration tests */
export const createTestUser = async (
  supabase: SupabaseClient,
  credits = 100
) => {
  // ... implementation
};
```

**Result:** Removed 2 misleading helpers, kept valuable ones

## Acceptance Criteria

- [ ] Trivial "it renders" tests reduced by 50%+
- [ ] No tests that only verify library/framework behavior
- [ ] Overlapping test files consolidated
- [ ] Test utils simplified to only valuable helpers
- [ ] All failing tests fixed or documented
- [ ] Pass rate ≥95% (currently 94%)
- [ ] Test execution time reduced by 10-15%

## Files to Create/Modify

### Files to Modify
- `src/__tests__/test-utils.ts` - Simplify helpers
- `src/lib/pricing/__tests__/integration.test.ts` - Fix failures
- Multiple component test files - Remove trivial tests
- `src/data/legal/__tests__/*.test.ts` - Remove or consolidate

### Files to Delete (Potential)
- `src/lib/pricing/__tests__/calculator.test.ts` (if consolidated)
- `src/lib/pricing/__tests__/models.test.ts` (if consolidated)
- `src/data/legal/__tests__/terms-content.test.ts` (if removed)
- `src/data/legal/__tests__/privacy-content.test.ts` (if removed)

### Files to Create
- None (this is pure cleanup)

## Dependencies

**Internal:**
- Bun test framework (already installed)
- Existing test infrastructure

**External:**
- None

## Testing Strategy

**Measure before:**
```bash
# Count total tests
bun test 2>&1 | grep -E "^\d+ pass"

# Measure execution time
time bun test

# Count trivial tests (rough estimate)
grep -r "it('renders" src --include="*.test.tsx" | wc -l
```

**After cleanup:**
```bash
# Verify fewer tests but same coverage
bun test --coverage

# Verify faster execution
time bun test

# Verify pass rate improved
bun test 2>&1 | grep -E "^\d+ pass"
```

## Estimated Effort

- Task 1 (Identify trivial): **1 hour**
- Task 2 (Remove trivial): **2-3 hours**
- Task 3 (Remove library tests): **1-2 hours**
- Task 4 (Consolidate pricing): **2 hours**
- Task 5 (Legal content): **30 min**
- Task 6 (Component variants): **1 hour**
- Task 7 (Audit utils): **1 hour**
- Task 8 (Simplify helpers): **2 hours**
- Task 9 (Remove mock perf): **30 min**
- Task 10 (Reorganize): **2-3 hours**
- Task 11 (Standardize names): **1-2 hours**
- Task 12 (Fix pricing tests): **2 hours**
- Task 13 (Fix other failures): **2-3 hours**

**Total: 18-25 hours (2-3 days)**

## Success Metrics

- **Test count reduction**: 672 → 600 tests (remove 10% low-value)
- **Pass rate increase**: 94% → 98%+
- **Execution time**: Reduced by 10-15%
- **Maintenance burden**: Easier to understand and modify tests
- **Coverage maintained**: No reduction in meaningful coverage

## Next Steps

After completing Phase 5:
- **All phases complete!**
- Monitor test suite health over time
- Add new tests following best practices from these phases
- Periodic cleanup as codebase evolves
