# Admin Setup

## Grant Admin Role

Run this SQL in Supabase SQL Editor:

```sql
UPDATE public.users
SET is_admin = true
WHERE email = 'admin@productpix.ai';
```

## Verify Admin Access

1. Log in as admin@productpix.ai
2. Navigate to /admin/refunds
3. Should see refund approval queue