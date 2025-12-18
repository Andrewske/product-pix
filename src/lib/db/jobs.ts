// src/lib/db/jobs.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { Job, JobStatus, CreateJobResult, Json } from '@/types';

export const createGenerationJob = async (
  userId: string,
  uploadId: string | null,
  prompt: string,
  parameters: Json = {},
  credits = 1,
  templateSlug?: string,
  generationMode?: string
): Promise<CreateJobResult> => {
  const supabase = createAdminClient();

  // Pass parameters in the exact order expected by the database function:
  // p_user_id, p_upload_id, p_prompt, p_parameters, p_credits, p_template_slug, p_generation_mode
  const { data, error } = await supabase.rpc('create_generation_job', {
    p_user_id: userId,
    p_upload_id: uploadId || '',
    p_prompt: prompt,
    p_parameters: parameters,
    p_credits: credits,
    p_template_slug: templateSlug || 'ecommerce-base',
    p_generation_mode: generationMode || 'lightning',
  });

  if (error) {
    logger.error('Error creating job', { error, userId, uploadId, prompt });
    return { success: false, job_id: null, message: error.message };
  }

  const result = data[0];
  return {
    success: result.success,
    job_id: result.job_id,
    message: result.message,
  };
};

export const getJob = async (jobId: string): Promise<Job | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    logger.error('Error fetching job', { error, jobId });
    return null;
  }

  return data;
};

export const getUserJobs = async (
  userId: string,
  status?: JobStatus,
  limit = 50
): Promise<Job[]> => {
  const supabase = await createClient();

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching jobs', { error, userId, status, limit });
    return [];
  }

  return data;
};

export const updateJobStatus = async (
  jobId: string,
  status: JobStatus,
  errorMessage?: string
): Promise<boolean> => {
  const supabase = createAdminClient();

  const updates: Partial<Job> = { status };

  if (status === 'processing') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    logger.error('Error updating job status', { error, jobId, status, errorMessage });
    return false;
  }

  return true;
};

export const updateJobParameters = async (
  jobId: string,
  params: Record<string, unknown>
): Promise<boolean> => {
  const supabase = createAdminClient();

  // Fetch existing parameters to merge
  const { data: current } = await supabase
    .from('jobs')
    .select('parameters')
    .eq('id', jobId)
    .single();

  const merged = { ...(current?.parameters as Record<string, unknown> ?? {}), ...params };

  const { error } = await supabase
    .from('jobs')
    .update({ parameters: merged as Json })
    .eq('id', jobId);

  if (error) {
    logger.error('Error updating job parameters', { error, jobId });
    return false;
  }

  return true;
};