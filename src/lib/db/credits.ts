// src/lib/db/credits.ts
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreditOperationResult, CreditTransaction, TransactionType } from '@/types';

export const addCredits = async (
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  referenceId?: string,
  idempotencyKey?: string
): Promise<CreditOperationResult & { transactionId?: string }> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_reference_id: referenceId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error('Error adding credits:', error);
    return { success: false, new_balance: 0 };
  }

  const result = data[0];
  return {
    success: result.success,
    new_balance: result.new_balance,
    transactionId: result.transaction_id,
  };
};

export const consumeCredits = async (
  userId: string,
  amount: number,
  jobId: string,
  description?: string
): Promise<CreditOperationResult> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('consume_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_job_id: jobId,
    p_description: description ?? 'Image generation',
  });

  if (error) {
    console.error('Error consuming credits:', error);
    return { success: false, new_balance: 0 };
  }

  const result = data[0];
  return {
    success: result.success,
    new_balance: result.new_balance,
  };
};

export const refundCredits = async (
  userId: string,
  amount: number,
  jobId: string,
  description?: string
): Promise<CreditOperationResult> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('refund_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_job_id: jobId,
    p_description: description ?? 'Refund for failed generation',
  });

  if (error) {
    console.error('Error refunding credits:', error);
    return { success: false, new_balance: 0 };
  }

  const result = data[0];
  return {
    success: result.success,
    new_balance: result.new_balance,
  };
};

export const getCreditHistory = async (
  userId: string,
  limit = 50
): Promise<CreditTransaction[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }

  return data;
};