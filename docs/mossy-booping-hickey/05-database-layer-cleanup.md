# Database Layer Cleanup

## Files to Modify/Create
- `src/lib/db/feedback.ts` (modify)

## Implementation Details

Extract the duplicate snake_case to camelCase mapping (lines 41-50 and 81-90) into a reusable helper:

```typescript
// Add type for database row shape
interface DbFeedbackRow {
  id: string;
  image_id: string;
  user_id: string;
  feedback_type: 'positive' | 'negative';
  reasons: string[];
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// Add helper function
const mapDbFeedbackToInterface = (data: DbFeedbackRow): ImageFeedback => ({
  id: data.id,
  imageId: data.image_id,
  userId: data.user_id,
  feedbackType: data.feedback_type,
  reasons: data.reasons as FeedbackReason[],
  comment: data.comment,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});
```

Then update both `submitFeedback` and `getFeedbackForImage` to use the helper:

```typescript
// In submitFeedback (around line 40):
return mapDbFeedbackToInterface(data);

// In getFeedbackForImage (around line 80):
return mapDbFeedbackToInterface(data);
```

## Acceptance Criteria

- [ ] No duplicate mapping code
- [ ] Both functions return correctly typed ImageFeedback
- [ ] Existing tests still pass (once written)
- [ ] TypeScript compiles without errors

## Dependencies
- Task 02 (type guards established)
