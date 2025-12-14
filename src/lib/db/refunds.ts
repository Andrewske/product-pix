// src/lib/db/refunds.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { softDeleteImage } from './generated-images';
import { createCreditError, createValidationError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';
import type { RefundReason, RefundStatus, ImageRefundRequest, EligiblePurchase } from '@/types';

type PurchaseWithLedger = {
  id: string;
  created_at: string | null;
  amount_cents: number;
  credits_granted: number;
  purchase_credit_ledger: Array<{
    credits_consumed: number;
    credits_refunded_image: number;
    credits_refunded_cash: number;
  }>;
};

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
    const refundError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to create image refund request',
      {
        severity: 'high',
        amount: params.creditsRefunded,
        operation: 'refund',
        originalError: error.message,
        userId: params.userId,
      }
    );
    await captureError(refundError);
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
    const refundError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to get user refund count',
      {
        severity: 'medium',
        amount: 0,
        operation: 'refund',
        originalError: error.message,
        userId,
      }
    );
    await captureError(refundError);
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
    const refundError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to fetch refund request for approval',
      {
        severity: 'high',
        amount: 0,
        operation: 'refund',
        originalError: fetchError?.message,
      }
    );
    await captureError(refundError);
    return false;
  }

  if (refundRequest.status !== 'pending_admin') {
    const validationError = createValidationError(
      'Refund request is not pending admin approval',
      {
        severity: 'medium',
        field: 'status',
        validationRule: `Expected 'pending_admin', got '${refundRequest.status}'`,
        userId: refundRequest.user_id,
      }
    );
    await captureError(validationError);
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
    const creditError = createCreditError(
      ErrorCodes.CREDIT_REFUND_FAILED,
      'Failed to refund credits for approved image refund',
      {
        severity: 'critical',
        amount: refundRequest.credits_refunded,
        operation: 'refund',
        originalError: refundError?.message,
        userId: refundRequest.user_id,
      }
    );
    await captureError(creditError);
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
    const statusUpdateError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to update refund request status after credit refund',
      {
        severity: 'critical',
        amount: refundRequest.credits_refunded,
        operation: 'refund',
        originalError: updateError.message,
        userId: refundRequest.user_id,
      }
    );
    await captureError(statusUpdateError);
    return false;
  }

  // Soft delete the image
  const deleteSuccess = await softDeleteImage(refundRequest.image_id, refundRequest.user_id);
  if (!deleteSuccess) {
    const deleteError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to soft delete image after credit refund',
      {
        severity: 'critical',
        amount: refundRequest.credits_refunded,
        operation: 'refund',
        userId: refundRequest.user_id,
      }
    );
    await captureError(deleteError);
    return false;
  }

  return true;
};

export const getPendingAdminRefunds = async (): Promise<ImageRefundRequest[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('image_refund_requests')
    .select(`
      id,
      reason,
      feedback,
      requested_at,
      credits_refunded,
      user_id,
      image_id,
      job_id,
      status,
      users!inner(email, display_name),
      generated_images!inner(public_url)
    `)
    .eq('status', 'pending_admin')
    // FIFO ordering (oldest first) - ensures fair processing
    // of refund requests in the order they were submitted
    .order('requested_at', { ascending: true });

  if (error) {
    const fetchError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to fetch pending admin refunds',
      {
        severity: 'medium',
        amount: 0,
        operation: 'refund',
        originalError: error.message,
      }
    );
    await captureError(fetchError);
    return [];
  }

  return data;
};

export async function approveRefund(
  refundId: string,
  adminId: string,
  _notes?: string
): Promise<boolean> {
  // Notes parameter reserved for future audit trail
  // For now, just call the existing approve function
  return await approveImageRefund(refundId, adminId);
}

export const approveCashRefund = async (
  refundId: string,
  adminId: string
): Promise<boolean> => {
  const supabase = createAdminClient();

  // First get the refund request details
  const { data: refundRequest, error: fetchError } = await supabase
    .from('cash_refund_requests')
    .select('user_id, refund_amount_cents, status')
    .eq('id', refundId)
    .single();

  if (fetchError || !refundRequest) {
    const cashRefundFetchError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to fetch cash refund request for approval',
      {
        severity: 'critical',
        amount: 0,
        operation: 'refund',
        originalError: fetchError?.message,
      }
    );
    await captureError(cashRefundFetchError);
    return false;
  }

  if (refundRequest.status !== 'processing') {
    const statusValidationError = createValidationError(
      'Cash refund request is not in processing status',
      {
        severity: 'high',
        field: 'status',
        validationRule: `Expected 'processing', got '${refundRequest.status}'`,
        userId: refundRequest.user_id,
      }
    );
    await captureError(statusValidationError);
    return false;
  }

  // Update the refund request status to completed (refund already processed)
  const { error: updateError } = await supabase
    .from('cash_refund_requests')
    .update({
      status: 'completed',
      reviewed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq('id', refundId);

  if (updateError) {
    const cashRefundApprovalError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to approve cash refund request',
      {
        severity: 'critical',
        amount: refundRequest.refund_amount_cents,
        operation: 'refund',
        originalError: updateError.message,
        userId: refundRequest.user_id,
      }
    );
    await captureError(cashRefundApprovalError);
    return false;
  }

  return true;
};

export async function getEligibleCashRefunds(userId: string): Promise<EligiblePurchase[]> {
  const supabase = await createClient();

  // Get purchases within 30 days with unused credits
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('stripe_purchases')
    .select(`
      id,
      created_at,
      amount_cents,
      credits_granted,
      purchase_credit_ledger!inner(
        credits_consumed,
        credits_refunded_image,
        credits_refunded_cash
      )
    `)
    .eq('user_id', userId)
    .eq('purchase_type', 'pack')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    const eligibleRefundsError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to fetch eligible cash refunds',
      {
        severity: 'high',
        amount: 0,
        operation: 'refund',
        originalError: error.message,
        userId,
      }
    );
    await captureError(eligibleRefundsError);
    throw new Error('Failed to fetch eligible cash refunds');
  }

  // Filter out purchases that already have cash refund requests
  const purchaseIds = data.map(p => p.id);
  const { data: refundRequests, error: refundError } = await supabase
    .from('cash_refund_requests')
    .select('stripe_purchase_id')
    .in('stripe_purchase_id', purchaseIds);

  if (refundError) {
    const refundRequestsError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to fetch existing refund requests for eligibility check',
      {
        severity: 'high',
        amount: 0,
        operation: 'refund',
        originalError: refundError.message,
        userId,
      }
    );
    await captureError(refundRequestsError);
    throw new Error('Failed to fetch refund requests');
  }

  const refundedPurchaseIds = new Set(refundRequests.map(r => r.stripe_purchase_id));

  return (data as PurchaseWithLedger[])
    .filter((purchase) => !refundedPurchaseIds.has(purchase.id))
    .map((purchase) => {
      const ledger = purchase.purchase_credit_ledger[0];
      const creditsUnused = purchase.credits_granted - ledger.credits_consumed - ledger.credits_refunded_image - ledger.credits_refunded_cash;

      if (creditsUnused <= 0) return null;

      const refundAmount100Cents = Math.round((creditsUnused / purchase.credits_granted) * purchase.amount_cents);
      const refundAmount90Cents = Math.round(refundAmount100Cents * 0.9);

      return {
        purchaseId: purchase.id,
        date: purchase.created_at,
        amountCents: purchase.amount_cents,
        creditsGranted: purchase.credits_granted,
        creditsUnused,
        refundAmount100Cents,
        refundAmount90Cents,
      };
    })
    .filter(Boolean) as EligiblePurchase[];
}

export async function createCashRefundRequest(params: {
  userId: string;
  purchaseId: string;
  creditsRefunded: number;
  refundAmountCents: number;
  refundPercentage: 90 | 100;
  stripeRefundId: string;
}): Promise<{ id: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('cash_refund_requests')
    .insert({
      user_id: params.userId,
      stripe_purchase_id: params.purchaseId,
      credits_refunded: params.creditsRefunded,
      refund_amount_cents: params.refundAmountCents,
      refund_percentage: params.refundPercentage,
      stripe_refund_id: params.stripeRefundId,
      status: 'processing',
    })
    .select('id')
    .single();

  if (error) {
    const cashRefundCreateError = createCreditError(
      ErrorCodes.SYSTEM_ERROR,
      'Failed to create cash refund request',
      {
        severity: 'critical',
        amount: params.refundAmountCents,
        operation: 'refund',
        originalError: error.message,
        userId: params.userId,
      }
    );
    await captureError(cashRefundCreateError);
    throw new Error('Failed to create cash refund request');
  }

  return data;
}