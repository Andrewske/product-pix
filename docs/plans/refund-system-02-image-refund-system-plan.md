# Refund System - Phase 2: Image Refund System

## Overview

Implement user-facing image refund system where users can request credit refunds for poor-quality generations. Auto-approve first 49 refunds per user, then require admin approval for 50+.

**Dependencies**: Phase 1 (Database Foundation) must be deployed first.

## Architecture Decisions

### Auto-Approve Threshold
- **Choice**: Auto-approve first 49 refunds, admin review for 50+
- **Rationale**:
  - Build trust with new users (instant refunds)
  - Prevent abuse at scale (manual review after threshold)
  - 49 is arbitrary but reasonable (~$50 worth if 1 credit = $1)
  - Can adjust threshold via database query, not code change

### Image Removal Strategy
- **Choice**: Soft delete (set `deleted_at` timestamp)
- **Rationale**:
  - Keep R2 files for audit trail
  - Reversible if refund disputed
  - Simple query filter: `WHERE deleted_at IS NULL`
  - Existing `softDeleteImage()` function already implemented

### Refund Reason Collection
- **Choice**: Dropdown + optional feedback textbox
- **Rationale**:
  - Structured data (dropdown) for analytics
  - Qualitative insights (textbox) for improvement
  - Not blocking (feedback optional)
  - Future: Feed into prompt template optimization

## Implementation Tasks

### Phase 2.1: Backend API

- [ ] Create image refund request endpoint
  - Files: `src/app/api/refunds/image/route.ts` (new)
  - Exports: `POST`, `GET` (admin only)
  - POST Logic:
    1. Validate user authenticated
    2. Validate image ownership and not already refunded
    3. Check for existing refund request (prevent duplicates)
    4. Count user's approved refunds
    5. Auto-approve if count < 49, else pending_admin
    6. If auto-approved: call `refund_credits_for_image()` RPC, soft delete image
    7. Return status + message
  - GET Logic (admin only):
    1. Verify user is admin
    2. Fetch pending_admin requests with user info + image preview
    3. Return list
  - Tests: `src/app/api/refunds/image/__tests__/route.test.ts` (new)
    - Test successful auto-approve (< 49 refunds)
    - Test pending admin (50+ refunds)
    - Test duplicate refund prevention
    - Test unauthorized access
    - Test image not found
  - Acceptance:
    - Auto-approve works for users with < 49 refunds
    - Pending admin for users with >= 49 refunds
    - Duplicate requests return 400 error
    - Credits refunded correctly
    - Image removed from user's view

- [ ] Create admin approve endpoint
  - Files: `src/app/api/refunds/image/[id]/approve/route.ts` (new)
  - Exports: `POST`
  - Logic:
    1. Verify user is admin
    2. Fetch refund request (must be pending_admin)
    3. Update status to approved, set reviewed_by
    4. Call `refund_credits_for_image()` RPC
    5. Soft delete image
    6. Return success
  - Tests: `src/app/api/refunds/image/__tests__/approve.test.ts` (new)
    - Test admin can approve
    - Test non-admin cannot approve
    - Test already-approved request returns error
  - Acceptance:
    - Only admins can approve
    - Credits refunded after approval
    - Image removed after approval

- [ ] Add refund utility functions
  - Files: `src/lib/db/refunds.ts` (new)
  - Exports:
    ```typescript
    export async function createImageRefundRequest(params: {
      userId: string;
      imageId: string;
      jobId: string;
      reason: RefundReason;
      feedback?: string;
      creditsRefunded: number;
    }): Promise<{ id: string; status: RefundStatus }>;

    export async function getUserRefundCount(userId: string): Promise<number>;

    export async function approveImageRefund(refundId: string, adminId: string): Promise<boolean>;
    ```
  - Tests: `src/lib/db/__tests__/refunds.test.ts` (new)
    - Test refund request creation
    - Test refund count query
    - Test approve refund
  - Acceptance: All functions work correctly

### Phase 2.2: Frontend Components

- [ ] Create ImageRefundModal component
  - Files: `src/components/refunds/image-refund-modal.tsx` (new)
  - Props:
    ```typescript
    interface ImageRefundModalProps {
      imageId: string;
      isOpen: boolean;
      onClose: () => void;
      onSuccess: () => void; // Callback to remove image from gallery
    }
    ```
  - UI Elements:
    - Dialog with title "Request Image Refund"
    - Reason dropdown: Poor quality / Wrong style / Technical issue / Other
    - Feedback textarea (optional)
    - Submit button
    - Result display (approved or pending admin)
  - Logic:
    1. On submit: POST `/api/refunds/image`
    2. Show result message
    3. If approved: call `onSuccess()` after 2s delay, close modal
    4. If pending: show "under review" message
  - Tests: `src/components/refunds/__tests__/image-refund-modal.test.tsx` (new)
    - Test modal opens/closes
    - Test form submission
    - Test success callback triggered
  - Acceptance:
    - Modal displays correctly
    - Form validates (reason required)
    - Success/pending states handled

- [ ] Update ImageCard component to add refund button
  - Files: `src/components/image-card.tsx` (modify)
  - Changes:
    - Add state: `const [showRefundModal, setShowRefundModal] = useState(false)`
    - Add refund button to overlay actions (use return/undo icon)
    - Render `<ImageRefundModal>` with `onSuccess={onDelete}` (reuse existing delete callback)
  - Icon: Use lucide-react `Undo2` or similar
  - Tests: `src/components/__tests__/image-card.test.tsx` (modify)
    - Test refund button renders
    - Test refund button opens modal
  - Acceptance:
    - Refund button visible on hover
    - Modal opens on click
    - Image removed from gallery on successful refund

### Phase 2.3: Feature Flag (Optional)

- [ ] Add feature flag for image refunds
  - Files: `.env.local` (add), `src/lib/feature-flags.ts` (new or modify)
  - Env var: `ENABLE_IMAGE_REFUNDS=true`
  - Usage in ImageCard:
    ```typescript
    const showRefundButton = process.env.NEXT_PUBLIC_ENABLE_IMAGE_REFUNDS === 'true';
    ```
  - Tests: Not needed for env var
  - Acceptance: Feature can be toggled on/off

## Deployment Steps

1. **Internal beta** (Week 1):
   ```bash
   # Set in Vercel environment variables
   NEXT_PUBLIC_ENABLE_IMAGE_REFUNDS=true

   # Deploy to staging
   vercel --prod

   # Test with internal team (5-10 refund requests)
   ```

2. **Public launch** (Week 2):
   ```bash
   # Remove feature flag check or set to true in production
   # Monitor refund request volume
   # Alert if > 100 requests/day
   ```

## Acceptance Criteria

- [ ] Users can request refunds from image gallery
- [ ] Auto-approve works for users with < 49 refunds
- [ ] Pending admin for users with >= 49 refunds
- [ ] Credits refunded correctly to user balance
- [ ] Images removed from user's dashboard after refund
- [ ] Duplicate refund requests prevented
- [ ] Refund count tracked accurately per user
- [ ] Unit tests pass with ≥75% coverage
- [ ] No TypeScript errors

## Files to Create

**Backend**:
- `src/app/api/refunds/image/route.ts`
- `src/app/api/refunds/image/[id]/approve/route.ts`
- `src/lib/db/refunds.ts`

**Frontend**:
- `src/components/refunds/image-refund-modal.tsx`

**Tests**:
- `src/app/api/refunds/image/__tests__/route.test.ts`
- `src/app/api/refunds/image/__tests__/approve.test.ts`
- `src/lib/db/__tests__/refunds.test.ts`
- `src/components/refunds/__tests__/image-refund-modal.test.tsx`

**Modified**:
- `src/components/image-card.tsx`
- `src/components/__tests__/image-card.test.tsx`

## Files to Export (Types)

- [ ] Add types to `src/types/index.ts`:
  ```typescript
  export type RefundReason = 'poor_quality' | 'wrong_style' | 'technical_issue' | 'other';
  export type RefundStatus = 'pending_auto' | 'pending_admin' | 'approved' | 'rejected';

  export interface ImageRefundRequest {
    id: string;
    user_id: string;
    image_id: string;
    job_id: string;
    status: RefundStatus;
    reason: RefundReason;
    feedback?: string;
    credits_refunded: number;
    reviewed_by?: string;
    admin_notes?: string;
    requested_at: string;
    processed_at?: string;
  }
  ```

## Dependencies

- Phase 1 (Database Foundation) deployed
- `src/lib/db/generated-images.ts` (softDeleteImage function)
- `src/lib/supabase/admin.ts` (admin client)
- `src/components/ui/dialog.tsx` (Dialog component from shadcn/ui)
- `src/components/ui/select.tsx` (Select component)
- `src/components/ui/textarea.tsx` (Textarea component)

## Monitoring

**Metrics to track**:
- Total refund requests (daily)
- Auto-approve rate (%)
- Pending admin queue size
- Average refund rate per user

**Alerts**:
- Warning: Refund requests > 100/day
- Critical: Admin queue > 50 pending

## User Experience Flow

1. User navigates to gallery, sees generated image
2. Hovers over image, sees refund button (undo icon)
3. Clicks refund button
4. Modal opens with reason dropdown + feedback box
5. User selects reason, optionally adds feedback
6. Clicks "Submit Request"
7. **If auto-approved**:
   - Shows "Refund Approved" message with green checkmark
   - "1 credit has been refunded to your account"
   - Modal closes after 2s
   - Image removed from gallery
8. **If pending admin**:
   - Shows "Under Review" message with blue info icon
   - "Your refund request is under review. You'll be notified once processed."
   - Modal stays open, user clicks "Close"

## Future Enhancements

- Email notification when refund processed
- Refund history page in settings
- Analytics dashboard for refund reasons
- Feedback aggregation for prompt improvement
