# Type Guards and API Security

## Files to Modify/Create
- `src/lib/validation/feedback.ts` (new)
- `src/app/api/images/[id]/feedback/route.ts` (modify)

## Implementation Details

### Part A: Create Type Guards

Create new file `src/lib/validation/feedback.ts` following existing patterns in `lib/db/types.ts`:

```typescript
import {
  POSITIVE_FEEDBACK_REASONS,
  NEGATIVE_FEEDBACK_REASONS,
  type PositiveFeedbackReason,
  type NegativeFeedbackReason,
  type FeedbackReason,
  type FeedbackType
} from '@/types/feedback';

export function isPositiveFeedbackReason(value: unknown): value is PositiveFeedbackReason {
  return (
    typeof value === 'string' &&
    POSITIVE_FEEDBACK_REASONS.includes(value as PositiveFeedbackReason)
  );
}

export function isNegativeFeedbackReason(value: unknown): value is NegativeFeedbackReason {
  return (
    typeof value === 'string' &&
    NEGATIVE_FEEDBACK_REASONS.includes(value as NegativeFeedbackReason)
  );
}

export function areValidReasonsForType(
  reasons: unknown[],
  feedbackType: FeedbackType
): reasons is FeedbackReason[] {
  if (!Array.isArray(reasons)) return false;

  const validator = feedbackType === 'positive'
    ? isPositiveFeedbackReason
    : isNegativeFeedbackReason;

  return reasons.every(validator);
}
```

### Part B: Update API Route

In `src/app/api/images/[id]/feedback/route.ts`:

1. **Replace `as any` on line 54** with type guard:
```typescript
// Before
const invalidReasons = reasons.filter(reason => !validReasons.includes(reason as any));

// After
if (!areValidReasonsForType(reasons, feedbackType)) {
  const invalidReasons = reasons.filter(
    r => !(feedbackType === 'positive'
      ? isPositiveFeedbackReason(r)
      : isNegativeFeedbackReason(r))
  );
  return NextResponse.json({
    error: `Invalid reasons for ${feedbackType} feedback: ${invalidReasons.join(', ')}`
  }, { status: 400 });
}
```

2. **Replace `as any` on line 65** - after validation, `reasons` is now properly typed

3. **Add ownership check to GET handler** (around line 89):
```typescript
// Verify user owns the image before returning feedback
const { data: image } = await supabase
  .from('generated_images')
  .select('user_id')
  .eq('id', imageId)
  .single();

if (!image || image.user_id !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

4. **Add ownership check to DELETE handler** (around line 107):
Same pattern as GET handler.

## Acceptance Criteria

- [ ] No `as any` type assertions remain in the feedback route
- [ ] Type guards compile without errors
- [ ] GET endpoint returns 403 for images not owned by user
- [ ] DELETE endpoint returns 403 for images not owned by user
- [ ] Valid feedback submissions still work correctly
- [ ] Invalid reasons are properly rejected with descriptive error

## Dependencies
- Task 01 (clean codebase baseline)
