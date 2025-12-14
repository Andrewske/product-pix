# Hook Error Handling and Toast Integration

## Files to Modify/Create
- `src/hooks/use-image-feedback.ts` (modify)
- `src/components/feedback/positive-feedback-toast.tsx` (may need minor adjustments)

## Implementation Details

### Part A: Add Error Handling to Mutation

Update `submitMutation` to handle errors:

```typescript
const submitMutation = useMutation({
  mutationFn: (params: SubmitFeedbackParams) => submitFeedbackApi(imageId, params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['feedback', imageId] });
  },
  onError: (error: Error) => {
    toast.error('Failed to submit feedback', {
      description: error.message || 'Please try again',
    });
  },
});
```

### Part B: Add Error State to Return Interface

```typescript
interface UseImageFeedbackReturn {
  // ... existing fields
  submissionError: Error | null;
  isError: boolean;
}

// In return statement:
return {
  // ... existing fields
  submissionError: submitMutation.error,
  isError: submitMutation.isError,
};
```

### Part C: Fix handleThumbsUp - Only Toast on Success

Move toast to onSuccess callback instead of calling immediately:

```typescript
const handleThumbsUp = () => {
  submitMutation.mutate(
    {
      imageId,
      feedbackType: 'positive',
      reasons: [],
    },
    {
      onSuccess: () => {
        // Show custom toast with PositiveFeedbackToast component
        toast.custom((t) => (
          <PositiveFeedbackToast
            selectedReasons={selectedPositiveReasons}
            onReasonToggle={togglePositiveReason}
            onDismiss={() => {
              handlePositiveDismiss();
              toast.dismiss(t);
            }}
          />
        ), { duration: 5000 });
      },
    }
  );
};
```

### Part D: Fix handleNegativeSubmit - Add Try-Catch

```typescript
const handleNegativeSubmit = async (reasons: NegativeFeedbackReason[], comment: string) => {
  try {
    await submitMutation.mutateAsync({
      imageId,
      feedbackType: 'negative',
      reasons,
      comment,
    });
    setShowNegativeModal(false);
  } catch (error) {
    // Error toast already shown by onError callback
    // Keep modal open so user can retry
  }
};
```

### Part E: Fix handlePositiveDismiss - Clear State in Callback

```typescript
const handlePositiveDismiss = () => {
  if (selectedPositiveReasons.length > 0) {
    submitMutation.mutate(
      {
        imageId,
        feedbackType: 'positive',
        reasons: selectedPositiveReasons,
      },
      {
        onSuccess: () => {
          setSelectedPositiveReasons([]);
        },
      }
    );
  } else {
    setSelectedPositiveReasons([]);
  }
};
```

## Acceptance Criteria

- [ ] Failed submissions show error toast
- [ ] Successful positive feedback shows PositiveFeedbackToast component
- [ ] Negative feedback modal stays open on error (allows retry)
- [ ] Positive reasons state only clears after successful submission
- [ ] `isError` and `submissionError` available to consuming components
- [ ] No silent failures

## Dependencies
- Task 01 (clean codebase)
- Task 02 (API security - ensures API responds correctly)
