/**
 * Shared utilities for prompt bench commands
 */

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Fetch evaluation scores for a batch by label
 */
export const fetchBatchScores = async (
  supabase: ReturnType<typeof createAdminClient>,
  label: string
): Promise<number[]> => {
  const { data, error } = await supabase
    .from('prompt_tests')
    .select(`
      id,
      prompt_evaluations (
        score_overall
      )
    `)
    .eq('batch_label', label)
    .eq('status', 'completed');

  if (error) {
    throw new Error(`Failed to fetch scores for ${label}: ${error.message}`);
  }

  return (data || [])
    .map((t) => {
      const evals = t.prompt_evaluations as Array<{ score_overall: number }> | null;
      return evals?.[0]?.score_overall;
    })
    .filter((score): score is number => score !== undefined && score !== null);
};

/**
 * Sleep utility for rate limiting
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
