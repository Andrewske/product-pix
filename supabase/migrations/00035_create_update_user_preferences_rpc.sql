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