# Types and Constants

## Files to Modify/Create
- `src/types/feedback.ts` (new)
- `src/types/index.ts` (modify)

## Implementation Details

### Task 2.1: Create feedback type definitions

Create comprehensive TypeScript types and constants for the feedback system.

**File: `src/types/feedback.ts`**

```typescript
export const NEGATIVE_FEEDBACK_REASONS = [
  'quality_issues',
  'doesnt_match_request',
  'product_not_visible',
  'wrong_style',
  'background_problems',
  'other',
] as const;

export const POSITIVE_FEEDBACK_REASONS = [
  'great_quality',
  'matched_request',
  'fast',
] as const;

export type NegativeFeedbackReason = typeof NEGATIVE_FEEDBACK_REASONS[number];
export type PositiveFeedbackReason = typeof POSITIVE_FEEDBACK_REASONS[number];
export type FeedbackReason = NegativeFeedbackReason | PositiveFeedbackReason;
export type FeedbackType = 'positive' | 'negative';

export const NEGATIVE_REASON_LABELS: Record<NegativeFeedbackReason, string> = {
  quality_issues: 'Quality issues',
  doesnt_match_request: "Doesn't match my request",
  product_not_visible: 'Product not visible/clear',
  wrong_style: 'Wrong style/aesthetic',
  background_problems: 'Background problems',
  other: 'Other',
};

export const POSITIVE_REASON_LABELS: Record<PositiveFeedbackReason, string> = {
  great_quality: 'Great quality',
  matched_request: 'Matched my request',
  fast: 'Fast',
};

export interface ImageFeedback {
  id: string;
  imageId: string;
  userId: string;
  feedbackType: FeedbackType;
  reasons: FeedbackReason[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitFeedbackParams {
  imageId: string;
  feedbackType: FeedbackType;
  reasons: FeedbackReason[];
  comment?: string;
}
```

### Task 2.2: Export from types index

Update the types barrel export to include feedback types.

**File: `src/types/index.ts`**

Add:
```typescript
export * from './feedback';
```

## Acceptance Criteria
- [ ] All types compile without errors
- [ ] `FeedbackType`, `FeedbackReason`, etc. are exported from `@/types`
- [ ] NEGATIVE_REASON_LABELS and POSITIVE_REASON_LABELS provide human-readable text
- [ ] Constants use `as const` for literal type inference
- [ ] Import statements like `import { FeedbackType } from '@/types'` work

## Dependencies
- Task 01: Database Foundation (for understanding the schema structure)

## Technical Notes
- **Type Safety:** Using `as const` ensures reason values are literal types, not just strings
- **Label Maps:** Provide UI-ready text for each reason without hardcoding in components
- **Flexibility:** ImageFeedback interface can be extended for future fields
