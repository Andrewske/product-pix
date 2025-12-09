// src/lib/db/cost-queries.ts
import { createAdminClient } from '@/lib/supabase/admin';

interface GenerationCostRecord {
  total_cost_usd: number;
  created_at?: string;
}

export interface CreateGenerationCostParams {
  jobId?: string;
  generatedImageId?: string;
  modelId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  fallbackUsed?: boolean;
}

export const createGenerationCost = async (
  params: CreateGenerationCostParams
): Promise<boolean> => {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('generation_costs')
    .insert({
      job_id: params.jobId ?? null,
      generated_image_id: params.generatedImageId ?? null,
      model_id: params.modelId,
      provider: params.provider,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      input_cost_usd: params.inputCostUsd,
      output_cost_usd: params.outputCostUsd,
      total_cost_usd: params.totalCostUsd,
      fallback_used: params.fallbackUsed ?? false,
    });

  if (error) {
    console.error('Error creating generation cost record:', error);
    return false;
  }

  return true;
};

export const getTotalCostByJob = async (jobId: string): Promise<number> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('generation_costs')
    .select('total_cost_usd')
    .eq('job_id', jobId);

  if (error) {
    console.error('Error fetching costs by job:', error);
    return 0;
  }

  return data.reduce((sum: number, record: GenerationCostRecord) => sum + Number(record.total_cost_usd), 0);
};

export const getTotalCostByDateRange = async (
  start: Date,
  end: Date
): Promise<Array<{ date: string; totalCost: number }>> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('generation_costs')
    .select('total_cost_usd, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at');

  if (error) {
    console.error('Error fetching costs by date range:', error);
    return [];
  }

  // Group by date
  const grouped: Record<string, number> = {};
  data.forEach((record) => {
    if (!record.created_at) return;
    const date = new Date(record.created_at).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + Number(record.total_cost_usd);
  });

  return Object.entries(grouped).map(([date, totalCost]) => ({
    date,
    totalCost,
  }));
};

export const getTotalCostByModel = async (modelId: string): Promise<number> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('generation_costs')
    .select('total_cost_usd')
    .eq('model_id', modelId);

  if (error) {
    console.error('Error fetching costs by model:', error);
    return 0;
  }

  return data.reduce((sum: number, record: GenerationCostRecord) => sum + Number(record.total_cost_usd), 0);
};

export const getFallbackUsageCount = async (): Promise<number> => {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('generation_costs')
    .select('*', { count: 'exact', head: true })
    .eq('fallback_used', true);

  if (error) {
    console.error('Error fetching fallback usage count:', error);
    return 0;
  }

  return count || 0;
};