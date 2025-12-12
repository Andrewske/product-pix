# Fix Test Console Mocking and Documentation

## Overview
Address minor test quality issues and documentation security concerns identified in code review.

## Architecture Decisions
- **Clean Test Output**: Mock expected errors to prevent console pollution during tests
- **Proper Cleanup**: Restore console methods after tests to prevent test pollution
- **Documentation Security**: Use placeholder emails instead of real admin credentials

## Implementation Tasks

### Phase 1: Fix Middleware Test Console Mocking
- [ ] Add console.error mock to middleware test
  - Files: `src/__tests__/middleware.test.ts` (modify - around line 165)
  - Change:
    ```typescript
    it('should redirect to home when createClient throws', async () => {
      // Mock console.error to suppress expected error output
      const originalConsoleError = console.error;
      const consoleSpy = mock(() => {});
      console.error = consoleSpy;

      mockCreateClient.mockRejectedValue(new Error('Connection failed'));

      const request = new NextRequest('http://localhost/admin/refunds');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Admin middleware error:', expect.any(Error));

      // Restore console.error
      console.error = originalConsoleError;
    });
    ```
  - Tests: `bun test src/__tests__/middleware.test.ts`
  - Acceptance: Test passes without "Admin middleware error" appearing in output

### Phase 2: Fix RefundApprovalQueue Test Console Restoration
- [ ] Fix console.error restoration in error tests
  - Files: `src/components/admin/__tests__/refund-approval-queue.test.tsx` (modify - lines 179, 221)
  - Change:
    ```typescript
    it('shows error toast when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Properly save and restore console.error
      const originalConsoleError = console.error;
      const consoleSpy = mock(() => {});
      console.error = consoleSpy;

      render(<RefundApprovalQueue />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching pending requests:', expect.any(Error));
      });

      // Properly restore
      console.error = originalConsoleError;
    });

    it('shows error toast when approve fails', async () => {
      // ... existing setup ...

      // Properly save and restore console.error
      const originalConsoleError = console.error;
      const consoleSpy = mock(() => {});
      console.error = consoleSpy;

      render(<RefundApprovalQueue />);

      // ... existing test code ...

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error approving refund:', expect.any(Error));
      });

      // Properly restore
      console.error = originalConsoleError;
    });
    ```
  - Tests: `bun test src/components/admin/__tests__/refund-approval-queue.test.tsx`
  - Acceptance: console.error properly restored, no test pollution

### Phase 3: Update Documentation Security
- [ ] Update admin setup documentation
  - Files: `docs/admin-setup.md` (modify - line 10)
  - Change:
    ```markdown
    # Admin Setup

    ## Grant Admin Role

    Run this SQL in Supabase SQL Editor:

    ```sql
    -- Replace 'your-admin@example.com' with the actual admin email
    UPDATE public.users
    SET is_admin = true
    WHERE email = 'your-admin@example.com';
    ```

    **Note**: The user must already exist in the database (created via signup flow).

    ## Create Admin User (if needed)

    If the admin user doesn't exist yet:

    1. Sign up through the normal application flow at `/signup`
    2. Verify the email if required
    3. Then run the SQL above to grant admin privileges

    ## Verify Admin Access

    1. Log in with your admin account
    2. Navigate to /admin/refunds
    3. Should see refund approval queue (not redirected to home)
    ```
  - Tests: None (documentation only)
  - Acceptance: No real email addresses in documentation

### Phase 4: Add Business Logic Documentation
- [ ] Add ordering rationale comment in refunds.ts
  - Files: `src/lib/db/refunds.ts` (modify - line 141)
  - Change:
    ```typescript
    .eq('status', 'pending_admin')
    // FIFO ordering (oldest first) - ensures fair processing
    // of refund requests in the order they were submitted
    .order('requested_at', { ascending: true });
    ```
  - Tests: None (comment only)
  - Acceptance: Business logic rationale documented

## Acceptance Criteria
- [ ] Middleware test runs without printing expected errors
- [ ] RefundApprovalQueue tests properly restore console.error
- [ ] Admin setup docs use placeholder email
- [ ] Admin setup docs explain user creation requirement
- [ ] Refund ordering logic documented
- [ ] All tests pass: `bun test`
- [ ] Test output is clean (no error pollution)

## Files to Create/Modify

### Modified Files (4)
- `src/__tests__/middleware.test.ts` - Fix console.error mocking
- `src/components/admin/__tests__/refund-approval-queue.test.tsx` - Fix console restoration
- `docs/admin-setup.md` - Security and completeness improvements
- `src/lib/db/refunds.ts` - Add business logic comment

## Dependencies
- None - standalone improvements

## Testing Strategy
1. **Test Output Cleanliness**:
   ```bash
   bun test src/__tests__/middleware.test.ts
   ```
   Should NOT see "Admin middleware error" or "Connection failed" in output

2. **Test Isolation**:
   ```bash
   bun test src/components/admin/__tests__/refund-approval-queue.test.tsx
   bun test src/__tests__/middleware.test.ts
   ```
   Run tests multiple times - console should work normally between runs

3. **Full Test Suite**:
   ```bash
   bun test
   ```
   All tests pass, clean output

## Notes
- These are quality-of-life improvements
- Don't affect functionality, only test output and documentation
- Low risk, high value for developer experience
- Console.error restoration prevents bugs in future tests
