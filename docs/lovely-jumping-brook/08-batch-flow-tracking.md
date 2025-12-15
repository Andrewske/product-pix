# Batch Flow Event Tracking

## Files to Modify/Create
- `src/app/batch/new/page.tsx` (modify)
- `src/app/batch/[batchId]/page.tsx` (modify)
- `src/app/batch/new/__tests__/page.test.tsx` (modify)
- `src/app/batch/[batchId]/__tests__/page.test.tsx` (modify)

## Implementation Details

### Task 3.2: Track Batch Creation Events

Modify `src/app/batch/new/page.tsx`:

**Events to Add:**

1. **batch_created** - After successful creation
   - Properties: batch_id, item_count, total_credits

2. **insufficient_credits** - When credits < total_credits
   - Properties: required, balance

### Task 3.3: Track Batch Completion Events

Modify `src/app/batch/[batchId]/page.tsx`:

**Events to Add:**

1. **batch_completed** - When status changes to 'completed'
   - Properties: batch_id, success_count, failed_count, duration_ms

2. **batch_cancelled** - When user cancels batch (single event with rich properties)
   - Properties: batch_id, total_items, completed_items, failed_items, cancelled_items, completion_percentage

**Implementation Note for Partial Completion:**
Use single `batch_cancelled` event with properties showing full context:
```typescript
trackEvent({
  event: 'batch_cancelled',
  properties: {
    batch_id: batchId,
    total_items: 100,
    completed_items: 60,
    failed_items: 10,
    cancelled_items: 30,
    completion_percentage: 60,
  }
});
```

This allows analytics queries like:
- "Batches cancelled early": `WHERE completion_percentage < 25`
- "Batches mostly done but cancelled": `WHERE completion_percentage > 75`

## Acceptance Criteria
- Batch creation events tracked
- Batch completion events tracked
- Batch cancellation uses single event with rich properties
- Partial completion shows correct completion_percentage
- Event properties validated by Zod schema

## Tests Required

Update `src/app/batch/new/__tests__/page.test.tsx`:
- Test: batch_created fired on success
- Test: Event properties validated by Zod schema
- Test: insufficient_credits fired when credits low

Update `src/app/batch/[batchId]/__tests__/page.test.tsx`:
- Test: batch_completed fired when status becomes 'completed'
- Test: batch_cancelled fired on cancel with rich properties
- Test: Partial completion shows correct completion_percentage

## Dependencies
- Task 06 (core app integration) must be complete
