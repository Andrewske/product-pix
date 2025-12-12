-- Create image refund requests table
-- Tracks user requests for credit refunds on individual generated images

CREATE TABLE public.image_refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.generated_images(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status refund_status NOT NULL DEFAULT 'pending_auto',
  reason refund_reason NOT NULL,
  feedback TEXT,
  credits_refunded INTEGER NOT NULL,
  reviewed_by UUID REFERENCES public.users(id),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT unique_image_refund UNIQUE(image_id)
);

CREATE INDEX idx_refund_requests_user_id
  ON public.image_refund_requests(user_id);
CREATE INDEX idx_refund_requests_status
  ON public.image_refund_requests(status);
CREATE INDEX idx_refund_requests_pending_admin
  ON public.image_refund_requests(requested_at DESC)
  WHERE status = 'pending_admin';

ALTER TABLE public.image_refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own refund requests"
  ON public.image_refund_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own refund requests"
  ON public.image_refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);