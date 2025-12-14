# UI Component Fixes

## Files to Modify/Create
- `src/components/feedback/negative-feedback-modal.tsx` (modify)
- `src/components/feedback/feedback-buttons.tsx` (modify)
- `src/components/image-card.tsx` (modify)
- `src/components/generation-result.tsx` (modify)

## Implementation Details

### Part A: Fix Modal State Reset on Backdrop Close

In `negative-feedback-modal.tsx`, add useEffect to reset state when dialog closes via any method:

```typescript
import { useState, useEffect } from 'react';

// Inside component, after useState declarations:
useEffect(() => {
  if (!open) {
    setSelectedReasons([]);
    setComment('');
  }
}, [open]);
```

This ensures state resets whether user clicks Cancel, backdrop, or Escape key.

### Part B: Remove Unused imageId Prop

In `feedback-buttons.tsx`, remove `imageId` from the props interface:

```typescript
// Before
interface FeedbackButtonsProps {
  imageId: string;
  currentFeedback: FeedbackType | null;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
}

// After
interface FeedbackButtonsProps {
  currentFeedback: FeedbackType | null;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
}
```

### Part C: Update Callers

In `image-card.tsx` (around line 88-95):
```typescript
// Before
<FeedbackButtons
  imageId={image.id}
  currentFeedback={currentFeedback}
  ...
/>

// After
<FeedbackButtons
  currentFeedback={currentFeedback}
  ...
/>
```

In `generation-result.tsx` (around line 68-75):
```typescript
// Before
<FeedbackButtons
  imageId={imageId}
  currentFeedback={currentFeedback}
  ...
/>

// After
<FeedbackButtons
  currentFeedback={currentFeedback}
  ...
/>
```

## Acceptance Criteria

- [ ] Modal state resets when closed via backdrop click
- [ ] Modal state resets when closed via Escape key
- [ ] No TypeScript errors after removing imageId prop
- [ ] Both ImageCard and GenerationResult compile without errors
- [ ] Reopening modal after closing shows clean state

## Dependencies
- Task 01 (ImageCard already modified)
- Task 03 (hook integration complete)
