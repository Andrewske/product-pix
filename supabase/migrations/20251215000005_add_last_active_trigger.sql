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