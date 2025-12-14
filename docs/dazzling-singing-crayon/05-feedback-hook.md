# Feedback Hook with TanStack Query

## Files to Modify/Create
- `src/hooks/use-image-feedback.ts` (new)
- `src/hooks/__tests__/use-image-feedback.test.ts` (new)

## Implementation Details

### Task 5.1: Create useImageFeedback hook

Implement custom React hook that manages feedback state and API interactions using TanStack Query.

**File: `src/hooks/use-image-feedback.ts`**

**Interface:**
```typescript
interface UseImageFeedbackOptions {
  imageId: string;
}

interface UseImageFeedbackReturn {
  currentFeedback: FeedbackType | null;
  isLoading: boolean;
  isSubmitting: boolean;
  showNegativeModal: boolean;
  setShowNegativeModal: (show: boolean) => void;
  selectedPositiveReasons: PositiveFeedbackReason[];
  togglePositiveReason: (reason: PositiveFeedbackReason) => void;
  handleThumbsUp: () => void;
  handleThumbsDown: () => void;
  handleNegativeSubmit: (reasons: NegativeFeedbackReason[], comment: string) => Promise<void>;
  handlePositiveDismiss: () => void; // Called when toast closes
}
```

**TanStack Query Pattern:**
```typescript
// Query for existing feedback
const { data: feedback, isLoading } = useQuery({
  queryKey: ['feedback', imageId],
  queryFn: () => fetchFeedback(imageId),
});

// Mutation for submitting feedback
const submitMutation = useMutation({
  mutationFn: submitFeedback,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['feedback', imageId] });
  },
});
```

**Positive Feedback Flow:**
1. `handleThumbsUp()`:
   - Submit feedback with `{ type: 'positive', reasons: [] }`
   - Show toast (via Sonner)
   - Initialize `selectedPositiveReasons` as empty array

2. `togglePositiveReason(reason)`:
   - Add/remove reason from `selectedPositiveReasons` array
   - Update UI state only (don't submit yet)

3. `handlePositiveDismiss()`:
   - Called when toast closes (auto-dismiss or manual)
   - Update feedback with `selectedPositiveReasons`
   - Clear local state

**Negative Feedback Flow:**
1. `handleThumbsDown()`:
   - Set `showNegativeModal = true`

2. `handleNegativeSubmit(reasons, comment)`:
   - Submit feedback with negative type, reasons, and comment
   - Close modal
   - Invalidate query to refetch

**Race Condition Prevention:**
- Use `submitMutation.isPending` for `isSubmitting` state
- Disable buttons when `isSubmitting === true`

**File: `src/hooks/__tests__/use-image-feedback.test.ts`**

Test coverage:
- Hook initializes correctly
- Fetches existing feedback on mount
- handleThumbsUp submits positive feedback with empty reasons
- togglePositiveReason updates local state
- handlePositiveDismiss updates feedback with selected reasons
- handleThumbsDown opens modal
- handleNegativeSubmit submits and closes modal
- isSubmitting prevents concurrent submissions
- Query invalidation triggers refetch

**Mock Strategy:**
- Mock fetch() for API calls
- Use @testing-library/react for hook testing
- Mock TanStack Query with proper query client setup

## Acceptance Criteria
- [ ] Hook manages all feedback state correctly
- [ ] TanStack Query handles data fetching with auto-deduplication
- [ ] Positive flow: immediate save → toast → update on dismiss
- [ ] Negative flow: modal → submit with reasons/comment
- [ ] Race conditions prevented (buttons disabled while submitting)
- [ ] All tests pass with ≥75% coverage
- [ ] Query invalidation triggers UI updates

## Dependencies
- Task 02: Types and Constants (for TypeScript types)
- Task 04: API Endpoint (for API calls)

## Technical Notes
- **TanStack Query:** Already configured in `ClientProviders` with 5min stale time
- **Sonner Integration:** Use `toast()` for positive feedback display
- **State Management:** Local state for positive reasons, query cache for server state
- **No Bulk Endpoint Needed:** TanStack Query automatically deduplicates concurrent requests
