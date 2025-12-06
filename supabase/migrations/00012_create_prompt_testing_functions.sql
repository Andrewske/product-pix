-- Migration: Create helper functions for prompt testing
-- Provides atomic operations for status updates

-- Atomic status update to prevent race conditions
CREATE OR REPLACE FUNCTION update_prompt_test_status(
  p_test_id UUID,
  p_new_status prompt_test_status,
  p_error_message TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE prompt_tests
  SET
    status = p_new_status,
    error_message = COALESCE(p_error_message, error_message),
    error_code = COALESCE(p_error_code, error_code),
    completed_at = CASE
      WHEN p_new_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION update_prompt_test_status(UUID, prompt_test_status, TEXT, TEXT) TO service_role;

-- Function to get batch statistics
CREATE OR REPLACE FUNCTION get_batch_stats(p_batch_label TEXT)
RETURNS TABLE (
  total_tests INTEGER,
  completed_tests INTEGER,
  failed_tests INTEGER,
  avg_score DECIMAL(3,1),
  min_score DECIMAL(3,1),
  max_score DECIMAL(3,1),
  total_cost DECIMAL(10,5)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_tests,
    COUNT(*) FILTER (WHERE pt.status = 'completed')::INTEGER as completed_tests,
    COUNT(*) FILTER (WHERE pt.status = 'failed')::INTEGER as failed_tests,
    ROUND(AVG(pe.score_overall), 1) as avg_score,
    MIN(pe.score_overall) as min_score,
    MAX(pe.score_overall) as max_score,
    SUM(COALESCE(pt.cost_usd, 0) + COALESCE(pe.cost_usd, 0)) as total_cost
  FROM prompt_tests pt
  LEFT JOIN prompt_evaluations pe ON pe.test_id = pt.id
  WHERE pt.batch_label = p_batch_label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_batch_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_stats(TEXT) TO service_role;