# Account Restoration Runbook

## Overview
Admins can restore deleted accounts within 30 days of deletion.

## Important Limitations

### R2 Files Are NOT Restored
When an account is deleted, R2 files are moved to `deleted/{userId}/` prefix.
These files are subject to lifecycle rules and will be permanently deleted after 30 days.

**Account restoration does NOT:**
- Move files back from `deleted/` prefix
- Stop the lifecycle deletion timer

**What this means for users:**
- If restored within 30 days, images in the database reference files that may soon be deleted
- Users should be informed that some images may become unavailable
- Consider offering a credit refund for images lost due to restoration timing

## Restoration Process
1. Admin clicks "Restore" on user management page (`/admin/users`)
2. System validates:
   - User exists and is deleted
   - Within 30-day window
   - Original email not taken by another account
3. If valid:
   - User email restored from `original_email`
   - `deleted_at` cleared on user, uploads, and images
4. User can sign in again with original credentials

## Admin UI Location
- Navigate to `/admin/users`
- Find deleted user (has "Deleted" badge)
- Click "Restore (Xd left)" button
- Confirm in dialog

## Checking Affected Files Before Restoration

Before restoring an account, admins can check which R2 files will be affected:

```sql
-- Check images that will be impacted by R2 lifecycle rules
SELECT
  gi.id,
  gi.prompt,
  gi.created_at,
  gi.r2_key,
  CASE
    WHEN gi.created_at < NOW() - INTERVAL '30 days' THEN 'Already deleted by lifecycle'
    WHEN gi.created_at < NOW() - INTERVAL '25 days' THEN 'Will be deleted within 5 days'
    ELSE 'Safe until lifecycle cleanup'
  END as r2_status
FROM generated_images gi
WHERE gi.user_id = 'user-id-here'
  AND gi.deleted_at IS NOT NULL
ORDER BY gi.created_at DESC;

-- Count total affected images
SELECT COUNT(*) as affected_images
FROM generated_images
WHERE user_id = 'user-id-here'
  AND deleted_at IS NOT NULL;
```

## Contact Template
When restoring an account, send this to the user:

> Subject: Your ProductPix Account Has Been Restored
>
> Hi [Name],
>
> Your ProductPix account has been restored as requested.
>
> Please note that some images generated before deletion may no longer be
> accessible due to our data retention policies. Your credits have been
> preserved.
>
> If you have any questions, please reply to this email.
>
> Best,
> The ProductPix Team

## Troubleshooting

### "Deletion period expired (>30 days)"
Account cannot be restored after 30 days. User must create a new account.

### "Original email is now used by another account"
Another user registered with that email during the deletion period.
Options:
1. Ask new user to change their email
2. Inform deleted user they must use a different email
3. Manual database intervention (last resort)

### User reports missing images after restoration
Expected behavior due to R2 lifecycle rules. Offer credit refund for affected images.

## Related Documentation
- [CCPA Data Export Runbook](./ccpa-data-export.md)
- [Legal Policy Decisions](../reference/legal-policy-decisions.md)