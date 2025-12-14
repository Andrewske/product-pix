# UI Components

## Files to Modify/Create
- `src/components/feedback/feedback-buttons.tsx` (new)
- `src/components/feedback/negative-feedback-modal.tsx` (new)
- `src/components/feedback/positive-feedback-toast.tsx` (new)
- `src/components/feedback/index.ts` (new)
- `src/components/feedback/__tests__/feedback-buttons.test.tsx` (new)
- `src/components/feedback/__tests__/negative-feedback-modal.test.tsx` (new)
- `src/components/feedback/__tests__/positive-feedback-toast.test.tsx` (new)

## Implementation Details

### Task 6.1: Create FeedbackButtons component

Thumbs up/down button component for triggering feedback flows.

**File: `src/components/feedback/feedback-buttons.tsx`**

```typescript
interface FeedbackButtonsProps {
  imageId: string;
  currentFeedback: FeedbackType | null;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  disabled?: boolean; // Use for isSubmitting
  size?: 'default' | 'sm';
}
```

**Implementation:**
- Two buttons: ThumbsUp and ThumbsDown icons from Lucide
- Show active state when `currentFeedback` matches button type
- Disable both buttons when `disabled === true`
- Size variants for different contexts
- Accessibility: proper ARIA labels

**Test: `src/components/feedback/__tests__/feedback-buttons.test.tsx`**
- Renders both buttons
- Calls onThumbsUp when thumbs up clicked
- Calls onThumbsDown when thumbs down clicked
- Shows active state for current feedback
- Disables buttons when disabled prop is true

### Task 6.2: Create NegativeFeedbackModal component

Modal dialog for collecting negative feedback with reasons and comment.

**File: `src/components/feedback/negative-feedback-modal.tsx`**

```typescript
interface NegativeFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reasons: NegativeFeedbackReason[], comment: string) => void;
  isSubmitting?: boolean;
}
```

**Implementation:**
- Use Radix UI Dialog component
- Multi-select checkboxes for NEGATIVE_FEEDBACK_REASONS
- Use NEGATIVE_REASON_LABELS for checkbox labels
- When "Other" is checked, show textarea for comment (required)
- Submit button disabled when:
  - No reasons selected
  - "Other" checked but comment is empty
  - isSubmitting === true
- Cancel button clears and closes

**Test: `src/components/feedback/__tests__/negative-feedback-modal.test.tsx`**
- Opens/closes correctly
- Shows all negative reason checkboxes
- Textarea appears when "Other" selected
- Submit button disabled with invalid state
- Calls onSubmit with selected reasons and comment
- Clears state on cancel

### Task 6.3: Create PositiveFeedbackToast component

Toast content with toggleable reason buttons for positive feedback.

**File: `src/components/feedback/positive-feedback-toast.tsx`**

```typescript
interface PositiveFeedbackToastProps {
  selectedReasons: PositiveFeedbackReason[];
  onReasonToggle: (reason: PositiveFeedbackReason) => void;
  onDismiss: () => void;
}
```

**Implementation:**
- Render within Sonner toast (not a separate toast component)
- Multiple toggle buttons for POSITIVE_FEEDBACK_REASONS
- Use POSITIVE_REASON_LABELS for button text
- Buttons show green/selected state when in `selectedReasons` array
- Toast configuration:
  - Duration: 10-15 seconds (`duration: 12000`)
  - Show progress indicator (Sonner built-in)
  - Call `onDismiss` when toast closes (use Sonner's `onDismiss` callback)

**Integration Pattern:**
```typescript
// In the hook or component:
toast.custom(
  (t) => (
    <PositiveFeedbackToast
      selectedReasons={selectedPositiveReasons}
      onReasonToggle={togglePositiveReason}
      onDismiss={handlePositiveDismiss}
    />
  ),
  {
    duration: 12000,
    onDismiss: handlePositiveDismiss,
  }
);
```

**Test: `src/components/feedback/__tests__/positive-feedback-toast.test.tsx`**
- Renders all positive reason buttons
- Buttons show selected state correctly
- Calls onReasonToggle when button clicked
- Multiple selections possible

### Task 6.4: Create feedback barrel export

**File: `src/components/feedback/index.ts`**

```typescript
export { FeedbackButtons } from './feedback-buttons';
export { NegativeFeedbackModal } from './negative-feedback-modal';
export { PositiveFeedbackToast } from './positive-feedback-toast';
```

## Acceptance Criteria
- [ ] All three components render correctly
- [ ] FeedbackButtons shows active states
- [ ] NegativeFeedbackModal validates input before submission
- [ ] PositiveFeedbackToast toggles multiple reasons
- [ ] Toast auto-dismisses after 10-15 seconds
- [ ] All tests pass with ≥75% coverage
- [ ] Components accessible (ARIA labels, keyboard navigation)
- [ ] Components importable from `@/components/feedback`

## Dependencies
- Task 02: Types and Constants (for type definitions and labels)
- Task 05: Feedback Hook (components use hook for state management)

## Technical Notes
- **Sonner Toast:** Already installed, supports custom content and duration
- **Radix UI:** Dialog components already available
- **Icons:** Use Lucide React (ThumbsUp, ThumbsDown)
- **Testing:** Bun test with @testing-library/react
- **Styling:** Follow ProductPix design system (clean, minimal, green primary)
