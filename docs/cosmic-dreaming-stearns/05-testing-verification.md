# Testing and Verification

## Scope
Comprehensive testing to verify auth migration is complete and correct.

## Implementation Details

### 5.1: Unit Test Suite

```bash
# All tests
bun test

# Auth-specific tests
bun test src/lib/auth/

# API routes (withAuth unchanged)
bun test src/app/api/
```

**Expected:** All tests pass, no regressions.

---

### 5.2: Manual Auth Flow Testing

#### Unauthenticated Access (in incognito/logged out)

| Route | Expected Behavior |
|-------|------------------|
| `/generate` | Redirect to `/login?redirect=%2Fgenerate` |
| `/batch/new` | Redirect to `/login?redirect=%2Fbatch%2Fnew` |
| `/dashboard` | Redirect to `/login` |
| `/settings` | Redirect to `/login` |
| `/batch` | Redirect to `/login` |

#### Authenticated Access (logged in)

| Route | Expected Behavior |
|-------|------------------|
| `/generate` | Page loads, credit display shows balance |
| `/batch/new` | CSV upload form displays |
| `/dashboard` | User's images and batches display |
| `/settings` | Settings tabs render |
| `/batch` | User's batch list displays |

#### Ownership Checks

1. Login as User A
2. Create a batch, note the batch ID
3. Login as User B
4. Visit User A's batch URL (`/batch/{id}`)
5. **Expected:** Redirect to `/batch` (not allowed to view)

#### Admin Routes (unchanged behavior)

1. Login as non-admin user
2. Visit `/admin/refunds`
3. **Expected:** Redirect to `/`

---

### 5.3: Integration Testing

#### Generation Flow
1. Login
2. Navigate to `/generate`
3. Upload image
4. Select template
5. Click Generate
6. **Expected:** Image generates, credits deducted, result displays

#### Batch Flow
1. Login
2. Navigate to `/batch/new`
3. Upload CSV
4. Review preview
5. Create batch
6. **Expected:** Redirect to batch detail, processing starts

#### API Protection
Test that API routes still require auth:

```bash
# Should return 401
curl -X POST http://localhost:3000/api/generate
curl -X POST http://localhost:3000/api/batch
curl -X POST http://localhost:3000/api/upload/presign
```

---

### 5.4: Browser Console Check

1. Navigate through all protected pages
2. Open browser DevTools console
3. **Expected:** No auth-related errors, no 401s in network tab

## Acceptance Criteria (Final)
- [ ] All unit tests pass
- [ ] All 5 protected routes redirect unauthenticated users
- [ ] All 5 protected routes load for authenticated users
- [ ] Ownership check works on batch detail page
- [ ] Admin routes still protected
- [ ] Generation flow works end-to-end
- [ ] Batch creation flow works end-to-end
- [ ] API routes return 401 for unauthenticated requests
- [ ] No console errors
- [ ] `useCredits()` hook shows real-time balance

## Dependencies
- All previous tasks (01-04) must be complete

## Success Criteria Summary

When all tests pass:
- All 6 pages call `requireAuth()` or use server wrapper
- Both proxy files deleted
- Orphaned test deleted
- All tests pass
- TypeScript compiles
- Auth flows work correctly
