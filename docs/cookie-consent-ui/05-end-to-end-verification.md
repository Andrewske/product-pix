# End-to-End Verification

## Files to Modify/Create
- None (manual testing only)

## Implementation Details

Complete end-to-end testing of the entire cookie consent flow.

### Test Scenarios

**Scenario 1: Anonymous user - Accept All**
1. Open incognito/private browser window
2. Navigate to any page (e.g., homepage)
3. Verify banner appears in bottom-right corner
4. Click "Accept All"
5. Verify banner disappears immediately
6. Open DevTools > Application > Local Storage
7. Verify `cookie-consent` key exists with `analytics: true, marketing: true`
8. Refresh page - verify banner does NOT reappear

**Scenario 2: Anonymous user - Reject All**
1. Clear localStorage or open new incognito window
2. Navigate to any page
3. Verify banner appears
4. Click "Reject All"
5. Verify banner disappears
6. Check localStorage - verify `analytics: false, marketing: false`
7. Refresh page - verify banner does NOT reappear

**Scenario 3: Logged-in user - Banner flow**
1. Log in to application
2. Clear localStorage `cookie-consent` key
3. Refresh page
4. Verify banner appears
5. Click "Accept All"
6. Verify consent synced to database (check Supabase dashboard or use query)
7. Log out and log back in - verify consent persists from database

**Scenario 4: Settings - Granular control**
1. Log in (or use anonymous session)
2. Navigate to `/settings?tab=privacy`
3. Verify Privacy tab is visible and selected
4. Verify current consent state reflected in toggles
5. Toggle Analytics OFF
6. Verify localStorage updated immediately
7. Toggle Marketing ON
8. Verify localStorage updated
9. Refresh page - verify toggles maintain state

**Scenario 5: Cross-session persistence (logged-in)**
1. Log in on Device A
2. Accept All cookies
3. Log in on Device B (same account)
4. Go to Settings > Privacy
5. Verify consent state matches Device A (synced from database)

**Scenario 6: Analytics script behavior**
1. Open DevTools > Network tab
2. Clear localStorage, refresh page
3. Verify PostHog scripts NOT loaded (no consent)
4. Accept All cookies
5. Refresh page
6. Verify PostHog scripts ARE loaded

### Regression Checks

- [ ] No console errors on any page
- [ ] No hydration mismatches (SSR/client mismatch)
- [ ] Banner z-index doesn't conflict with other UI elements
- [ ] Settings tabs still work (Account, Billing, Credits)
- [ ] Mobile navigation doesn't cover banner
- [ ] Banner doesn't block critical UI on mobile

## Acceptance Criteria
- [ ] All 6 test scenarios pass
- [ ] All regression checks pass
- [ ] No console errors or warnings
- [ ] localStorage and database sync works correctly
- [ ] Analytics scripts respect consent state

## Dependencies
- Tasks 01-04 must be complete

## Sign-off Checklist

Before marking feature complete:
- [ ] All unit tests pass (`bun test`)
- [ ] All E2E scenarios pass (manual)
- [ ] Code reviewed
- [ ] No TypeScript errors (`bun run typecheck`)
- [ ] No lint errors (`bun run lint`)
- [ ] Tested on mobile viewport
- [ ] Tested in dark mode
- [ ] PR created with summary of changes
