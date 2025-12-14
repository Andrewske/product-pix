# Feedback System Code Review Fixes

## Overview
Address all action items from code review of commit `01c4580` (image feedback system).

## Task Sequence

Execute in order (dependencies flow downward):

### 1. [Fix Duplicate Buttons](./01-fix-duplicate-buttons.md)
**File**: `src/components/image-card.tsx`

Remove duplicate download/favorite/refund buttons. Quick win that fixes visible bug.

---

### 2. [Type Guards and API Security](./02-type-guards-and-api-security.md)
**Files**: `src/lib/validation/feedback.ts` (new), `src/app/api/images/[id]/feedback/route.ts`

Create type guards for feedback reasons, replace `as any` casts, add ownership checks.

---

### 3. [Hook Error Handling and Toast Integration](./03-hook-error-handling.md)
**Files**: `src/hooks/use-image-feedback.ts`, `src/components/feedback/positive-feedback-toast.tsx`

Fix error handling in mutations, integrate PositiveFeedbackToast component.

---

### 4. [UI Component Fixes](./04-ui-component-fixes.md)
**Files**: `src/components/feedback/negative-feedback-modal.tsx`, `src/components/feedback/feedback-buttons.tsx`, `src/components/image-card.tsx`, `src/components/generation-result.tsx`

Fix modal state reset, remove unused prop.

---

### 5. [Database Layer Cleanup](./05-database-layer-cleanup.md)
**File**: `src/lib/db/feedback.ts`

Extract mapping helper to reduce duplication.

---

### 6. [Comprehensive Tests](./06-comprehensive-tests.md)
**Files**: All `__tests__/` files for feedback system

Replace placeholder tests with real behavior tests.

---

## Verification

After implementation:
```bash
bun test src/lib/validation
bun test src/lib/db/__tests__/feedback.test.ts
bun test src/app/api/images
bun test src/hooks/__tests__/use-image-feedback.test.tsx
bun test src/components/feedback
bun run build
```
