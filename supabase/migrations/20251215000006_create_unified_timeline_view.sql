-- Drop existing view if recreating
DROP VIEW IF EXISTS public.user_timeline_view;

-- Unified timeline view (UNION ALL of 8 tables)
CREATE VIEW public.user_timeline_view AS
  -- Jobs
  SELECT
    id,
    user_id,
    'job'::text AS type,
    status::text AS subtype,
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
    transaction_type::text AS subtype,
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
    feedback_type::text AS subtype,
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