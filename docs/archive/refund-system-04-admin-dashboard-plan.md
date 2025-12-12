# Refund System - Phase 4: Admin Dashboard

## Overview

Build admin dashboard for reviewing and approving image refund requests that exceed the auto-approve threshold (50+). Includes admin authentication, approval queue UI, and audit trail.

**Dependencies**: Phase 1 (Database Foundation) and Phase 2 (Image Refunds) must be deployed first.

## Architecture Decisions

### Admin Authentication
- **Choice**: Simple `is_admin` boolean flag on `users` table
- **Rationale**:
  - Simple to implement and understand
  - Sufficient for small team (1-3 admins initially)
  - Expandable to RBAC (Role-Based Access Control) later if needed
  - Leverages existing Supabase RLS policies

### Admin Routes
- **Choice**: `/admin/*` routes protected by middleware
- **Rationale**:
  - Clear separation from user routes
  - Middleware check prevents unauthorized access
  - Easy to add more admin pages later (analytics, user management)

### Approval Workflow
- **Choice**: Approve/Reject buttons with optional admin notes
- **Rationale**:
  - Simple binary decision (approve = refund, reject = no refund)
  - Admin notes for future reference (audit trail)
  - Reject functionality deferred to future (MVP = approve only)

## Implementation Tasks

### Phase 4.1: Admin Route Protection

- [ ] Create or update middleware for admin protection
  - Files: `src/middleware.ts` (create or modify)
  - Logic:
    1. Check if pathname starts with `/admin`
    2. Get authenticated user
    3. If not authenticated: redirect to `/login`
    4. Query `users` table for `is_admin` flag
    5. If not admin: redirect to `/`
    6. Otherwise: allow request
  - Config:
    ```typescript
    export const config = {
      matcher: ['/admin/:path*'],
    };
    ```
  - Tests: `src/__tests__/middleware.test.ts` (new)
    - Test admin user can access /admin
    - Test non-admin user redirected to /
    - Test unauthenticated user redirected to /login
  - Acceptance:
    - Only admins can access /admin routes
    - Redirects work correctly

### Phase 4.2: Admin Dashboard Pages

- [ ] Create admin refunds page
  - Files: `src/app/admin/refunds/page.tsx` (new)
  - Logic:
    1. Server component
    2. Get authenticated user
    3. Check admin status (double-check even with middleware)
    4. If not admin: redirect to `/`
    5. Render RefundApprovalQueue component
  - UI:
    - Page title: "Refund Approval Queue"
    - Container with max width
    - RefundApprovalQueue component
  - Tests: Not applicable (server component, tested via E2E)
  - Acceptance: Page renders for admins only

- [ ] Create admin layout (optional but recommended)
  - Files: `src/app/admin/layout.tsx` (new)
  - Purpose: Shared layout for all admin pages
  - UI:
    - Navigation sidebar (future: links to other admin pages)
    - Page title/breadcrumbs
    - Logout button
  - Tests: Not applicable
  - Acceptance: Layout applied to all /admin pages

### Phase 4.3: Admin Components

- [ ] Create RefundApprovalQueue component
  - Files: `src/components/admin/refund-approval-queue.tsx` (new)
  - Logic:
    1. `useEffect` → fetch GET `/api/refunds/image` (admin endpoint)
    2. Display pending requests as cards
    3. Each card shows: image preview, user info, reason, feedback, timestamp
    4. Approve button → POST `/api/refunds/image/:id/approve`
    5. On success: remove from list
    6. Reject button (future): POST `/api/refunds/image/:id/reject`
  - UI:
    - Loading state: Skeleton cards
    - Empty state: "No pending refund requests"
    - Request card:
      - Left: Image preview (32x32 or 128x128)
      - Right: User email/name, reason badge, feedback text, timestamp
      - Bottom: Approve/Reject buttons
  - State management:
    - `requests` state (array of pending requests)
    - `processingIds` state (Set of IDs being processed)
  - Tests: `src/components/admin/__tests__/refund-approval-queue.test.tsx` (new)
    - Test fetches pending requests on mount
    - Test displays requests correctly
    - Test approve button calls API
    - Test empty state
  - Acceptance:
    - Fetches pending requests correctly
    - Displays all request details
    - Approve button works
    - Loading/empty states handled

- [ ] Create admin navigation component (optional)
  - Files: `src/components/admin/admin-nav.tsx` (new)
  - Purpose: Sidebar navigation for admin pages
  - Links:
    - Refunds (active in this phase)
    - Analytics (future)
    - Users (future)
    - Settings (future)
  - Tests: Not needed (simple nav component)
  - Acceptance: Navigation renders and links work

### Phase 4.4: Admin Database Queries

- [ ] Add admin refund queries
  - Files: `src/lib/db/refunds.ts` (modify)
  - Add exports:
    ```typescript
    export async function getPendingAdminRefunds(): Promise<PendingRefundWithDetails[]>;
    export async function approveRefund(
      refundId: string,
      adminId: string,
      notes?: string
    ): Promise<boolean>;
    ```
  - `getPendingAdminRefunds` query:
    ```typescript
    return await supabase
      .from('image_refund_requests')
      .select(`
        id,
        reason,
        feedback,
        requested_at,
        credits_refunded,
        user_id,
        image_id,
        users!inner(email, display_name),
        generated_images!inner(public_url)
      `)
      .eq('status', 'pending_admin')
      .order('requested_at', { ascending: true });
    ```
  - Tests: `src/lib/db/__tests__/refunds.test.ts` (modify)
    - Test query returns pending requests with joins
    - Test approve updates status
  - Acceptance: Queries work correctly

### Phase 4.5: Manual Admin Grant

- [ ] Document manual admin grant process
  - Files: `docs/admin-setup.md` (new)
  - Content:
    ```markdown
    # Admin Setup

    ## Grant Admin Role

    Run this SQL in Supabase SQL Editor:

    ```sql
    UPDATE public.users
    SET is_admin = true
    WHERE email = 'admin@productpix.ai';
    ```

    ## Verify Admin Access

    1. Log in as admin@productpix.ai
    2. Navigate to /admin/refunds
    3. Should see refund approval queue
    ```
  - Acceptance: Documentation clear and accurate

## Deployment Steps

1. **Initial deployment** (after Phase 2):
   ```bash
   # Deploy admin routes and components
   vercel --prod

   # Grant admin role manually
   # Run SQL in Supabase SQL Editor:
   UPDATE public.users
   SET is_admin = true
   WHERE email = 'admin@productpix.ai';

   # Test admin access
   # Login as admin, navigate to /admin/refunds
   ```

2. **Training**:
   - Walk support team through approval flow
   - Show how to review image, reason, feedback
   - Explain approve button (refunds credits, removes image)

## Acceptance Criteria

- [ ] `/admin/*` routes protected by middleware
- [ ] Only admins can access admin dashboard
- [ ] Pending refund requests displayed correctly
- [ ] Image preview shows in request cards
- [ ] User info (email/name) displayed
- [ ] Reason and feedback shown
- [ ] Approve button works correctly
- [ ] Credits refunded after approval
- [ ] Image removed after approval
- [ ] Request removed from queue after approval
- [ ] Loading and empty states handled
- [ ] No TypeScript errors

## Files to Create

**Middleware**:
- `src/middleware.ts` (create or modify)

**Pages**:
- `src/app/admin/layout.tsx`
- `src/app/admin/refunds/page.tsx`

**Components**:
- `src/components/admin/refund-approval-queue.tsx`
- `src/components/admin/admin-nav.tsx` (optional)

**Documentation**:
- `docs/admin-setup.md`

**Tests**:
- `src/__tests__/middleware.test.ts`
- `src/components/admin/__tests__/refund-approval-queue.test.tsx`

**Modified**:
- `src/lib/db/refunds.ts`
- `src/lib/db/__tests__/refunds.test.ts`

## Files to Export (Types)

- [ ] Add types to `src/types/index.ts`:
  ```typescript
  export interface PendingRefundWithDetails extends ImageRefundRequest {
    users: {
      email: string;
      display_name?: string;
    };
    generated_images: {
      public_url: string;
    };
  }
  ```

## Dependencies

- Phase 1 (Database Foundation) deployed
- Phase 2 (Image Refunds) deployed
- `src/app/api/refunds/image/route.ts` (GET endpoint for admin)
- `src/app/api/refunds/image/[id]/approve/route.ts` (POST endpoint)
- `src/components/ui/card.tsx`, `button.tsx`, `badge.tsx`, `skeleton.tsx` (shadcn/ui)
- `next/image` (Image component for previews)

## Security Considerations

### Admin Role Assignment
- **Current**: Manual SQL update by database admin
- **Future**: Admin management UI (create/revoke admin access)
- **Risk**: Database access required to grant admin role
- **Mitigation**: Limit database access to trusted personnel only

### RLS Policies
- Double-check RLS policies allow admins to:
  - SELECT all image_refund_requests
  - UPDATE image_refund_requests
  - SELECT all cash_refund_requests (view only)
- Verify policies in migration 00027

### Middleware Protection
- Middleware checks admin status on every request
- Server components double-check admin status
- Defense in depth: Both client and server validation

## Monitoring

**Metrics to track**:
- Pending admin queue size
- Average time to approval
- Number of approvals per admin per day
- Rejection rate (when implemented)

**Alerts**:
- Warning: Admin queue > 20 pending requests
- Critical: Admin queue > 50 pending requests

## User Experience Flow (Admin)

1. Admin logs in to ProductPix
2. Navigates to `/admin/refunds` (via direct URL or future nav menu)
3. Middleware checks admin status, allows access
4. Page loads, fetches pending requests
5. **If pending requests exist**:
   - List of cards shows requests
   - Each card displays:
     - Image preview (left)
     - User: john@example.com (John Doe)
     - Reason: Poor quality result (badge)
     - Feedback: "Image is blurry and colors are off"
     - Requested: 2 hours ago
     - Approve/Reject buttons
6. Admin reviews image and feedback
7. Clicks "Approve Refund" button
8. Button shows loading state ("Approving...")
9. API call completes:
   - Credits refunded to user
   - Image removed from user's view
   - Request removed from admin queue
10. Card disappears from list
11. **If no pending requests**:
    - Shows: "No pending refund requests"

## Future Enhancements

- Reject functionality with reason
- Batch approval (approve multiple at once)
- Search/filter by user, date, reason
- Refund analytics dashboard
- Email notifications to admins when queue > threshold
- Admin activity log (who approved what, when)
- User lookup (view user's refund history)
