// src/lib/db/refunds.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { softDeleteImage } from './generated-images';
import type { RefundReason, RefundStatus, ImageRefundRequest } from '@/types';

export interface CreateImageRefundRequestParams {
  userId: string;
  imageId: string;
  jobId: string;
  reason: RefundReason;
  feedback?: string;
  creditsRefunded: number;
}

export const createImageRefundRequest = async (
  params: CreateImageRefundRequestParams
): Promise<{ id: string; status: RefundStatus }> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('image_refund_requests')
    .insert({
      user_id: params.userId,
      image_id: params.imageId,
      job_id: params.jobId,
      reason: params.reason,
      feedback: params.feedback,
      credits_refunded: params.creditsRefunded,
    })
    .select('id, status')
    .single();

  if (error) {
    console.error('Error creating refund request:', error);
    throw new Error('Failed to create refund request');
  }

  return data;
};

export const getUserRefundCount = async (userId: string): Promise<number> => {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('image_refund_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (error) {
    console.error('Error getting user refund count:', error);
    return 0;
  }

  return count || 0;
};

export const approveImageRefund = async (
  refundId: string,
  adminId: string
): Promise<boolean> => {
  const supabase = createAdminClient();

  // First get the refund request details
  const { data: refundRequest, error: fetchError } = await supabase
    .from('image_refund_requests')
    .select('user_id, image_id, credits_refunded, status')
    .eq('id', refundId)
    .single();

  if (fetchError || !refundRequest) {
    console.error('Error fetching refund request:', fetchError);
    return false;
  }

  if (refundRequest.status !== 'pending_admin') {
    console.error('Refund request is not pending admin approval');
    return false;
  }

  // Call the RPC to refund credits
  const { data: refundResult, error: refundError } = await supabase.rpc(
    'refund_credits_for_image',
    {
      p_user_id: refundRequest.user_id,
      p_amount: refundRequest.credits_refunded,
      p_image_id: refundRequest.image_id,
      p_refund_request_id: refundId,
      p_description: 'Admin approved image refund',
    }
  );

  if (refundError || !refundResult?.[0]?.success) {
    console.error('Error refunding credits:', refundError);
    return false;
  }

  // Update the refund request status
  const { error: updateError } = await supabase
    .from('image_refund_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq('id', refundId);

  if (updateError) {
    console.error('Error updating refund request:', updateError);
    return false;
  }

  // Soft delete the image
  const deleteSuccess = await softDeleteImage(refundRequest.image_id, refundRequest.user_id);
  if (!deleteSuccess) {
    console.error('Error soft deleting image');
    return false;
  }

  return true;
};

export const getPendingAdminRefunds = async (): Promise<ImageRefundRequest[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('image_refund_requests')
    .select(`
      *,
      users!inner(email, display_name),
      generated_images(public_url, title)
    `)
    .eq('status', 'pending_admin')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending admin refunds:', error);
    return [];
  }

  return data;
};