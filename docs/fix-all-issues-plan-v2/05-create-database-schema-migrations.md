# Create Database Schema Migrations

## Files to Create
- supabase/migrations/XXXXXX_add_user_deletion_fields.sql (new)
- supabase/migrations/XXXXXX_add_refunded_at_to_generated_images.sql (new)
- supabase/migrations/XXXXXX_create_account_deletion_audit.sql (new)

## Files to Modify
- src/lib/supabase/database.types.ts (regenerate)

## Implementation Details

After applying existing migrations in Task 01, create additional migrations for remaining schema gaps identified in type errors.

**Known schema gaps from type errors:**
- `users.deleted_at` column (4 errors in src/lib/auth/__tests__/hooks.test.ts)
- `users.original_email` column (1 error in src/lib/r2/cleanup.ts:73)
- `generated_images.refunded_at` column (1 error in src/components/__tests__/image-card.test.tsx:62)
- `account_deletion_audit` table (3 errors in src/lib/r2/cleanup.ts:71)

**Actions:**
1. Create migrations:
   ```bash
   npx supabase migration new add_user_deletion_fields
   npx supabase migration new add_refunded_at_to_generated_images
   npx supabase migration new create_account_deletion_audit
   ```

2. Write SQL for each migration:
   - **add_user_deletion_fields.sql:**
     ```sql
     ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
     ALTER TABLE users ADD COLUMN original_email TEXT;
     ```

   - **add_refunded_at_to_generated_images.sql:**
     ```sql
     ALTER TABLE generated_images ADD COLUMN refunded_at TIMESTAMPTZ;
     ```

   - **create_account_deletion_audit.sql:**
     ```sql
     CREATE TABLE account_deletion_audit (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id),
       email TEXT NOT NULL,
       r2_files_queued INTEGER NOT NULL DEFAULT 0,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     );
     ```

3. Apply locally: `npx supabase db push`
4. Regenerate types: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`
5. **VERIFICATION:** Run `bun run typecheck` - schema-related errors should be reduced

## Acceptance Criteria

- [ ] 3 migration files created with correct SQL
- [ ] Migrations applied locally without errors
- [ ] Types regenerated and include new columns/tables
- [ ] users.deleted_at exists in generated types
- [ ] users.original_email exists in generated types
- [ ] generated_images.refunded_at exists in generated types
- [ ] account_deletion_audit table exists in generated types
- [ ] `bun run typecheck` shows reduced schema-related errors

## Dependencies

- Task 01 (review-existing-migrations) must complete first
- Task 04 (refactor-analytics-architecture) MUST complete and verify first

## Risk

High - Database changes are foundational for type fixes

## Testing

```bash
# Check generated types include new columns/tables
cat src/lib/supabase/database.types.ts | grep -E "deleted_at|original_email|refunded_at|account_deletion_audit"

# Verify type errors reduced
bun run typecheck
```
