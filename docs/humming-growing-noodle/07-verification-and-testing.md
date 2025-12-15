# Verification and Testing Checklist

## Overview

Final verification step to ensure all changes work correctly before deployment.

## Type Checking

```bash
bun run typecheck
```

**Expected:** No TypeScript errors

**If errors found:**
- Review error messages carefully
- Common issues: Missing imports, incorrect types, any casts not removed
- Fix errors and re-run typecheck

---

## Database Verification

### 1. Verify Migrations Applied

```bash
npx supabase db push
```

**Expected:** All 4 migrations applied successfully
- `20251215000003_add_user_activity_rls.sql`
- `20251215000004_add_user_activity_composite_index.sql`
- `20251215000005_add_last_active_trigger.sql`
- `20251215000006_create_unified_timeline_view.sql`

**If errors:**
- Check migration syntax
- Verify table/column names match database schema
- Check for conflicts with existing migrations

### 2. Verify Database Structure

```bash
# Connect to database (adjust connection string as needed)
psql $DATABASE_URL

# Verify RLS policies
\d+ user_activity

# Verify indexes
\di+ idx_user_activity_user_type_time

# Verify trigger
\df update_user_last_active

# Verify view structure
\d+ user_timeline_view

# Test view query
SELECT type, COUNT(*) FROM user_timeline_view GROUP BY type;
```

**Expected:**
- RLS enabled on user_activity table
- Composite index exists
- Trigger function and trigger exist
- View returns data from all 8 tables

---

## API Testing

### 1. Start Development Server

```bash
bun run dev
```

### 2. Test Timeline API

```bash
# Replace {userId} with actual admin user ID from database
USER_ID="your-user-id-here"

# Test basic timeline fetch
curl "http://localhost:3000/api/admin/users/${USER_ID}/timeline?limit=20"

# Test with type filter
curl "http://localhost:3000/api/admin/users/${USER_ID}/timeline?types=job,transaction&limit=10"

# Test with date filter
curl "http://localhost:3000/api/admin/users/${USER_ID}/timeline?startDate=2025-01-01T00:00:00Z&limit=10"

# Test pagination
curl "http://localhost:3000/api/admin/users/${USER_ID}/timeline?limit=5"
# Note the nextCursor from response, then:
curl "http://localhost:3000/api/admin/users/${USER_ID}/timeline?limit=5&cursor={nextCursor}"
```

**Expected:**
- Returns events from all 8 event types
- Pagination works correctly
- Filters work correctly
- Metadata structure matches TimelineEvent interface

### 3. Test User List API Validation

```bash
# Test valid parameters
curl "http://localhost:3000/api/admin/users?search=test&limit=10"

# Test invalid limit (should return 400)
curl "http://localhost:3000/api/admin/users?limit=500"

# Expected response:
# {"error":"Invalid query parameters","details":[{"code":"too_big",...}]}

# Test invalid sortBy (should return 400)
curl "http://localhost:3000/api/admin/users?sortBy=invalid_field"

# Expected response:
# {"error":"Invalid query parameters","details":[{"code":"invalid_enum_value",...}]}

# Test boolean coercion
curl "http://localhost:3000/api/admin/users?hasErrors=true&limit=5"

# Test number coercion
curl "http://localhost:3000/api/admin/users?minCredits=100&maxCredits=1000"
```

**Expected:**
- Valid params return 200 with user list
- Invalid params return 400 with detailed validation errors

---

## Manual UI Testing

### Checklist

Open browser to `http://localhost:3000/admin/users` (requires admin authentication)

- [ ] **Page Loads:** Admin users page loads without errors
- [ ] **User List:** User list displays correctly with all columns
- [ ] **Search Filter:** Search by email/name works correctly
- [ ] **Credit Filters:** Min/max credit filters work
- [ ] **Error Filter:** "Has Errors" filter shows only users with errors
- [ ] **Message Filter:** "Has Messages" filter shows only users with messages
- [ ] **Sorting:** Column sorting works (created_at, credit_balance, last_active)
- [ ] **Pagination:** "Load More" button works correctly
- [ ] **Keyboard Navigation:**
  - Press Tab to focus on table rows
  - Press Enter on focused row → navigates to user detail page
  - Focus ring is visible and clear
- [ ] **Performance:**
  - Open browser DevTools Network tab
  - Load user list
  - Verify: Only 1 database query (not 60+)
  - No N+1 query pattern visible

### User Timeline Testing

Navigate to a specific user detail page (click on any user from the list)

- [ ] **Timeline Loads:** User timeline displays without errors
- [ ] **Event Types:** All 8 event types visible (job, transaction, message, image, feedback, error, upload, activity)
- [ ] **Event Details:** Each event shows correct metadata
- [ ] **Type Filter:** Filter by event type works
- [ ] **Date Filter:** Filter by date range works
- [ ] **Pagination:** Timeline pagination works correctly
- [ ] **Activity Tracking:** After any user action, verify last_active_at updates automatically

### Activity Trigger Testing

Test the automatic last_active_at trigger:

```sql
-- Manually insert activity
INSERT INTO user_activity (user_id, event_type, properties)
VALUES ('your-user-id', 'login', '{}');

-- Verify last_active_at was updated
SELECT id, last_active_at FROM users WHERE id = 'your-user-id';
```

**Expected:** `last_active_at` timestamp should match the `created_at` of the inserted activity

---

## Performance Verification

### 1. Network Tab Analysis

1. Open browser DevTools → Network tab
2. Load admin users page
3. Filter to "Fetch/XHR" requests
4. Check `/api/admin/users` request

**Expected:**
- Single request returns all user data with counts
- No additional requests for jobCount/errorCount/messageCount per user

### 2. React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Start recording
4. Load users page, interact with filters
5. Stop recording

**Expected:**
- `UsersListPageClient` component doesn't re-render unnecessarily
- `allUsers` memoization prevents expensive recalculations

---

## Rollback Plan

If critical issues are found:

### 1. Revert Database Migrations

```bash
# Reset database to previous state
npx supabase db reset

# Manually rollback specific migrations if needed
psql $DATABASE_URL -c "DROP VIEW IF EXISTS user_timeline_view;"
psql $DATABASE_URL -c "DROP TRIGGER IF EXISTS user_activity_update_last_active ON user_activity;"
```

### 2. Revert Code Changes

```bash
# Revert all TypeScript changes
git checkout HEAD -- src/

# Or revert specific files
git checkout HEAD -- src/lib/db/admin-timeline.ts
git checkout HEAD -- src/lib/db/admin-stats.ts
```

### 3. Restore Original Commit

```bash
# If complete rollback needed
git checkout cce9888a
```

---

## Sign-Off Criteria

All items below must be checked before considering the implementation complete:

### Database Layer
- [ ] All 4 migrations applied successfully
- [ ] RLS policies enforce admin-only access to user_activity
- [ ] Composite index created on user_activity
- [ ] Trigger updates last_active_at atomically
- [ ] View returns data from all 8 tables

### Type Safety
- [ ] No TypeScript errors (`bun run typecheck` passes)
- [ ] All `any` casts removed from affected files
- [ ] Generated types include user_activity and last_active_at

### API Functionality
- [ ] Timeline API returns events from unified view
- [ ] Timeline pagination works correctly
- [ ] Timeline filters (type, date) work correctly
- [ ] User list API validates query parameters
- [ ] Invalid parameters return 400 with details

### Performance
- [ ] User list uses single query (no N+1 pattern)
- [ ] Network tab shows 1 query instead of 60+
- [ ] Timeline query faster (view vs 8 parallel queries)

### UI/UX
- [ ] Table rows keyboard navigable (Tab, Enter, Space)
- [ ] Focus indicators visible and clear
- [ ] useMemo prevents unnecessary recalculations
- [ ] All filters and sorting work correctly

### Code Quality
- [ ] Structured logging used (no console.warn on server)
- [ ] Zod validation schemas properly typed
- [ ] Functions follow ≤20 line guideline (where applicable)
- [ ] Explicit return types on API routes

---

## Notes

- **No breaking changes** to public APIs
- **trackActivity pattern** remains fire-and-forget (correct as-is)
- **Post-query filters** (hasErrors/hasMessages) are documented limitation
- **View vs Materialized View**: Can upgrade to materialized later if needed

---

## Success Criteria Met?

If all checkboxes above are checked and no critical issues found:

**✅ Implementation Complete - Ready for Deployment**

If issues found:
- Document issues in detail
- Determine if minor fixes or rollback needed
- Apply fixes or execute rollback plan
- Re-run verification
