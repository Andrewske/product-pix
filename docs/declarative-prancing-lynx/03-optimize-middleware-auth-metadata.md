# Optimize Middleware with Auth Metadata

## Priority
**HIGH** - Performance optimization (10-50ms latency per request)

## Files to Modify
- `middleware.ts` (modify lines 34-46)
- User deletion handler (TBD - to be created or found)

## Implementation Details

### Part 1: Update Middleware

**Issue:** Database query on every request for authenticated users adds 10-50ms latency. Middleware runs on nearly all routes.

**Current Code (lines 34-46):**
```typescript
// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // Check if user is deleted
  const { data: userData } = await supabase
    .from('users')
    .select('deleted_at')
    .eq('id', user.id)
    .single();

  if (userData?.deleted_at && !request.nextUrl.pathname.startsWith('/account-deleted')) {
    // Redirect to account deleted page
    return NextResponse.redirect(new URL('/account-deleted', request.url));
  }
}
```

**Fixed Code:**
```typescript
// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();

if (user?.user_metadata?.deleted_at && !request.nextUrl.pathname.startsWith('/account-deleted')) {
  // Redirect to account deleted page
  return NextResponse.redirect(new URL('/account-deleted', request.url));
}
```

### Part 2: Update User Deletion Handler

**Note:** User deletion functionality does not appear to be implemented yet. The `deleted_at` field was added in migration 20251215223948 but no deletion endpoint exists.

**When implementing user deletion**, ensure both updates happen:

```typescript
// In user deletion handler (location TBD)
import { createAdminClient } from '@/lib/supabase/admin';

const supabase = createAdminClient();
const now = new Date().toISOString();

// 1. Update users table
await supabase.from('users').update({ deleted_at: now }).eq('id', userId);

// 2. Update auth metadata so middleware can check without DB query
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: { deleted_at: now }
});
```

**If deletion is already implemented elsewhere:** Find the handler and add auth metadata update.

**Reasoning:**
- Eliminates database roundtrip on every authenticated request
- Significant performance win (middleware runs on ~all routes)
- Auth metadata is already in JWT, no extra fetch needed

## Acceptance Criteria
- [ ] Middleware simplified to check `user.user_metadata.deleted_at`
- [ ] Database query removed from middleware
- [ ] User deletion flow (when implemented) updates both DB and auth metadata
- [ ] Test: Create deleted user → verify middleware redirect works
- [ ] Performance: Measure request latency improvement (~10-50ms reduction)

## Dependencies
None - can be implemented independently

## Notes
- User deletion endpoint needs to be created or located
- Consider documenting auth metadata pattern for future features
