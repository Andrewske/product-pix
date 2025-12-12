# Create Shared Admin Utilities (DRY Refactor)

## Overview
Extract duplicated admin verification logic into a shared utility function. Currently, the same admin check pattern is repeated in 4 different files, violating DRY principle.

## Architecture Decisions
- **Single Source of Truth**: One `requireAdmin()` function for all admin checks
- **Consistent Behavior**: Same error handling across all admin-protected routes
- **Future Extensibility**: Easy to add audit logging, caching, or rate limiting later
- **Location**: `@/lib/auth/admin.ts` for clear organizational structure

## Implementation Tasks

### Phase 1: Create Admin Utility
- [ ] Create requireAdmin utility function
  - Files: `src/lib/auth/admin.ts` (new)
  - Implementation:
    ```typescript
    import { createClient } from '@/lib/supabase/server';

    /**
     * Verify if a user has admin privileges
     * @param userId - The user ID to check
     * @returns Promise<boolean> - True if user is admin, false otherwise
     */
    export async function requireAdmin(userId: string): Promise<boolean> {
      const supabase = await createClient();

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      return !error && userProfile?.is_admin === true;
    }

    /**
     * Get admin status with detailed error information
     * @param userId - The user ID to check
     * @returns Promise with success flag and optional error
     */
    export async function getAdminStatus(
      userId: string
    ): Promise<{ isAdmin: boolean; error?: string }> {
      const supabase = await createClient();

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        return { isAdmin: false, error: error.message };
      }

      return { isAdmin: userProfile?.is_admin === true };
    }
    ```
  - Tests: `src/lib/auth/__tests__/admin.test.ts` (new)
  - Acceptance: Functions exported with correct types

- [ ] Create admin utility tests
  - Files: `src/lib/auth/__tests__/admin.test.ts` (new)
  - Tests:
    ```typescript
    import { describe, it, expect, beforeEach, mock } from 'bun:test';
    import { requireAdmin, getAdminStatus } from '../admin';

    // Mock Supabase client
    const mockCreateClient = mock(async () => null);
    mock.module('@/lib/supabase/server', () => ({
      createClient: mockCreateClient,
    }));

    describe('admin utilities', () => {
      let mockSupabaseClient: {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              single: ReturnType<typeof mock<() => Promise<{ data: { is_admin: boolean } | null; error: { message: string } | null }>>>;
            };
          };
        };
      };

      beforeEach(() => {
        const mockSingle = mock(() => Promise.resolve({ data: null, error: null }));
        const mockEq = mock(() => ({ single: mockSingle }));
        const mockSelect = mock(() => ({ eq: mockEq }));

        mockSupabaseClient = {
          from: mock(() => ({ select: mockSelect })),
        };

        mockCreateClient.mockReset();
        mockCreateClient.mockResolvedValue(mockSupabaseClient);
      });

      describe('requireAdmin', () => {
        it('returns true for admin user', async () => {
          const mockSingle = mock(() =>
            Promise.resolve({ data: { is_admin: true }, error: null })
          );
          // ... setup mock chain

          const result = await requireAdmin('user-123');
          expect(result).toBe(true);
        });

        it('returns false for non-admin user', async () => {
          const mockSingle = mock(() =>
            Promise.resolve({ data: { is_admin: false }, error: null })
          );
          // ... setup mock chain

          const result = await requireAdmin('user-123');
          expect(result).toBe(false);
        });

        it('returns false on database error', async () => {
          const mockSingle = mock(() =>
            Promise.resolve({ data: null, error: { message: 'DB error' } })
          );
          // ... setup mock chain

          const result = await requireAdmin('user-123');
          expect(result).toBe(false);
        });
      });

      describe('getAdminStatus', () => {
        it('returns admin status with no error for admin user', async () => {
          // ... similar tests
        });

        it('returns error message on database failure', async () => {
          // ... test error handling
        });
      });
    });
    ```
  - Acceptance: Full coverage of success and error cases

### Phase 2: Update Middleware
- [ ] Replace admin check in middleware
  - Files: `src/middleware.ts` (modify - lines 24-34)
  - Change:
    ```typescript
    import { requireAdmin } from '@/lib/auth/admin';

    // Replace lines 24-34
    const isAdmin = await requireAdmin(user.id);

    if (!isAdmin) {
      // Redirect to home if not admin
      return NextResponse.redirect(new URL('/', request.url));
    }
    ```
  - Tests: `bun test src/__tests__/middleware.test.ts`
  - Acceptance: Middleware still properly blocks non-admin users

### Phase 3: Update Admin Page
- [ ] Replace admin check in refunds page
  - Files: `src/app/admin/refunds/page.tsx` (modify - lines 15-24)
  - Change:
    ```typescript
    import { requireAdmin } from '@/lib/auth/admin';

    // Replace lines 15-24
    const isAdmin = await requireAdmin(user.id);

    if (!isAdmin) {
      redirect('/');
    }
    ```
  - Tests: Manual verification - navigate to /admin/refunds
  - Acceptance: Non-admin users redirected to home

### Phase 4: Update API Routes
- [ ] Replace admin check in GET /api/refunds/image
  - Files: `src/app/api/refunds/image/route.ts` (modify - lines 166-179)
  - Change:
    ```typescript
    import { requireAdmin } from '@/lib/auth/admin';

    // Replace lines 166-179
    const isAdmin = await requireAdmin(request.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    ```
  - Tests: Manual API test or integration test
  - Acceptance: API returns 403 for non-admin users

- [ ] Replace admin check in POST /api/refunds/image/[id]/approve
  - Files: `src/app/api/refunds/image/[id]/approve/route.ts` (modify - lines 18-31)
  - Change:
    ```typescript
    import { requireAdmin } from '@/lib/auth/admin';

    // Replace lines 18-31
    const isAdmin = await requireAdmin(request.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    ```
  - Tests: Manual API test or integration test
  - Acceptance: API returns 403 for non-admin users

## Acceptance Criteria
- [ ] `requireAdmin()` utility created and tested
- [ ] All 4 locations updated to use shared utility
- [ ] No duplicated admin verification logic
- [ ] All tests pass: `bun test`
- [ ] Middleware test still passes
- [ ] API routes properly return 403 for non-admin
- [ ] Admin page redirects non-admin users
- [ ] TypeScript compiles without errors

## Files to Create/Modify

### New Files (2)
- `src/lib/auth/admin.ts` - Shared admin utilities
- `src/lib/auth/__tests__/admin.test.ts` - Admin utility tests

### Modified Files (4)
- `src/middleware.ts` - Use requireAdmin()
- `src/app/admin/refunds/page.tsx` - Use requireAdmin()
- `src/app/api/refunds/image/route.ts` - Use requireAdmin()
- `src/app/api/refunds/image/[id]/approve/route.ts` - Use requireAdmin()

## Dependencies
- None - can be implemented independently

## Testing Strategy
1. **Unit Tests**:
   ```bash
   bun test src/lib/auth/__tests__/admin.test.ts
   ```

2. **Integration Tests**:
   ```bash
   bun test src/__tests__/middleware.test.ts
   ```

3. **Manual API Testing**:
   ```bash
   # As non-admin user
   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/refunds/image
   # Should return 403

   # As admin user
   curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/api/refunds/image
   # Should return pending refunds
   ```

4. **Manual UI Testing**:
   - Log in as non-admin user
   - Navigate to /admin/refunds
   - Should redirect to home

## Notes
- **Future Enhancement**: Add caching to reduce database queries
  ```typescript
  // Example: Cache admin status for 5 minutes
  const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();
  ```
- **Future Enhancement**: Add audit logging
  ```typescript
  // Log all admin access attempts
  logger.info('Admin access check', { userId, isAdmin, timestamp });
  ```
- **Code Reduction**: Removes ~40 lines of duplicated code
- **Maintainability**: Single place to update admin logic
