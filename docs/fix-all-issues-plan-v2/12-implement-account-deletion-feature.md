# Implement Account Deletion Functionality

## Files to Create
- src/app/api/account/delete/route.ts (new - deletion API endpoint)
- src/components/account/delete-account-dialog.tsx (new - UI component)
- src/app/api/cron/cleanup-deleted-accounts/route.ts (new - 30-day cleanup job)

## Files to Modify
- Account settings page (location TBD - likely src/app/(authenticated)/settings/page.tsx)

## Implementation Details

Implement complete account deletion flow with 30-day soft delete, audit logging, and UI. Database table (`account_deletion_audit`) created in Task 05; this phase adds business logic and UI.

### Component 1: Account Deletion API Endpoint

**File:** src/app/api/account/delete/route.ts

```typescript
export async function POST(request: Request): Promise<Response> {
  // 1. Authenticate user
  // 2. Set users.deleted_at = NOW()
  // 3. Store users.original_email before clearing
  // 4. Create account_deletion_audit record with:
  //    - user_id, email, r2_files_queued count
  // 5. Queue R2 file cleanup (mark for deletion)
  // 6. Return success
}
```

**Business Logic:**
- Soft delete (set deleted_at, don't actually delete)
- Preserve original_email for audit trail
- Count R2 files for cleanup metrics
- Create audit log entry

### Component 2: Delete Account Dialog UI

**File:** src/components/account/delete-account-dialog.tsx

**Features:**
- Confirmation dialog with warnings
- Require typing "DELETE" to confirm
- Show data retention policy (30 days)
- Clear explanation of what gets deleted
- Error handling and loading states

**Integration:**
- Import in account settings page
- Trigger on "Delete Account" button click
- Call DELETE API endpoint
- Handle success/error responses

### Component 3: Scheduled Cleanup Job

**File:** src/app/api/cron/cleanup-deleted-accounts/route.ts

```typescript
export async function GET(request: Request): Promise<Response> {
  // 1. Verify cron authorization
  // 2. Find users where deleted_at < NOW() - 30 days
  // 3. For each user:
  //    - Delete R2 files
  //    - Delete DB records (generated_images, jobs, etc.)
  //    - Delete user record itself
  // 4. Return cleanup summary
}
```

**Cron Schedule:** Daily at 2 AM UTC

### Component 4: Account Settings Page Update

**Location:** (TBD - likely src/app/(authenticated)/settings/page.tsx)

**Changes:**
- Add "Delete Account" section
- Include warning text about data deletion
- Button to open DeleteAccountDialog
- Proper spacing/styling per design system

## Acceptance Criteria

- [ ] DELETE API endpoint created and functional
- [ ] Soft delete sets deleted_at correctly
- [ ] original_email preserved for audit
- [ ] account_deletion_audit record created
- [ ] R2 files queued for cleanup
- [ ] DeleteAccountDialog component created with confirmation flow
- [ ] Settings page includes delete account option
- [ ] Cleanup cron job implemented
- [ ] Manual testing completed:
  - [ ] Trigger account deletion
  - [ ] Verify audit log entry
  - [ ] User marked as deleted
  - [ ] Still visible in admin panel
  - [ ] R2 files queued
  - [ ] 30-day cleanup works (test with past date)

## Dependencies

- Task 05 (create-database-schema-migrations) MUST complete first
- account_deletion_audit table must exist

## Risk

Medium - Adds new functionality, critical for legal compliance

## Testing

```bash
# Manual testing checklist
1. Create test user account
2. Navigate to settings
3. Click "Delete Account"
4. Complete confirmation flow
5. Verify in admin panel:
   - User has deleted_at timestamp
   - original_email preserved
   - Audit log entry exists
   - R2 files queued for cleanup
6. Test cleanup cron with manipulated deleted_at date

# Verify API endpoints
curl -X POST http://localhost:3000/api/account/delete \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Check cron job
curl http://localhost:3000/api/cron/cleanup-deleted-accounts \
  -H "Authorization: Bearer <cron-secret>"
```

## Note

**Pre-Production Requirement:** All phases (1-12) must complete before PRODUCTION deployment. Staging/development deployment can proceed after Tasks 1-6.
