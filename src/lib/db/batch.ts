// src/lib/db/batch.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types';

export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
export type BatchItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BatchJob {
  id: string;
  user_id: string;
  name: string;
  status: BatchJobStatus;
  total_items: number;
  completed_items: number;
  failed_items: number;
  credits_charged: number;
  credits_refunded: number;
  default_prompt: string | null;
  parameters: Json;
  gemini_batch_id: string | null;
  gemini_file_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface BatchItem {
  id: string;
  batch_id: string;
  user_id: string;
  sequence_number: number;
  status: BatchItemStatus;
  product_name: string | null;
  prompt: string;
  source_image_url: string | null;
  parameters: Json;
  generated_image_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateBatchJobParams {
  userId: string;
  name: string;
  totalItems: number;
  creditsToCharge: number;
  defaultPrompt?: string | null;
  parameters?: Json;
}

export interface GetUserBatchesOptions {
  status?: BatchJobStatus;
  limit?: number;
  offset?: number;
}

export interface UpdateBatchItemData {
  status?: BatchItemStatus;
  generated_image_id?: string | null;
  error_message?: string | null;
}

/**
 * Create a batch job with atomic credit consumption
 */
export const createBatchJob = async (
  params: CreateBatchJobParams
): Promise<string> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('create_batch_job', {
    p_user_id: params.userId,
    p_name: params.name,
    p_total_items: params.totalItems,
    p_credits_to_charge: params.creditsToCharge,
    p_default_prompt: params.defaultPrompt || undefined,
    p_parameters: params.parameters ?? {},
  });

  if (error) {
    console.error('Error creating batch job:', error);
    throw new Error(`Failed to create batch job: ${error.message}`);
  }

  return data;
};

/**
 * Get a batch job by ID
 */
export const getBatchJob = async (batchId: string): Promise<BatchJob | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('batch_jobs')
    .select('*')
    .eq('id', batchId)
    .single();

  if (error) {
    console.error('Error fetching batch job:', error);
    return null;
  }

  return data;
};

/**
 * Get user's batches with optional filtering
 */
export const getUserBatches = async (
  userId: string,
  options: GetUserBatchesOptions = {}
): Promise<BatchJob[]> => {
  const supabase = await createClient();

  let query = supabase
    .from('batch_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching batches:', error);
    return [];
  }

  return data ?? [];
};

/**
 * Update batch status
 */
export const updateBatchStatus = async (
  batchId: string,
  status: BatchJobStatus,
  errorMessage?: string | null
): Promise<boolean> => {
  const supabase = createAdminClient();

  const updates: Partial<BatchJob> = { status };

  if (status === 'processing' && !errorMessage) {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage !== undefined) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('batch_jobs')
    .update(updates)
    .eq('id', batchId);

  if (error) {
    console.error('Error updating batch status:', error);
    return false;
  }

  return true;
};

/**
 * Update batch with Gemini IDs
 */
export const updateBatchGeminiIds = async (
  batchId: string,
  geminiBatchId: string,
  geminiFileId: string
): Promise<boolean> => {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('batch_jobs')
    .update({
      gemini_batch_id: geminiBatchId,
      gemini_file_id: geminiFileId,
    })
    .eq('id', batchId);

  if (error) {
    console.error('Error updating batch Gemini IDs:', error);
    return false;
  }

  return true;
};

/**
 * Get batch items for a batch
 */
export const getBatchItems = async (batchId: string): Promise<BatchItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('batch_items')
    .select('*')
    .eq('batch_id', batchId)
    .order('sequence_number', { ascending: true });

  if (error) {
    console.error('Error fetching batch items:', error);
    return [];
  }

  return data ?? [];
};

/**
 * Update a batch item
 */
export const updateBatchItem = async (
  itemId: string,
  data: UpdateBatchItemData
): Promise<boolean> => {
  const supabase = createAdminClient();

  const updates: Partial<BatchItem> = {};

  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === 'processing' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (data.status === 'completed' || data.status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }
  }

  if (data.generated_image_id !== undefined) {
    updates.generated_image_id = data.generated_image_id;
  }

  if (data.error_message !== undefined) {
    updates.error_message = data.error_message;
  }

  const { error } = await supabase
    .from('batch_items')
    .update(updates)
    .eq('id', itemId);

  if (error) {
    console.error('Error updating batch item:', error);
    return false;
  }

  return true;
};

/**
 * Update batch progress using RPC function
 */
export const updateBatchProgress = async (
  batchId: string,
  completed: number,
  failed: number
): Promise<boolean> => {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('update_batch_progress', {
    p_batch_id: batchId,
    p_completed: completed,
    p_failed: failed,
  });

  if (error) {
    console.error('Error updating batch progress:', error);
    return false;
  }

  return true;
};

/**
 * Refund batch failures using RPC function
 */
export const refundBatchFailures = async (
  batchId: string,
  creditsPerItem: number
): Promise<number> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('refund_batch_failures', {
    p_batch_id: batchId,
    p_credits_per_item: creditsPerItem,
  });

  if (error) {
    console.error('Error refunding batch failures:', error);
    return 0;
  }

  return data ?? 0;
};

