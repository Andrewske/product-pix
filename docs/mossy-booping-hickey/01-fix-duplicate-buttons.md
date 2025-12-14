# Fix Duplicate Buttons in ImageCard

## Files to Modify/Create
- `src/components/image-card.tsx` (modify)

## Implementation Details

Delete lines 97-126 which contain duplicate download, favorite, and refund buttons. Keep the original set at lines 60-86.

**Current structure (broken):**
```
Lines 60-86: Download, Favorite, Refund buttons (KEEP)
Lines 88-95: FeedbackButtons component (KEEP)
Lines 97-126: DUPLICATE Download, Favorite, Refund buttons (DELETE)
```

**Target structure:**
```
Lines 60-86: Download, Favorite, Refund buttons
Lines 88-95: FeedbackButtons component
```

This appears to be a copy-paste error during the feedback system integration.

## Acceptance Criteria

- [ ] Only one set of Download/Favorite/Refund buttons exists in the overlay
- [ ] FeedbackButtons component remains between the action buttons
- [ ] Visual inspection shows no duplicate controls on image hover
- [ ] Component renders without errors

## Dependencies
None - this is the first task
