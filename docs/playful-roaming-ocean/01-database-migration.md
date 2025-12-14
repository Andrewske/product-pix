# Database Migration - User Preferences RPC

## Files to Create
- `supabase/migrations/00035_create_update_user_preferences_rpc.sql` (new)

## Implementation Details

Create PostgreSQL RPC function for atomic JSONB preference updates:

```sql
CREATE OR REPLACE FUNCTION update_user_preferences(
  user_id UUID,
  prefs JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET preferences = COALESCE(preferences, '{}'::jsonb) || prefs
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Rationale

**Critical Fix #2**: Prevents data loss when updating user preferences.

The Postgres `||` operator performs atomic deep merge:
- Preserves existing preference fields (theme, language, etc.)
- Prevents race conditions between concurrent updates
- No read-before-write required (single atomic operation)

**Why not JavaScript merge?**
- JavaScript approach requires read → merge → write (two DB operations)
- Race condition: Two simultaneous updates can overwrite each other
- Network overhead: Two round trips instead of one

## Acceptance Criteria

- [ ] Migration file created in correct sequence (00035)
- [ ] RPC function exists in database after migration
- [ ] Function performs deep merge (existing preferences preserved)
- [ ] Function handles NULL preferences gracefully (`COALESCE`)
- [ ] Run migration: `npx supabase db push`
- [ ] Verify function: `SELECT * FROM pg_proc WHERE proname = 'update_user_preferences';`

## Dependencies

**Prerequisites**: Database schema with `users.preferences` JSONB column (exists)

**Used by**: Phase 3 (Storage Layer) - `saveConsentToDatabase()` function
