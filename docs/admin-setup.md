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