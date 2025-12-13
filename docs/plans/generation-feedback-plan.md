# Generation Feedback System Implementation Plan

## Overview
Add thumbs up/down feedback to generated images for data capture. Users can rate results, provide reasons for dissatisfaction, and optionally explain positive ratings via toast buttons.

## Architecture Decisions

- **Single table with enum**: Use one `image_feedback` table with `feedback_type` enum ('positive'/'negative') rather than separate tables - simpler upsert allows changing vote
- **TEXT[] for reasons**: Sufficient for string arrays, good query performance
- **Custom hook pattern**: `useImageFeedback` encapsulates state/API calls, keeps components clean
- **One feedback per user per image**: Unique constraint enables upsert to update existing feedback
- **Data capture only**: No automatic refunds or re-generation prompts

## Implementation Tasks

### Phase 1: Database Foundation

- [ ] Create image_feedback migration
  - Files: `supabase/migrations/20251212000000_create_image_feedback.sql` (new)
  - Tests: Manual verification via `npx supabase db push`
  - Acceptance: Table exists with correct schema, RLS policies active, indexes created

```sql
CREATE TYPE public.feedback_type AS ENUM ('positive', 'negative');

CREATE TABLE public.image_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.generated_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feedback_type public.feedback_type NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_image_feedback UNIQUE (user_id, image_id)
);

CREATE INDEX idx_image_feedback_image_id ON public.image_feedback(image_id);
CREATE INDEX idx_image_feedback_user_id ON public.image_feedback(user_id);
CREATE INDEX idx_image_feedback_type ON public.image_feedback(feedback_type);
CREATE INDEX idx_image_feedback_created_at ON public.image_feedback(created_at DESC);

ALTER TABLE public.image_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.image_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feedback" ON public.image_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON public.image_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON public.image_feedback FOR DELETE USING (auth.uid() = user_id);
```

- [ ] Regenerate TypeScript types
  - Files: `src/types/database.ts` (auto-generated)
  - Tests: None
  - Acceptance: `ImageFeedback` type available in generated types
  - Command: `npx supabase gen types ts --local > src/types/database.ts`

### Phase 2: Types & Constants

- [ ] Create feedback type definitions
  - Files: `src/types/feedback.ts` (new)
  - Tests: None (type-only file)
  - Acceptance: All types compile, exported from index

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

- [ ] Export feedback types from types index
  - Files: `src/types/index.ts` (modify)
  - Tests: None
  - Acceptance: `import { FeedbackType } from '@/types'` works

### Phase 3: Database Layer

- [ ] Create feedback database functions
  - Files: `src/lib/db/feedback.ts` (new)
  - Tests: `src/lib/db/__tests__/feedback.test.ts` (new)
  - Acceptance: All functions work with mocked Supabase client

```typescript
// Functions to implement:
// - submitFeedback(userId, params): Promise<ImageFeedback | null>
// - getFeedbackForImage(imageId, userId): Promise<ImageFeedback | null>
// - deleteFeedback(imageId, userId): Promise<boolean>
```

- [ ] Export feedback functions from db index
  - Files: `src/lib/db/index.ts` (modify)
  - Tests: None
  - Acceptance: `import { submitFeedback } from '@/lib/db'` works

### Phase 4: API Endpoint

- [ ] Create feedback API route
  - Files: `src/app/api/images/[id]/feedback/route.ts` (new)
  - Tests: `src/app/api/images/[id]/feedback/__tests__/route.test.ts` (new)
  - Acceptance: POST/GET/DELETE work, Zod validation, auth required

```typescript
// Endpoints:
// POST - Submit/update feedback (validates reasons match feedback type)
// GET - Get current user's feedback for image
// DELETE - Remove feedback

// Zod schema validates:
// - feedbackType: 'positive' | 'negative'
// - reasons: array of valid reasons for type
// - comment: optional string, max 1000 chars
```

### Phase 5: UI Components

- [ ] Create FeedbackButtons component
  - Files: `src/components/feedback/feedback-buttons.tsx` (new)
  - Tests: `src/components/feedback/__tests__/feedback-buttons.test.tsx` (new)
  - Acceptance: Renders thumbs up/down, handles clicks, shows active state

```typescript
interface FeedbackButtonsProps {
  imageId: string;
  currentFeedback: FeedbackType | null;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
}
```

- [ ] Create NegativeFeedbackModal component
  - Files: `src/components/feedback/negative-feedback-modal.tsx` (new)
  - Tests: `src/components/feedback/__tests__/negative-feedback-modal.test.tsx` (new)
  - Acceptance: Multi-select checkboxes, shows textarea when "Other" selected, submits reasons

```typescript
interface NegativeFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reasons: NegativeFeedbackReason[], comment: string) => void;
  isSubmitting?: boolean;
}
```

- [ ] Create PositiveFeedbackToast component
  - Files: `src/components/feedback/positive-feedback-toast.tsx` (new)
  - Tests: `src/components/feedback/__tests__/positive-feedback-toast.test.tsx` (new)
  - Acceptance: Renders reason buttons in toast, calls handler on click

```typescript
interface PositiveFeedbackToastProps {
  onReasonClick: (reason: PositiveFeedbackReason) => void;
}
```

- [ ] Create feedback barrel export
  - Files: `src/components/feedback/index.ts` (new)
  - Tests: None
  - Acceptance: All components exportable from `@/components/feedback`

### Phase 6: Hook

- [ ] Create useImageFeedback hook
  - Files: `src/hooks/use-image-feedback.ts` (new)
  - Tests: `src/hooks/__tests__/use-image-feedback.test.ts` (new)
  - Acceptance: Manages state, API calls, toast display, modal state

```typescript
interface UseImageFeedbackOptions {
  imageId: string;
  initialFeedback?: FeedbackType | null;
}

interface UseImageFeedbackReturn {
  currentFeedback: FeedbackType | null;
  isSubmitting: boolean;
  showNegativeModal: boolean;
  setShowNegativeModal: (show: boolean) => void;
  handleThumbsUp: () => void;
  handleThumbsDown: () => void;
  handleNegativeSubmit: (reasons: NegativeFeedbackReason[], comment: string) => Promise<void>;
}
```

### Phase 7: Integration

- [ ] Integrate feedback into GenerationResult
  - Files: `src/components/generation-result.tsx` (modify)
  - Tests: `src/components/__tests__/generation-result.test.tsx` (modify if exists)
  - Acceptance: Thumbs buttons appear below Download/Regenerate, modal works

Changes needed:
1. Add `imageId` prop to interface
2. Import and use `useImageFeedback` hook
3. Add `FeedbackButtons` after existing button row
4. Add `NegativeFeedbackModal` at end of component

- [ ] Update generate page to pass imageId
  - Files: `src/app/generate/page.tsx` (modify)
  - Tests: None (integration test)
  - Acceptance: imageId passed to GenerationResult when result exists

- [ ] Integrate feedback into ImageCard
  - Files: `src/components/image-card.tsx` (modify)
  - Tests: `src/components/__tests__/image-card.test.tsx` (modify if exists)
  - Acceptance: Thumbs buttons in hover overlay, modal works

Changes needed:
1. Import Lucide ThumbsUp/ThumbsDown icons
2. Import and use `useImageFeedback` hook
3. Add thumbs buttons to overlay (after delete button)
4. Add `NegativeFeedbackModal` at end of component

## Acceptance Criteria

- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun run build`)
- [ ] Coverage ≥75% for new files
- [ ] Feedback submits successfully (manual test)
- [ ] Thumbs up shows toast with reason buttons
- [ ] Thumbs down opens modal with checkboxes
- [ ] "Other" checkbox reveals textarea
- [ ] Feedback persists and shows on reload
- [ ] Changing feedback (up→down or down→up) works

## Files to Create/Modify

### New Files
- `supabase/migrations/20251212000000_create_image_feedback.sql`
- `src/types/feedback.ts`
- `src/lib/db/feedback.ts`
- `src/lib/db/__tests__/feedback.test.ts`
- `src/app/api/images/[id]/feedback/route.ts`
- `src/app/api/images/[id]/feedback/__tests__/route.test.ts`
- `src/components/feedback/index.ts`
- `src/components/feedback/feedback-buttons.tsx`
- `src/components/feedback/negative-feedback-modal.tsx`
- `src/components/feedback/positive-feedback-toast.tsx`
- `src/components/feedback/__tests__/feedback-buttons.test.tsx`
- `src/components/feedback/__tests__/negative-feedback-modal.test.tsx`
- `src/components/feedback/__tests__/positive-feedback-toast.test.tsx`
- `src/hooks/use-image-feedback.ts`
- `src/hooks/__tests__/use-image-feedback.test.ts`

### Modify Files
- `src/types/index.ts` - add feedback export
- `src/lib/db/index.ts` - add feedback export
- `src/components/generation-result.tsx` - add feedback UI
- `src/components/image-card.tsx` - add feedback UI
- `src/app/generate/page.tsx` - pass imageId prop

## Dependencies

### External (already installed)
- `@radix-ui/react-dialog` - Modal
- `@radix-ui/react-checkbox` - Checkboxes
- `lucide-react` - ThumbsUp/ThumbsDown icons
- `sonner` - Toast notifications
- `zod` - API validation

### Internal
- `src/lib/supabase/server` - Database client
- `src/hooks/use-toast` - Toast hook
- `src/components/ui/*` - Button, Dialog, Checkbox, Textarea, Label

## Task Dependencies

```
Phase 1 (DB)
    ↓
Phase 2 (Types)
    ↓
Phase 3 (DB Functions)
    ↓
Phase 4 (API)
    ↓
Phase 5 (Components) ← Can run parallel with Phase 6
    ↓
Phase 6 (Hook)
    ↓
Phase 7 (Integration)
```
