# Extract Evaluation Type Guard and Mapping Utilities

## Files to Modify/Create
- prompt-bench/core/evaluation-utils.ts (new)
- prompt-bench/core/index.ts (modify)
- prompt-bench/commands/improve.ts (modify)

## Implementation Details

The `hasBreakdown` type guard and `ProductScore` mapping logic are duplicated identically in two functions within improve.ts (`testBaseline` lines 520-550 and `testImproved` lines 676-706).

**Current duplicated pattern (appears twice):**
```typescript
const hasBreakdown = (d: Record<string, unknown>): d is {
  composition: number;
  lighting: number;
  productVisibility: number;
  backgroundQuality: number;
  professionalQuality: number;
  promptAdherence: number;
} => {
  return typeof d.composition === 'number' &&
         typeof d.lighting === 'number' &&
         typeof d.productVisibility === 'number' &&
         typeof d.backgroundQuality === 'number' &&
         typeof d.professionalQuality === 'number' &&
         typeof d.promptAdherence === 'number';
};

const productScores: ProductScore[] = evaluations.map((evaluation, idx) => {
  const details = evaluation.details;
  return {
    productId: `product-${idx}`,
    score: evaluation.score,
    breakdown: details && hasBreakdown(details) ? {
      composition: details.composition,
      lighting: details.lighting,
      productVisibility: details.productVisibility,
      backgroundQuality: details.backgroundQuality,
      professionalQuality: details.professionalQuality,
      promptAdherence: details.promptAdherence,
    } : undefined,
    reasoning: typeof details?.reasoning === 'string' ? details.reasoning : undefined,
    suggestions: Array.isArray(details?.suggestions) ? details.suggestions as string[] : undefined,
  };
});
```

**Required changes:**

### Step 1: Create new utility file

Create `prompt-bench/core/evaluation-utils.ts`:

```typescript
/**
 * Evaluation utilities for type-safe score processing
 */

import type { ProductScore, EvaluationBreakdown } from '@bench/core/improvement-types';

/**
 * Type guard to check if evaluation details contain full breakdown structure
 */
export const hasBreakdown = (d: Record<string, unknown>): d is EvaluationBreakdown => {
  return typeof d.composition === 'number' &&
         typeof d.lighting === 'number' &&
         typeof d.productVisibility === 'number' &&
         typeof d.backgroundQuality === 'number' &&
         typeof d.professionalQuality === 'number' &&
         typeof d.promptAdherence === 'number';
};

/**
 * Map raw evaluation data to typed ProductScore array
 */
export const mapEvaluationsToProductScores = (
  evaluations: Array<{ score: number; details: Record<string, unknown> }>
): ProductScore[] => {
  return evaluations.map((evaluation, idx) => {
    const details = evaluation.details;
    return {
      productId: `product-${idx}`,
      score: evaluation.score,
      breakdown: details && hasBreakdown(details) ? {
        composition: details.composition,
        lighting: details.lighting,
        productVisibility: details.productVisibility,
        backgroundQuality: details.backgroundQuality,
        professionalQuality: details.professionalQuality,
        promptAdherence: details.promptAdherence,
      } : undefined,
      reasoning: typeof details?.reasoning === 'string' ? details.reasoning : undefined,
      suggestions: Array.isArray(details?.suggestions) ? details.suggestions as string[] : undefined,
    };
  });
};
```

### Step 2: Update barrel export

Add to `prompt-bench/core/index.ts`:

```typescript
export { hasBreakdown, mapEvaluationsToProductScores } from './evaluation-utils';
```

### Step 3: Update improve.ts

1. Add import at top of file:
```typescript
import { mapEvaluationsToProductScores } from '@bench/core/evaluation-utils';
```

2. Replace the duplicated code in `testBaseline` (around line 516):
```typescript
// Before: ~30 lines of hasBreakdown + mapping
// After:
const productScores = mapEvaluationsToProductScores(evaluations);
```

3. Replace the duplicated code in `testImproved` (around line 672):
```typescript
// Before: ~30 lines of hasBreakdown + mapping
// After:
const productScores = mapEvaluationsToProductScores(evaluations);
```

## Acceptance Criteria
- [ ] New file `prompt-bench/core/evaluation-utils.ts` created with exports
- [ ] Barrel export updated in `prompt-bench/core/index.ts`
- [ ] Both `testBaseline` and `testImproved` use the new utility
- [ ] Inline type guards removed from improve.ts
- [ ] No TypeScript errors: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test prompt-bench`
- [ ] `bun bench improve` command works correctly

## Dependencies
None - utilities are self-contained.

## Risk Level
Low - straightforward extraction with type safety preserved.

## Savings
~140 lines removed, single source of truth for evaluation type handling.
