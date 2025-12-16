# Database Security Migrations

## Priority
**CRITICAL** - Security vulnerabilities must be fixed before production

## Files to Modify
- `supabase/migrations/20251215000003_add_user_activity_rls.sql` (modify)
- `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql` (modify)

## Implementation Details

### Task 1.1: Add Admin Authorization Check to RPC Function

**File:** `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql`

**Issue:** The function has `SECURITY DEFINER` (runs with elevated privileges) but no authorization check. Anyone who can call this RPC can bypass RLS and see all users.

**Fix:** Add authorization check at the beginning of the function body (after DECLARE, before v_sql assignment around line 33):

```sql
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  v_sql := '
    WITH user_stats AS (
      ...
```

### Task 1.2: Restrict user_activity INSERT Policy

**File:** `supabase/migrations/20251215000003_add_user_activity_rls.sql`

**Issue:** Current INSERT policy has `WITH CHECK (true)` which allows any insert for any user_id. This is a security vulnerability.

**Fix:** Replace the permissive INSERT policy (lines 14-17) with:

```sql
-- Admin-only INSERT policy (for activity tracking via service role)
CREATE POLICY "Users and admins can insert their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## Acceptance Criteria
- [ ] Non-admin user calling `get_filtered_user_list` RPC receives "Unauthorized" error
- [ ] Admin user can successfully call `get_filtered_user_list` RPC
- [ ] Non-admin user cannot insert activity for other users
- [ ] Admin user can insert activity for any user
- [ ] Service role can still insert activity (bypasses RLS)

## Testing Steps
1. Apply migrations: `npx supabase db reset`
2. Create test non-admin user
3. Attempt to call RPC as non-admin → should fail with "Unauthorized"
4. Call RPC as admin → should succeed
5. Attempt to insert activity with different user_id as non-admin → should fail
6. Insert activity with own user_id → should succeed

## Dependencies
None - this is a foundational security fix

## Migration Strategy Note
If migrations 20251215000003 and 20251215000007 have already been applied to production:
- Create new migrations: `20251215000008_fix_user_activity_rls.sql` and `20251215000009_fix_get_filtered_user_list_rpc.sql`
- Use `DROP POLICY` and `CREATE POLICY` for RLS fix
- Use `CREATE OR REPLACE FUNCTION` for RPC fix (this is already in the migration)
