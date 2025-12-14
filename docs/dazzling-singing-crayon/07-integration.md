# Integration into Existing Components

## Files to Modify/Create
- `src/components/generation-result.tsx` (modify)
- `src/app/generate/page.tsx` (modify)
- `src/components/image-card.tsx` (modify)

## Implementation Details

### Task 7.1: Integrate into GenerationResult

Add feedback UI to the generation result view (single image after generation).

**File: `src/components/generation-result.tsx`**

**Changes:**
1. Add `imageId` prop to component interface
2. Import and use `useImageFeedback` hook
3. Add `FeedbackButtons` component after existing action buttons (Download/Regenerate)
4. Add `NegativeFeedbackModal` at end of component
5. Show `PositiveFeedbackToast` via Sonner when positive feedback is active

**Example structure:**
```typescript
interface GenerationResultProps {
  // ... existing props
  imageId: string; // NEW
}

export function GenerationResult({ imageId, ... }: GenerationResultProps) {
  const {
    currentFeedback,
    isSubmitting,
    showNegativeModal,
    setShowNegativeModal,
    handleThumbsUp,
    handleThumbsDown,
    handleNegativeSubmit,
  } = useImageFeedback({ imageId });

  return (
    <div>
      {/* Existing image and action buttons */}

      <FeedbackButtons
        imageId={imageId}
        currentFeedback={currentFeedback}
        onThumbsUp={handleThumbsUp}
        onThumbsDown={handleThumbsDown}
        disabled={isSubmitting}
      />

      <NegativeFeedbackModal
        open={showNegativeModal}
        onOpenChange={setShowNegativeModal}
        onSubmit={handleNegativeSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
```

### Task 7.2: Update generate page

Pass imageId to GenerationResult when result exists.

**File: `src/app/generate/page.tsx`**

**Changes:**
- Ensure imageId is available in the generation result data
- Pass imageId prop to GenerationResult component

**Example:**
```typescript
{result && (
  <GenerationResult
    imageId={result.imageId}
    // ... other existing props
  />
)}
```

### Task 7.3: Integrate into ImageCard

Add feedback UI to image card hover overlay (gallery view).

**File: `src/components/image-card.tsx`**

**Changes:**
1. Import and use `useImageFeedback` hook (each card manages own state)
2. Add thumbs buttons to overlay actions area
3. Add `NegativeFeedbackModal` at end of component
4. Show `PositiveFeedbackToast` when needed

**Implementation notes:**
- TanStack Query automatically deduplicates requests (no N+1 problem)
- Each ImageCard independently fetches its feedback state
- Place feedback buttons in the overlay alongside existing actions
- Don't assume specific position relative to other buttons (e.g., "after delete")

**Example structure:**
```typescript
export function ImageCard({ image }: ImageCardProps) {
  const {
    currentFeedback,
    isSubmitting,
    showNegativeModal,
    setShowNegativeModal,
    handleThumbsUp,
    handleThumbsDown,
    handleNegativeSubmit,
  } = useImageFeedback({ imageId: image.id });

  return (
    <div>
      {/* Existing image display */}

      <div className="overlay">
        {/* Existing overlay actions */}

        <FeedbackButtons
          imageId={image.id}
          currentFeedback={currentFeedback}
          onThumbsUp={handleThumbsUp}
          onThumbsDown={handleThumbsDown}
          disabled={isSubmitting}
          size="sm"
        />
      </div>

      <NegativeFeedbackModal
        open={showNegativeModal}
        onOpenChange={setShowNegativeModal}
        onSubmit={handleNegativeSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
```

## Acceptance Criteria
- [ ] GenerationResult shows feedback buttons below action buttons
- [ ] Generate page passes imageId to GenerationResult
- [ ] ImageCard shows feedback buttons in overlay
- [ ] All feedback flows work in both contexts:
  - [ ] Thumbs up → toast with multi-select → saves on dismiss
  - [ ] Thumbs down → modal → submit with reasons/comment
- [ ] Feedback persists and loads on page refresh
- [ ] Changing feedback (up→down or down→up) works correctly
- [ ] Multiple ImageCards don't cause N+1 queries (TanStack Query deduplication)
- [ ] Cannot submit feedback for images user didn't generate

## Dependencies
- Task 05: Feedback Hook (provides state management)
- Task 06: UI Components (provides FeedbackButtons, modals, toast)

## Technical Notes
- **TanStack Query:** Automatically deduplicates concurrent requests for same imageId
- **No Bulk Fetching:** Each component fetches independently, query library optimizes
- **Sonner Toast Management:** Hook internally manages toast display/dismissal
- **Testing:** Manual testing required for full integration flows
