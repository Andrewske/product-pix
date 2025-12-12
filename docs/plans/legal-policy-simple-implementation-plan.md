# Legal Policy Simple Features Implementation Plan

## Overview
Implement self-service features required by legal policy decisions: credit refunds (per-generation), cookie preferences UI, and account deletion flow. These are the simple-to-medium complexity items that don't require third-party integrations.

## Architecture Decisions

### Credit Refund System
- **Decision**: Use existing `refund_credits` RPC, add `refunded_at` column to track refund state
- **Rationale**: Backend already exists, just needs UI and duplicate prevention
- **30-day window**: Aligns with image retention policy (30 days before deletion)

### Cookie Preferences Storage
- **Decision**: Store in existing `users.preferences` JSONB column
- **Rationale**: No schema changes needed, flexible for future preference additions
- **Structure**: `{ cookies: { analytics: boolean, marketing: boolean, updatedAt: string } }`

### Account Deletion Approach
- **Decision**: Soft delete + anonymize with 30-day restore window
- **Rationale**: Complies with "data deletion" promise while preserving audit trail
- **Anonymization**: Email → `deleted_{uuid}@deleted.local`, name → "Deleted User"
- **Preserved**: Credit transactions (for accounting), anonymized usage metrics

### UI Organization
- **Decision**: New "Privacy" tab (4th tab in settings)
- **Rationale**: Clean separation, room for future privacy features (download data, etc.)
- **Tab order**: Account → Billing → Credits → Privacy

## Implementation Tasks

### Phase 1: Database Migrations

#### Task 1.1: Add refunded_at Column to Generated Images
- [ ] Create migration to add `refunded_at` column
  - **Files**: `supabase/migrations/XXXXX_add_refunded_at_to_generated_images.sql` (new)
  - **Schema change**:
    ```sql
    ALTER TABLE generated_images
    ADD COLUMN refunded_at TIMESTAMPTZ DEFAULT NULL;

    CREATE INDEX idx_generated_images_refunded_at
    ON generated_images(refunded_at)
    WHERE refunded_at IS NOT NULL;
    ```
  - **Tests**: Manual verification via `npx supabase db push`
  - **Acceptance**: Column exists, index created, no existing data affected

#### Task 1.2: Add deleted_at Column to Users Table
- [ ] Create migration to add `deleted_at` column
  - **Files**: `supabase/migrations/XXXXX_add_deleted_at_to_users.sql` (new)
  - **Schema change**:
    ```sql
    ALTER TABLE users
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

    CREATE INDEX idx_users_deleted_at ON users(deleted_at);
    ```
  - **Tests**: Manual verification via `npx supabase db push`
  - **Acceptance**: Column exists, index created, no existing data affected

#### Task 1.3: Create Account Deletion RPC Function
- [ ] Create `soft_delete_account` RPC function
  - **Files**: `supabase/migrations/XXXXX_create_soft_delete_account_rpc.sql` (new)
  - **Function signature**: `soft_delete_account(p_user_id UUID) RETURNS TABLE(success BOOLEAN, message TEXT)`
  - **Logic**:
    - Check user exists and not already deleted
    - Set `deleted_at = NOW()`
    - Anonymize email: `CONCAT('deleted_', id, '@deleted.local')`
    - Anonymize name: `'Deleted User'`
    - Update preferences: `jsonb_build_object('deleted', true)`
    - Soft delete uploads: `UPDATE uploads SET deleted_at = NOW()`
    - Soft delete images: `UPDATE generated_images SET deleted_at = NOW()`
  - **Tests**: Manual SQL testing in Supabase Studio
  - **Acceptance**: Function executes successfully, data anonymized, soft deletes cascade

#### Task 1.4: Update RLS Policies for Deleted Users
- [ ] Update users table RLS to exclude deleted accounts
  - **Files**: `supabase/migrations/XXXXX_update_users_rls_for_deletion.sql` (new)
  - **Policy change**:
    ```sql
    DROP POLICY IF EXISTS "Users can view own profile" ON users;

    CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id
      AND deleted_at IS NULL
    );
    ```
  - **Tests**: Manual verification - deleted user cannot query own data
  - **Acceptance**: Deleted users blocked from RLS policies

### Phase 2: Backend - Credit Refund System

#### Task 2.1: Add Database Query for Refund Validation
- [ ] Add `getImageForRefund()` to generated-images queries
  - **Files**: `src/lib/db/generated-images.ts` (modify)
  - **Function signature**:
    ```typescript
    export async function getImageForRefund(
      imageId: string,
      userId: string
    ): Promise<{
      canRefund: boolean;
      reason?: string;
      creditsToRefund?: number;
      createdAt: Date;
      jobId: string;
    } | null>
    ```
  - **Logic**:
    - Query `generated_images` joined with `jobs`
    - Check: user owns image, created within 30 days, not refunded, has credits charged
    - Return refund eligibility with reason if cannot refund
  - **Tests**: `src/lib/db/__tests__/generated-images.test.ts` (create if needed)
  - **Test cases**:
    - ✓ Eligible image returns `canRefund: true` with credits
    - ✓ Older than 30 days returns `canRefund: false` with reason
    - ✓ Already refunded returns `canRefund: false` with reason
    - ✓ Wrong user returns `null`
  - **Acceptance**: All test cases pass, TypeScript types correct

#### Task 2.2: Create Refund Generation Server Action
- [ ] Create `refundGeneration` server action
  - **Files**: `src/app/actions/refund-generation.ts` (new)
  - **Dependencies**: `src/lib/db/generated-images.ts`, `src/lib/db/credits.ts`, `src/lib/supabase/server.ts`
  - **Function signature**:
    ```typescript
    'use server';
    export async function refundGeneration(imageId: string): Promise<{
      success: boolean;
      message: string;
      creditsRefunded?: number;
    }>
    ```
  - **Logic**:
    1. Get current user from auth
    2. Call `getImageForRefund()` to validate
    3. If not eligible, return error with reason
    4. Call `refundCredits(userId, creditsToRefund, jobId, description)`
    5. Update `generated_images.refunded_at = NOW()`
    6. Return success with credits refunded
  - **Error handling**: Wrap in try/catch, return `{ success: false, message: error }`
  - **Tests**: `src/app/actions/__tests__/refund-generation.test.ts` (new)
  - **Test cases**:
    - ✓ Valid refund succeeds
    - ✓ Expired image returns error
    - ✓ Already refunded returns error
    - ✓ Unauthenticated returns error
    - ✓ Transaction recorded in credit_transactions
  - **Acceptance**: All tests pass, refund appears in credit history

### Phase 3: UI - Credit Refund Components

#### Task 3.1: Create Refund Dialog Component
- [ ] Create `RefundDialog` component
  - **Files**: `src/components/generation/refund-dialog.tsx` (new)
  - **Dependencies**: `src/components/ui/dialog.tsx`, `src/components/ui/button.tsx`, `src/app/actions/refund-generation.ts`
  - **Props**: `{ imageId: string; creditsToRefund: number; isOpen: boolean; onClose: () => void; onSuccess: () => void }`
  - **UI elements**:
    - Dialog with warning icon
    - Title: "Refund Credits?"
    - Description: Shows credits to be refunded, explains image stays accessible
    - Two buttons: "Cancel" (secondary), "Refund {X} Credits" (destructive)
  - **Behavior**:
    - Calls `refundGeneration()` on confirm
    - Shows loading state during refund
    - Displays error toast on failure
    - Displays success toast on success
    - Calls `onSuccess()` callback to refresh parent
    - Optimistic UI: disables button immediately
  - **Tests**: `src/components/generation/__tests__/refund-dialog.test.tsx` (new)
  - **Test cases**:
    - ✓ Renders with correct credit amount
    - ✓ Calls refundGeneration on confirm
    - ✓ Shows loading state during request
    - ✓ Displays error message on failure
    - ✓ Calls onSuccess callback on success
  - **Acceptance**: Component renders, refund flows work, tests pass

#### Task 3.2: Create Refund Button Component
- [ ] Create `RefundButton` component
  - **Files**: `src/components/generation/refund-button.tsx` (new)
  - **Dependencies**: `src/components/ui/button.tsx`, `src/components/ui/tooltip.tsx`, `src/components/generation/refund-dialog.tsx`
  - **Props**:
    ```typescript
    {
      imageId: string;
      createdAt: Date;
      refundedAt: Date | null;
      creditsCharged: number;
      onRefundSuccess: () => void;
    }
    ```
  - **Logic**:
    - Calculate if refundable: within 30 days, not refunded
    - Show button with tooltip explaining eligibility
    - Open `RefundDialog` on click
  - **States**:
    - Refundable: Button enabled, "Refund Credits" text
    - Already refunded: Button disabled, "Refunded" text, tooltip explains
    - Expired (>30 days): Button disabled, "Expired" text, tooltip explains
  - **Tests**: `src/components/generation/__tests__/refund-button.test.tsx` (new)
  - **Test cases**:
    - ✓ Shows enabled button for refundable image
    - ✓ Shows disabled with "Refunded" for refunded image
    - ✓ Shows disabled with "Expired" for old image
    - ✓ Opens dialog on click
    - ✓ Tooltip shows correct message for each state
  - **Acceptance**: All states render correctly, tests pass

#### Task 3.3: Update Studio Page to Show Refund Buttons
- [ ] Integrate `RefundButton` into image cards
  - **Files**: `src/app/studio/page.tsx` (modify)
  - **Changes**:
    - Import `RefundButton`
    - Update image query to include `refunded_at` and `jobs.credits_charged`
    - Add `RefundButton` to each image card's action area
    - Add "Refunded" badge to refunded images
    - Pass `onRefundSuccess` callback to refetch images
  - **UI placement**: Below favorite button, above delete button
  - **Tests**: Manual testing in dev environment
  - **Acceptance**: Refund button appears on all images, states correct

### Phase 4: Backend - Cookie Preferences

#### Task 4.1: Add Database Function for Cookie Preferences
- [ ] Add `updateCookiePreferences()` to users queries
  - **Files**: `src/lib/db/users.ts` (modify)
  - **Function signature**:
    ```typescript
    export async function updateCookiePreferences(
      userId: string,
      cookies: { analytics: boolean; marketing: boolean }
    ): Promise<void>
    ```
  - **Logic**:
    - Get existing preferences JSONB
    - Merge new cookie preferences with timestamp
    - Update `users.preferences` via Supabase
  - **Tests**: `src/lib/db/__tests__/users.test.ts` (modify/create)
  - **Test cases**:
    - ✓ Updates preferences correctly
    - ✓ Preserves other preferences
    - ✓ Adds timestamp
  - **Acceptance**: Function updates preferences, tests pass

#### Task 4.2: Create Update Cookie Preferences Server Action
- [ ] Create `updateCookiePreferences` server action
  - **Files**: `src/app/actions/update-cookie-preferences.ts` (new)
  - **Dependencies**: `src/lib/db/users.ts`, `src/lib/supabase/server.ts`
  - **Function signature**:
    ```typescript
    'use server';
    export async function updateCookiePreferences(preferences: {
      analytics: boolean;
      marketing: boolean;
    }): Promise<{ success: boolean; message: string }>
    ```
  - **Logic**:
    1. Get current user from auth
    2. Validate preferences object
    3. Call `updateCookiePreferences(userId, preferences)`
    4. Return success
  - **Error handling**: Try/catch, return error message
  - **Tests**: `src/app/actions/__tests__/update-cookie-preferences.test.ts` (new)
  - **Test cases**:
    - ✓ Valid update succeeds
    - ✓ Unauthenticated returns error
    - ✓ Preferences persisted to database
  - **Acceptance**: Tests pass, preferences save correctly

### Phase 5: UI - Cookie Preferences Components

#### Task 5.1: Create Cookie Preferences Component
- [ ] Create `CookiePreferences` component
  - **Files**: `src/components/settings/cookie-preferences.tsx` (new)
  - **Dependencies**: `src/components/ui/card.tsx`, `src/components/ui/switch.tsx`, `src/app/actions/update-cookie-preferences.ts`
  - **Props**: `{ initialPreferences: { analytics: boolean; marketing: boolean } }`
  - **UI elements**:
    - Card with title "Cookie Preferences"
    - Two switch toggles:
      - Analytics: Description matching Privacy Policy
      - Marketing: Description matching Privacy Policy
    - Save button (or auto-save on toggle)
    - Success/error messaging
  - **Behavior**:
    - Load initial state from props (from user preferences)
    - Default to `false` if not set (opt-in)
    - Optimistic updates with revert on error
    - Auto-save on toggle change
  - **Tests**: `src/components/settings/__tests__/cookie-preferences.test.tsx` (new)
  - **Test cases**:
    - ✓ Renders with initial preferences
    - ✓ Toggles update local state
    - ✓ Calls server action on change
    - ✓ Shows success message
    - ✓ Reverts on error
  - **Acceptance**: Component renders, toggles work, tests pass

#### Task 5.2: Create Privacy Tab Component
- [ ] Create `PrivacyTab` component
  - **Files**: `src/components/settings/privacy-tab.tsx` (new)
  - **Dependencies**: `src/components/settings/cookie-preferences.tsx`, `src/components/ui/card.tsx`
  - **UI structure**:
    - Page container with title "Privacy Settings"
    - Section 1: Cookie Preferences (uses `CookiePreferences` component)
    - Section 2: Data Controls (placeholder card for future features)
  - **Data loading**: Fetch user preferences via server component or client hook
  - **Tests**: `src/components/settings/__tests__/privacy-tab.test.tsx` (new)
  - **Test cases**:
    - ✓ Renders all sections
    - ✓ Passes preferences to CookiePreferences
  - **Acceptance**: Tab renders, shows cookie preferences

#### Task 5.3: Update Settings Tabs to Include Privacy
- [ ] Add Privacy tab to `SettingsTabs` component
  - **Files**: `src/components/settings/settings-tabs.tsx` (modify)
  - **Changes**:
    - Add "privacy" to tab values
    - Add Privacy tab UI (Shield or Lock icon)
    - Import and render `PrivacyTab` component
    - Update tab navigation logic
  - **Tab order**: Account, Billing, Credits, Privacy
  - **Tests**: Manual testing in dev environment
  - **Acceptance**: Privacy tab appears, navigates correctly

### Phase 6: Backend - Account Deletion

#### Task 6.1: Add Database Function for Account Deletion
- [ ] Add `softDeleteAccount()` to users queries
  - **Files**: `src/lib/db/users.ts` (modify)
  - **Function signature**:
    ```typescript
    export async function softDeleteAccount(userId: string): Promise<{
      success: boolean;
      message: string;
    }>
    ```
  - **Logic**: Call `soft_delete_account` RPC via Supabase
  - **Tests**: `src/lib/db/__tests__/users.test.ts` (modify)
  - **Test cases**:
    - ✓ Successful deletion returns success
    - ✓ Already deleted returns error
    - ✓ Non-existent user returns error
  - **Acceptance**: Function calls RPC correctly, tests pass

#### Task 6.2: Create Delete Account Server Action
- [ ] Create `deleteAccount` server action
  - **Files**: `src/app/actions/delete-account.ts` (new)
  - **Dependencies**: `src/lib/db/users.ts`, `src/lib/auth/utils.ts`, `src/lib/supabase/server.ts`
  - **Function signature**:
    ```typescript
    'use server';
    export async function deleteAccount(): Promise<{
      success: boolean;
      message: string;
    }>
    ```
  - **Logic**:
    1. Get current user from auth
    2. Call `softDeleteAccount(userId)`
    3. If successful, call `signOut()` from auth utils
    4. Return success/error
  - **Error handling**: Try/catch, return error message
  - **Tests**: `src/app/actions/__tests__/delete-account.test.ts` (new)
  - **Test cases**:
    - ✓ Valid deletion succeeds
    - ✓ User signed out after deletion
    - ✓ Unauthenticated returns error
    - ✓ User data anonymized in database
  - **Acceptance**: Tests pass, account deletion works end-to-end

### Phase 7: UI - Account Deletion Components

#### Task 7.1: Create Delete Account Dialog Component
- [ ] Create `DeleteAccountDialog` component
  - **Files**: `src/components/settings/delete-account-dialog.tsx` (new)
  - **Dependencies**: `src/components/ui/dialog.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/app/actions/delete-account.ts`
  - **Props**: `{ isOpen: boolean; onClose: () => void }`
  - **UI elements**:
    - Warning dialog with red/destructive styling
    - Title: "Delete Account"
    - Warning icon
    - Description explaining what will happen:
      - Account marked for deletion
      - Email anonymized
      - Images soft-deleted
      - Credit history preserved (anonymized)
      - 30-day restore window (contact support)
    - Input field requiring user to type "DELETE" to confirm
    - Two buttons: "Cancel" (secondary), "Permanently Delete Account" (destructive)
  - **Behavior**:
    - Confirm button disabled until "DELETE" typed
    - Calls `deleteAccount()` on confirm
    - Shows loading state during deletion
    - Redirects to homepage with toast on success
    - Displays error toast on failure
  - **Tests**: `src/components/settings/__tests__/delete-account-dialog.test.tsx` (new)
  - **Test cases**:
    - ✓ Renders with warning styling
    - ✓ Confirm button disabled until "DELETE" typed
    - ✓ Calls deleteAccount on confirm
    - ✓ Shows loading state
    - ✓ Redirects on success
    - ✓ Shows error on failure
  - **Acceptance**: Component renders, deletion flows work, tests pass

#### Task 7.2: Update Privacy Tab to Include Delete Account
- [ ] Add "Danger Zone" section to `PrivacyTab`
  - **Files**: `src/components/settings/privacy-tab.tsx` (modify)
  - **Changes**:
    - Import `DeleteAccountDialog`
    - Add new section at bottom: "Danger Zone"
    - Card with red border
    - "Delete Account" button (destructive styling)
    - Warning text explaining action is permanent
    - Manage dialog open/close state
  - **Tests**: Manual testing in dev environment
  - **Acceptance**: Delete button appears, opens dialog

### Phase 8: Testing & Integration

#### Task 8.1: Manual End-to-End Testing
- [ ] Test complete credit refund flow
  - **Steps**:
    1. Generate image in studio
    2. Verify refund button appears
    3. Click refund, confirm dialog
    4. Verify credits returned in Credits tab
    5. Verify "Refunded" badge appears
    6. Verify cannot refund again
  - **Acceptance**: Full flow works, no errors

- [ ] Test cookie preferences flow
  - **Steps**:
    1. Navigate to Settings → Privacy tab
    2. Toggle analytics on/off
    3. Toggle marketing on/off
    4. Refresh page, verify preferences persist
  - **Acceptance**: Preferences save and persist

- [ ] Test account deletion flow
  - **Steps**:
    1. Navigate to Settings → Privacy tab
    2. Click "Delete Account"
    3. Type "DELETE" and confirm
    4. Verify signed out and redirected
    5. Verify cannot sign back in
    6. Check database: email anonymized, deleted_at set
  - **Acceptance**: Account deleted, data anonymized

#### Task 8.2: Update Database Types
- [ ] Regenerate Supabase types after migrations
  - **Files**: `src/types/database.ts` (regenerate)
  - **Command**: `npx supabase gen types typescript --local > src/types/database.ts`
  - **Acceptance**: Types match new schema (refunded_at, deleted_at columns)

#### Task 8.3: Export New Components
- [ ] Update barrel exports
  - **Files**:
    - `src/components/settings/index.ts` (modify) - export PrivacyTab, CookiePreferences, DeleteAccountDialog
    - `src/components/generation/index.ts` (modify) - export RefundButton, RefundDialog
  - **Acceptance**: Components properly exported

## Acceptance Criteria

### Credit Refund System
- [ ] User can refund any image within 30 days
- [ ] Refund button disabled for images >30 days
- [ ] Refund button shows "Refunded" for already-refunded images
- [ ] Credits returned appear in Credits tab transaction history
- [ ] Duplicate refunds prevented by database constraint
- [ ] All unit tests pass
- [ ] No TypeScript errors

### Cookie Preferences
- [ ] Privacy tab appears in settings navigation
- [ ] Cookie toggles save preferences to database
- [ ] Preferences persist across page reloads
- [ ] Default state is opt-out (both toggles off)
- [ ] All unit tests pass
- [ ] No TypeScript errors

### Account Deletion
- [ ] Delete account button in Privacy tab
- [ ] Confirmation requires typing "DELETE"
- [ ] Account soft-deleted and anonymized
- [ ] User signed out after deletion
- [ ] Deleted user cannot sign back in
- [ ] Credit history preserved (anonymized)
- [ ] All unit tests pass
- [ ] No TypeScript errors

### General
- [ ] All database migrations applied successfully
- [ ] No console errors in browser
- [ ] Test coverage ≥70% for new code
- [ ] All new components follow design system (shadcn/ui)
- [ ] All server actions have proper error handling

## Files to Create

### Database Migrations
1. `supabase/migrations/XXXXX_add_refunded_at_to_generated_images.sql`
2. `supabase/migrations/XXXXX_add_deleted_at_to_users.sql`
3. `supabase/migrations/XXXXX_create_soft_delete_account_rpc.sql`
4. `supabase/migrations/XXXXX_update_users_rls_for_deletion.sql`

### Server Actions
1. `src/app/actions/refund-generation.ts`
2. `src/app/actions/update-cookie-preferences.ts`
3. `src/app/actions/delete-account.ts`

### Components
1. `src/components/generation/refund-button.tsx`
2. `src/components/generation/refund-dialog.tsx`
3. `src/components/settings/privacy-tab.tsx`
4. `src/components/settings/cookie-preferences.tsx`
5. `src/components/settings/delete-account-dialog.tsx`

### Tests
1. `src/lib/db/__tests__/generated-images.test.ts` (or modify existing)
2. `src/lib/db/__tests__/users.test.ts` (or modify existing)
3. `src/app/actions/__tests__/refund-generation.test.ts`
4. `src/app/actions/__tests__/update-cookie-preferences.test.ts`
5. `src/app/actions/__tests__/delete-account.test.ts`
6. `src/components/generation/__tests__/refund-button.test.tsx`
7. `src/components/generation/__tests__/refund-dialog.test.tsx`
8. `src/components/settings/__tests__/cookie-preferences.test.tsx`
9. `src/components/settings/__tests__/privacy-tab.test.tsx`
10. `src/components/settings/__tests__/delete-account-dialog.test.tsx`

## Files to Modify

1. `src/lib/db/generated-images.ts` - Add `getImageForRefund()`
2. `src/lib/db/users.ts` - Add `updateCookiePreferences()`, `softDeleteAccount()`
3. `src/app/studio/page.tsx` - Integrate RefundButton
4. `src/components/settings/settings-tabs.tsx` - Add Privacy tab
5. `src/components/settings/index.ts` - Export new components
6. `src/components/generation/index.ts` - Export new components
7. `src/types/database.ts` - Regenerate after migrations

## Dependencies

### External Dependencies
None - all functionality uses existing packages:
- Supabase client (`@supabase/ssr`, `@supabase/supabase-js`)
- UI components (shadcn/ui already installed)
- React Hook Form (already installed)

### Internal Dependencies
- Phase 2-3 depend on Phase 1 (database migrations must be applied first)
- Phase 4-5 can run in parallel with Phase 2-3 (independent systems)
- Phase 6-7 depend on Phase 1 (database migrations must be applied first)
- Phase 8 depends on all previous phases

### Task Sequencing
**Can run in parallel:**
- Credit refund system (Phases 2-3)
- Cookie preferences (Phases 4-5)

**Must run sequentially:**
1. Database migrations (Phase 1) FIRST
2. Backend + UI for each feature
3. Account deletion (Phases 6-7) after Phase 1
4. Testing (Phase 8) LAST

## Migration Execution Order
1. `XXXXX_add_refunded_at_to_generated_images.sql`
2. `XXXXX_add_deleted_at_to_users.sql`
3. `XXXXX_create_soft_delete_account_rpc.sql`
4. `XXXXX_update_users_rls_for_deletion.sql`

Run: `npx supabase db push` to apply all migrations

## Notes for OpenCode Orchestrator

### Testing Strategy
- Unit tests for all server actions (critical business logic)
- Component tests for interactive components (dialogs, buttons)
- Manual E2E testing checklist provided (Phase 8.1)
- Target coverage: ≥70% for new code

### Design System Compliance
- Use shadcn/ui components (Dialog, Button, Switch, Card, etc.)
- Follow existing patterns in `src/components/settings/` for consistency
- Match styling from existing tabs (Account, Billing, Credits)

### Error Handling
- All server actions must wrap logic in try/catch
- Return `{ success: boolean; message: string }` format
- Display errors via toast notifications (existing pattern)

### Security Considerations
- Server actions verify user authentication
- RLS policies enforce user can only refund/delete own data
- Account deletion requires explicit confirmation ("DELETE" typing)
- No hard deletes - preserve audit trail

### Future Work (Not in This Plan)
These require separate planning/implementation. See **`docs/legal-policy-complex-features-backlog.md`** for detailed documentation of each feature, including technical challenges, dependencies, and questions to answer before implementation:

- Cash refund flow (Stripe API integration)
- A/B testing refund percentages (testing infrastructure)
- Cookie consent banner (legal compliance)
- Facebook Pixel integration (conditional loading)
- Analytics integration (Google Analytics, conditional loading)
- Data anonymization system (automated scheduled cleanup)

**Priority**: Cash refunds and cookie consent banner are must-haves before significant revenue (legal/compliance requirements).
