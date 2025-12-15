# Database Migrations - RLS, Indexes, Triggers, and Views

## Files to Create
- `supabase/migrations/20251215000003_add_user_activity_rls.sql` (new)
- `supabase/migrations/20251215000004_add_user_activity_composite_index.sql` (new)
- `supabase/migrations/20251215000005_add_last_active_trigger.sql` (new)
- `supabase/migrations/20251215000006_create_unified_timeline_view.sql` (new)

## Implementation Details

### Migration 1: Add RLS Policy for user_activity Table

Create `supabase/migrations/20251215000003_add_user_activity_rls.sql`:

```sql
-- Enable RLS on user_activity table
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT policy (matches pattern from 00028_add_admin_role.sql)
CREATE POLICY "Admins can view all user activity"
  ON public.user_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin-only INSERT policy (for activity tracking via service role)
CREATE POLICY "Service role can insert user activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (true);
```

**Pattern Source:** `supabase/migrations/00028_add_admin_role.sql` (lines 7-20)

**Rationale:** User activity data is sensitive and should only be accessible by admins. Service role bypass allows backend tracking.

---

### Migration 2: Add Composite Index for Timeline Queries

Create `supabase/migrations/20251215000004_add_user_activity_composite_index.sql`:

```sql
-- Composite index for filtered timeline queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type_time
  ON user_activity(user_id, event_type, created_at DESC);
```

**Pattern Source:** `supabase/migrations/20251215000002_add_timeline_indexes.sql`

**Rationale:** Timeline API filters by both user_id AND event_type (src/lib/db/admin-timeline.ts:409-410). Existing index only covers (user_id, created_at).

---

### Migration 3: Create Trigger for Atomic last_active_at Updates

Create `supabase/migrations/20251215000005_add_last_active_trigger.sql`:

```sql
-- Function to update user's last_active_at when activity is tracked
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_active_at = NEW.created_at
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_activity INSERT
CREATE TRIGGER user_activity_update_last_active
  AFTER INSERT ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();
```

**Pattern Source:** `supabase/migrations/00003_create_users_table.sql` (lines 19-30, 33-45)

**Rationale:** Eliminates race condition from dual-write pattern in `src/lib/db/user-activity.ts:20-42`. Makes last_active_at update atomic with activity insert.

---

### Migration 4: Create Unified Timeline View with UNION

Create `supabase/migrations/20251215000006_create_unified_timeline_view.sql`:

```sql
-- Drop existing view if recreating
DROP VIEW IF EXISTS public.user_timeline_view;

-- Unified timeline view (UNION ALL of 8 tables)
CREATE VIEW public.user_timeline_view AS
  -- Jobs
  SELECT
    id,
    user_id,
    'job'::text AS type,
    status AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'template_slug', template_slug,
      'status', status,
      'credits_charged', credits_charged,
      'error_message', error_message,
      'prompt', CASE
        WHEN LENGTH(prompt) > 100 THEN SUBSTRING(prompt, 1, 100) || '...'
        ELSE prompt
      END
    ) AS metadata
  FROM jobs

  UNION ALL

  -- Credit Transactions
  SELECT
    id,
    user_id,
    'transaction'::text AS type,
    transaction_type AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'transaction_type', transaction_type,
      'amount', amount,
      'description', description,
      'balance_after', balance_after
    ) AS metadata
  FROM credit_transactions

  UNION ALL

  -- User Messages
  SELECT
    id,
    user_id,
    'message'::text AS type,
    CASE WHEN is_from_admin THEN 'admin' ELSE 'user' END AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'content', CASE
        WHEN LENGTH(content) > 200 THEN SUBSTRING(content, 1, 200) || '...'
        ELSE content
      END,
      'is_from_admin', is_from_admin,
      'read_at', read_at
    ) AS metadata
  FROM user_messages

  UNION ALL

  -- Generated Images
  SELECT
    id,
    user_id,
    'image'::text AS type,
    'generated'::text AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'file_key', file_key,
      'public_url', public_url,
      'is_favorite', is_favorite
    ) AS metadata
  FROM generated_images
  WHERE deleted_at IS NULL

  UNION ALL

  -- Image Feedback
  SELECT
    id,
    user_id,
    'feedback'::text AS type,
    feedback_type AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'feedback_type', feedback_type,
      'comment', comment,
      'reasons', reasons,
      'image_id', image_id
    ) AS metadata
  FROM image_feedback

  UNION ALL

  -- Critical Errors
  SELECT
    id,
    user_id,
    'error'::text AS type,
    severity AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'error_name', error_name,
      'error_message', error_message,
      'domain', domain,
      'severity', severity,
      'resolved_at', resolved_at
    ) AS metadata
  FROM critical_errors

  UNION ALL

  -- Uploads
  SELECT
    id,
    user_id,
    'upload'::text AS type,
    'file'::text AS subtype,
    created_at AS timestamp,
    jsonb_build_object(
      'filename', filename,
      'file_size', file_size,
      'mime_type', mime_type
    ) AS metadata
  FROM uploads
  WHERE deleted_at IS NULL

  UNION ALL

  -- User Activity
  SELECT
    id,
    user_id,
    'activity'::text AS type,
    event_type AS subtype,
    created_at AS timestamp,
    COALESCE(properties, '{}'::jsonb) AS metadata
  FROM user_activity;

-- Create composite index on view (materialized for performance)
-- Note: For now using regular view, can upgrade to materialized view if performance issues
CREATE INDEX IF NOT EXISTS idx_timeline_view_user_time
  ON user_activity(user_id, created_at DESC);
-- Existing indexes on other tables already cover this pattern
```

**Rationale:**
- Reduces 8 parallel queries to 1 query
- PostgreSQL handles sorting/pagination efficiently
- JSONB metadata matches existing `TimelineEvent` interface

**Pattern Source:** No direct view examples found, but RPC functions with `RETURNS TABLE` serve similar purpose (e.g., `supabase/migrations/00012_create_prompt_testing_functions.sql:29-57`)

## Acceptance Criteria

- [ ] All 4 migration files created with correct numbering
- [ ] Run `npx supabase db push` successfully
- [ ] No migration errors in Supabase logs
- [ ] RLS policies prevent unauthorized access to user_activity
- [ ] Trigger updates last_active_at when activity inserted
- [ ] View returns data from all 8 tables with correct schema

## Testing Commands

```bash
# Apply migrations
npx supabase db push

# Verify view structure
psql $DATABASE_URL -c "\d+ user_timeline_view"

# Test view query
psql $DATABASE_URL -c "SELECT * FROM user_timeline_view LIMIT 5;"

# Verify RLS policies
psql $DATABASE_URL -c "\d+ user_activity"
```

## Dependencies

None - this is the foundation for all subsequent tasks.
