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