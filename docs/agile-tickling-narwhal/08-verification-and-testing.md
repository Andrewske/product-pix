# Verification and Testing

## Priority
**CRITICAL** - Must verify all fixes before deployment

## Files to Verify
All modified files from tasks 01-07

## Testing Checklist

### Pre-Deployment Verification

#### 1. Database Migrations
```bash
# Apply all migrations fresh
npx supabase db reset

# Verify migrations applied successfully
npx supabase migration list
```

**Expected:** All migrations show as applied, no errors

#### 2. TypeScript Build
```bash
# Run full TypeScript compilation
bun run tsc
```

**Expected:**
- Zero errors in modified files
- No `any` type errors in `admin-timeline.ts`
- No cursor type mismatch errors

#### 3. Linting
```bash
# Run ESLint
bun run lint
```

**Expected:**
- No `@typescript-eslint/no-explicit-any` errors
- No `no-console` errors in modified files
- No unused variable warnings from fixes

### Functional Testing

#### 4. Security - RPC Authorization
**Test:** Non-admin user calling RPC
```typescript
// As non-admin user
const response = await fetch('/api/admin/users?limit=10');
// Expected: 403 Forbidden or 401 Unauthorized
```

**Test:** Admin user calling RPC
```typescript
// As admin user
const response = await fetch('/api/admin/users?limit=10');
// Expected: 200 OK with user list
```

#### 5. Security - RLS Policy
**Test:** Insert activity as non-admin for different user
```sql
-- As non-admin user (user_id = 'user-123')
INSERT INTO user_activity (user_id, event_type, properties)
VALUES ('different-user-456', 'login', '{}');
-- Expected: RLS policy violation error
```

**Test:** Insert activity for self
```sql
-- As non-admin user (user_id = 'user-123')
INSERT INTO user_activity (user_id, event_type, properties)
VALUES ('user-123', 'login', '{}');
-- Expected: Success
```

#### 6. Cursor Validation
**Test:** Malformed cursor
```typescript
const malformedCursor = "invalid';DROP TABLE users;--";
const response = await fetch(
  `/api/admin/users/USER_ID/timeline?cursor=${malformedCursor}`
);
// Expected: Returns first page (not error), logs warning
```

**Test:** Valid cursor pagination
```typescript
// Get first page
const page1 = await fetch('/api/admin/users/USER_ID/timeline?limit=5');
const { events: events1, nextCursor } = await page1.json();

// Get second page
const page2 = await fetch(
  `/api/admin/users/USER_ID/timeline?limit=5&cursor=${nextCursor}`
);
const { events: events2 } = await page2.json();

// Expected: events1 and events2 are different, no overlap
```

#### 7. Active Users Count
**Test:** Multiple activities for same user
```typescript
// Insert 3 activities for same user today
await trackActivity(userId, 'login', {});
await trackActivity(userId, 'page_view', {});
await trackActivity(userId, 'image_download', {});

// Check dashboard stats
const stats = await getAdminDashboardStats();
// Expected: activeUsersToday increments by 1, not 3
```

#### 8. User Activity Trigger
**Test:** last_active_at updates automatically
```typescript
const userBefore = await supabase
  .from('users')
  .select('last_active_at')
  .eq('id', userId)
  .single();

await trackActivity(userId, 'login', {});

const userAfter = await supabase
  .from('users')
  .select('last_active_at')
  .eq('id', userId)
  .single();

// Expected: userAfter.last_active_at > userBefore.last_active_at
// Expected: Only 1 query in trackActivity (INSERT), no manual UPDATE
```

#### 9. Timeline Error Handling
**Test:** Database error surfaces to API
```typescript
// Temporarily break database connection or query
// (Could mock supabase client to return error)

const response = await fetch('/api/admin/users/USER_ID/timeline');
// Expected: 500 status code, not 200 with empty array
```

#### 10. UI Component Tests

**Test:** Table row keyboard navigation
```
1. Load /admin/users page
2. Tab to focus on user row
3. Press Enter key
Expected: Navigates to user detail page
```

**Test:** Logger instead of console
```
1. Open browser DevTools console
2. Trigger stats refresh error (disconnect network)
3. Check console output
Expected: No console.error calls, structured logger output
```

**Test:** Table semantics
```
1. Load /admin/users page
2. Inspect table HTML
Expected: Proper <tr> and <td> elements, not <button> with grid
```

### Performance Testing

#### 11. RPC Pagination Performance
**Test:** Load user list with pagination
```typescript
console.time('user-list-page1');
await fetch('/api/admin/users?limit=20');
console.timeEnd('user-list-page1');

console.time('user-list-page2');
await fetch('/api/admin/users?limit=20&cursor=CURSOR');
console.timeEnd('user-list-page2');

// Expected: Both < 500ms for reasonable dataset
```

### Regression Testing

#### 12. Existing Functionality
- [ ] Admin dashboard loads without errors
- [ ] User list displays correctly
- [ ] User detail page works
- [ ] Timeline loads and paginates
- [ ] Stats refresh button works
- [ ] Filtering users works
- [ ] Sorting users works

## Completion Criteria

All checkboxes must be ✓ before deployment:

### Build Quality
- [ ] `bun run tsc` passes with zero errors
- [ ] `bun run lint` passes with zero errors in modified files
- [ ] No TypeScript `any` types remain
- [ ] No `console.log/console.error` in modified files

### Security
- [ ] Non-admin users cannot call RPC
- [ ] Non-admin users cannot insert activity for others
- [ ] Malformed cursors don't cause errors or injection
- [ ] All RLS policies tested and working

### Functionality
- [ ] Timeline pagination works correctly
- [ ] Active users count is accurate (distinct users)
- [ ] User activity tracking updates last_active_at
- [ ] Timeline errors return 500 (not empty)
- [ ] Table rows use proper semantic HTML
- [ ] Keyboard navigation works

### Performance
- [ ] No redundant database queries (removed manual update)
- [ ] Pagination performs reasonably (<500ms)

## Rollback Plan

If critical issues found after deployment:

1. **RPC authorization issue:**
   - Temporarily disable RPC, use client-side filtering
   - Or: Add emergency bypass for specific admin user

2. **RLS policy too restrictive:**
   - Revert to permissive policy temporarily
   - Fix and redeploy proper policy

3. **Migration breaks existing data:**
   - Have SQL ready to rollback migrations
   - Backup database before applying

## Migration Strategy Decision

Before executing tasks 01-07, determine:

- [ ] Have migrations 20251215000003 and 20251215000007 been applied to production?
  - **If NO:** Edit existing migrations directly
  - **If YES:** Create new migrations (20251215000008, 20251215000009)

Document decision here: ________________

## Notes

Record any issues encountered during testing:

---

**Test Date:** _______________
**Tester:** _______________
**Environment:** ☐ Local ☐ Staging ☐ Production
**All tests passed:** ☐ Yes ☐ No (see notes above)
