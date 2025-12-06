// src/lib/db/jobs.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Job, JobStatus, CreateJobResult, Json } from '@/types';

export const createGenerationJob = async (
  userId: string,
  uploadId: string | null,
  prompt: string,
  parameters: Json = {},
  credits = 1
): Promise<CreateJobResult> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('create_generation_job', {
    p_user_id: userId,
    p_upload_id: uploadId || '',
    p_prompt: prompt,
    p_parameters: parameters,
    p_credits: credits,
  });

  if (error) {
    console.error('Error creating job:', error);
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
    console.error('Error fetching job:', error);
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
    console.error('Error fetching jobs:', error);
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
    console.error('Error updating job status:', error);
    return false;
  }

  return true;
};