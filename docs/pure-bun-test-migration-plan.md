# Pure Bun Test Migration Implementation Plan

## Overview
Migrate entire test suite from mixed Jest/custom matchers to pure Bun test framework for consistency, performance, and maintainability. Current state: 50% pure Bun (lib tests), 50% custom matchers (component tests). Goal: 100% pure Bun.

## Architecture Decisions

### Decision 1: Keep @testing-library/react
**Rationale:** The `render()`, `screen`, and query utilities from testing-library are framework-agnostic and work well with Bun. Only removing jest-dom matchers, not the rendering utilities.

### Decision 2: Batch Migration Approach
**Rationale:** Migrate in 5 batches from simple to complex to minimize risk. Validate each batch before proceeding to ensure no test coverage loss.

### Decision 3: No Helper Functions Initially
**Rationale:** Start with direct Bun matchers. Only add helper functions if patterns become too verbose after migration is complete.

### Decision 4: Remove Custom Matchers Completely
**Rationale:** Custom matchers add maintenance burden and conflict with Bun's native types. Pure Bun matchers are sufficient and more maintainable.

## Implementation Tasks

### Phase 1: Fix Immediate TypeScript Errors (Baseline)

- [ ] Update bun-test.d.ts type definitions
  - Files: `src/types/bun-test.d.ts` (modify)
  - Action: Remove conflicting custom type definitions, keep only minimal augmentations
  - Tests: Run `bun tsc --noEmit` to verify no errors
  - Acceptance: TypeScript compiles without errors

- [ ] Fix improve-validation.test.ts mock typing
  - Files: `prompt-bench/__tests__/improve-validation.test.ts` (modify)
  - Action: Update mock.fn() usage with proper generic types
  - Tests: `bun test prompt-bench/__tests__/improve-validation.test.ts`
  - Acceptance: Test passes, no TypeScript errors

- [ ] Fix shared.test.ts mock.module typing
  - Files: `prompt-bench/__tests__/shared.test.ts` (modify)
  - Action: Update mock.module() usage with proper types
  - Tests: `bun test prompt-bench/__tests__/shared.test.ts`
  - Acceptance: Test passes, no TypeScript errors

- [ ] Remove 'as any' cast in stripe/credits.ts
  - Files: `src/lib/stripe/credits.ts` (modify)
  - Action: Replace `'stripe_purchases' as any` with proper Supabase typing
  - Tests: `bun test src/lib/stripe/__tests__/credits.test.ts`
  - Acceptance: No TypeScript errors, tests pass

### Phase 2: Migrate Component Tests - Batch 1 (Simple Components)

- [ ] Migrate auth-divider.test.tsx
  - Files: `src/components/auth/__tests__/auth-divider.test.tsx` (modify)
  - Pattern: Replace `toBeInTheDocument()` → `expect(element).not.toBeNull()`
  - Pattern: Replace `toHaveClass('foo')` → `expect(element?.classList.contains('foo')).toBe(true)`
  - Tests: `bun test src/components/auth/__tests__/auth-divider.test.tsx`
  - Acceptance: All 7 tests pass, assertions verify same behavior

- [ ] Migrate mdx/callout.test.tsx
  - Files: `src/components/help/__tests__/mdx/callout.test.tsx` (modify)
  - Pattern: Replace custom matchers with pure Bun equivalents
  - Tests: `bun test src/components/help/__tests__/mdx/callout.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate legal-page-template.test.tsx
  - Files: `src/components/legal/__tests__/legal-page-template.test.tsx` (modify)
  - Pattern: Replace custom matchers with pure Bun equivalents
  - Tests: `bun test src/components/legal/__tests__/legal-page-template.test.tsx`
  - Acceptance: All 5 tests pass

### Phase 3: Migrate Component Tests - Batch 2 (Form Components)

- [ ] Migrate form-field.test.tsx
  - Files: `src/components/forms/__tests__/form-field.test.tsx` (modify)
  - Pattern: Replace `toHaveAttribute('name', 'value')` → `expect(el?.getAttribute('name')).toBe('value')`
  - Pattern: Replace `toHaveClass()` with `classList.contains()`
  - Tests: `bun test src/components/forms/__tests__/form-field.test.tsx`
  - Acceptance: All tests pass, attribute checking works correctly

- [ ] Migrate aspect-ratio-selector.test.tsx
  - Files: `src/components/forms/__tests__/aspect-ratio-selector.test.tsx` (modify)
  - Pattern: Replace class checks with pure Bun matchers
  - Tests: `bun test src/components/forms/__tests__/aspect-ratio-selector.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate upload-form.test.tsx (if exists)
  - Files: `src/components/forms/__tests__/upload-form.test.tsx` (modify)
  - Pattern: Replace form state matchers (`toBeDisabled()`) with `(el as HTMLInputElement).disabled`
  - Tests: `bun test src/components/forms/__tests__/upload-form.test.tsx`
  - Acceptance: All tests pass

### Phase 4: Migrate Component Tests - Batch 3 (Complex UI Components)

- [ ] Migrate button-studio.test.tsx
  - Files: `src/components/ui/__tests__/button-studio.test.tsx` (modify)
  - Pattern: Replace `jest.fn()` → `mock(() => {})`
  - Pattern: Replace custom DOM matchers with pure Bun
  - Tests: `bun test src/components/ui/__tests__/button-studio.test.tsx`
  - Acceptance: All tests pass, mocking works correctly

- [ ] Migrate alert-box.test.tsx
  - Files: `src/components/ui/__tests__/alert-box.test.tsx` (modify)
  - Pattern: Mixed assertion migration
  - Tests: `bun test src/components/ui/__tests__/alert-box.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate hero-section.test.tsx (139 assertions)
  - Files: `src/components/landing/__tests__/hero-section.test.tsx` (modify)
  - Pattern: Bulk replace toHaveClass, toBeInTheDocument, toHaveAttribute
  - Tests: `bun test src/components/landing/__tests__/hero-section.test.tsx`
  - Acceptance: All tests pass, no assertion count loss

### Phase 5: Migrate Component Tests - Batch 4 (Landing Pages)

- [ ] Migrate examples-section.test.tsx
  - Files: `src/components/landing/__tests__/examples-section.test.tsx` (modify)
  - Pattern: Heavy custom matcher usage → pure Bun
  - Tests: `bun test src/components/landing/__tests__/examples-section.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate pricing-section.test.tsx
  - Files: `src/components/landing/__tests__/pricing-section.test.tsx` (modify)
  - Pattern: Complex interactions → pure Bun
  - Tests: `bun test src/components/landing/__tests__/pricing-section.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate footer.test.tsx
  - Files: `src/components/landing/__tests__/footer.test.tsx` (modify)
  - Pattern: Link checks → getAttribute() assertions
  - Tests: `bun test src/components/landing/__tests__/footer.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate final-cta-section.test.tsx
  - Files: `src/components/landing/__tests__/final-cta-section.test.tsx` (modify)
  - Pattern: Text content and attribute checks
  - Tests: `bun test src/components/landing/__tests__/final-cta-section.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate how-it-works-section.test.tsx
  - Files: `src/components/landing/__tests__/how-it-works-section.test.tsx` (modify)
  - Pattern: Mixed matchers → pure Bun
  - Tests: `bun test src/components/landing/__tests__/how-it-works-section.test.tsx`
  - Acceptance: All tests pass

### Phase 6: Migrate Component Tests - Batch 5 (Remaining Files)

- [ ] Migrate auth-layout.test.tsx
  - Files: `src/components/auth/__tests__/auth-layout.test.tsx` (modify)
  - Pattern: Standard migration patterns
  - Tests: `bun test src/components/auth/__tests__/auth-layout.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate before-after-slider.test.tsx
  - Files: `src/components/__tests__/before-after-slider.test.tsx` (modify)
  - Pattern: Image attribute checks
  - Tests: `bun test src/components/__tests__/before-after-slider.test.tsx`
  - Acceptance: All tests pass

- [ ] Migrate remaining component test files
  - Files: All remaining `src/components/**/__tests__/*.test.tsx` files (modify)
  - Count: ~13 remaining files
  - Pattern: Apply appropriate migration patterns from above
  - Tests: `bun test src/components`
  - Acceptance: All component tests pass

### Phase 7: Cleanup and Documentation

- [ ] Remove @testing-library/jest-dom dependency
  - Files: `package.json` (modify)
  - Action: `bun remove @testing-library/jest-dom`
  - Tests: `bun install` succeeds
  - Acceptance: Package removed, no dependency errors

- [ ] Update bun-test-setup.ts
  - Files: `bun-test-setup.ts` (modify)
  - Action: Remove expect.extend() custom matchers, keep happy-dom setup and env vars
  - Tests: `bun test` runs successfully
  - Acceptance: Tests still pass without custom matchers

- [ ] Delete obsolete type definitions
  - Files: `src/types/bun-test.d.ts` (delete if fully obsolete)
  - Action: Remove if no longer needed after migration
  - Tests: `bun tsc --noEmit`
  - Acceptance: TypeScript compiles without custom matcher types

- [ ] Update CLAUDE.md testing documentation
  - Files: `CLAUDE.md` (modify)
  - Action: Add "Testing" section with pure Bun patterns and examples
  - Tests: Manual review
  - Acceptance: Clear examples of Bun test patterns documented

### Phase 8: Final Validation

- [ ] Run full test suite
  - Action: `bun test`
  - Acceptance: All 58 test files pass

- [ ] Verify TypeScript compilation
  - Action: `bun tsc --noEmit`
  - Acceptance: Zero TypeScript errors

- [ ] Check test coverage
  - Action: `bun test --coverage`
  - Acceptance: Coverage ≥ 70% maintained

- [ ] Measure test execution time
  - Action: Compare before/after test run times
  - Acceptance: Tests run faster or same speed

## Common Migration Patterns

### Pattern 1: DOM Existence
```typescript
// BEFORE
expect(element).toBeInTheDocument();

// AFTER
expect(element).not.toBeNull();
expect(element).toBeDefined();
```

### Pattern 2: Attributes
```typescript
// BEFORE
expect(button).toHaveAttribute('href', '/login');
expect(button).toHaveAttribute('disabled');

// AFTER
expect(button?.getAttribute('href')).toBe('/login');
expect(button?.hasAttribute('disabled')).toBe(true);
```

### Pattern 3: CSS Classes
```typescript
// BEFORE
expect(element).toHaveClass('active', 'primary');

// AFTER
expect(element?.classList.contains('active')).toBe(true);
expect(element?.classList.contains('primary')).toBe(true);
```

### Pattern 4: Text Content
```typescript
// BEFORE
expect(element).toHaveTextContent('Hello');
expect(element).toHaveTextContent(/hello/i);

// AFTER
expect(element?.textContent).toContain('Hello');
expect(element?.textContent).toMatch(/hello/i);
```

### Pattern 5: Visibility
```typescript
// BEFORE
expect(element).toBeVisible();

// AFTER
const style = window.getComputedStyle(element);
expect(style.display).not.toBe('none');
expect(style.visibility).not.toBe('hidden');
```

### Pattern 6: Form State
```typescript
// BEFORE
expect(input).toBeDisabled();
expect(input).toBeEnabled();

// AFTER
expect((input as HTMLInputElement).disabled).toBe(true);
expect((input as HTMLInputElement).disabled).toBe(false);
```

### Pattern 7: Mock Functions
```typescript
// BEFORE
const mockFn = jest.fn();
jest.mock('@/lib/auth');

// AFTER
import { mock } from 'bun:test';
const mockFn = mock(() => {});
mock.module('@/lib/auth', () => ({ ... }));
```

## Acceptance Criteria

✅ All 58 test files use pure Bun matchers (no custom matchers)
✅ Zero TypeScript errors (`bun tsc --noEmit`)
✅ All tests pass (`bun test`)
✅ @testing-library/jest-dom removed from package.json
✅ Custom matchers removed from bun-test-setup.ts
✅ CLAUDE.md updated with Bun testing patterns
✅ Test execution time improved or maintained
✅ Test coverage ≥70% maintained

## Files to Create/Modify

### Files to Modify (Phase 1 - TypeScript Fixes)
- `src/types/bun-test.d.ts`
- `prompt-bench/__tests__/improve-validation.test.ts`
- `prompt-bench/__tests__/shared.test.ts`
- `src/lib/stripe/credits.ts`

### Files to Modify (Phase 2-6 - Component Tests)
- `src/components/auth/__tests__/auth-divider.test.tsx`
- `src/components/help/__tests__/mdx/callout.test.tsx`
- `src/components/legal/__tests__/legal-page-template.test.tsx`
- `src/components/forms/__tests__/form-field.test.tsx`
- `src/components/forms/__tests__/aspect-ratio-selector.test.tsx`
- `src/components/ui/__tests__/button-studio.test.tsx`
- `src/components/ui/__tests__/alert-box.test.tsx`
- `src/components/landing/__tests__/hero-section.test.tsx`
- `src/components/landing/__tests__/examples-section.test.tsx`
- `src/components/landing/__tests__/pricing-section.test.tsx`
- `src/components/landing/__tests__/footer.test.tsx`
- `src/components/landing/__tests__/final-cta-section.test.tsx`
- `src/components/landing/__tests__/how-it-works-section.test.tsx`
- `src/components/auth/__tests__/auth-layout.test.tsx`
- `src/components/__tests__/before-after-slider.test.tsx`
- All remaining `src/components/**/__tests__/*.test.tsx` files (~13 files)

### Files to Modify (Phase 7 - Cleanup)
- `package.json` (remove @testing-library/jest-dom)
- `bun-test-setup.ts` (remove custom matchers)
- `CLAUDE.md` (add testing documentation)

### Files to Delete (Phase 7 - Cleanup)
- `src/types/bun-test.d.ts` (if no longer needed)

## Dependencies

### External Dependencies (Keep)
- `@testing-library/react` - Component rendering utilities
- `@testing-library/user-event` - User interaction simulation
- `@happy-dom/global-registrator` - DOM environment for tests
- `bun` - Test runner and TypeScript runtime

### External Dependencies (Remove)
- `@testing-library/jest-dom` - Incompatible with Bun, replaced by pure Bun matchers

### Internal Dependencies
- Phase 1 must complete before Phase 2 (need clean TypeScript baseline)
- Each batch in Phases 2-6 should complete before starting next batch
- Phase 7 cleanup must wait until all tests migrated (Phases 2-6 complete)
- Phase 8 validation is final step after all changes

## Estimated Effort
- Phase 1: 30 minutes
- Phases 2-6: 2-3 days (depending on test complexity)
- Phase 7: 15 minutes
- Phase 8: 10 minutes
- **Total: 2-3 days**

## Risk Mitigation
1. **Batch approach**: Small incremental changes reduce risk
2. **Validation after each batch**: Catch issues early
3. **Keep testing-library utilities**: Only migrating matchers, not rendering
4. **Parallel development**: Can continue feature work during migration
