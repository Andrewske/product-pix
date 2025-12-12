-- Add admin role to users table and create admin policies for refund tables

ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;

-- Admin policies for refund tables
CREATE POLICY "Admins can view all image refund requests"
  ON public.image_refund_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update image refund requests"
  ON public.image_refund_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can view all cash refund requests"
  ON public.cash_refund_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );