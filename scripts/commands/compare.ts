/**
 * Compare Command - A/B test comparison with statistical analysis
 */

import { parseArgs } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';
import { fetchBatchScores, loadConfig } from './shared';

interface CompareOptions {
  baseline: string;
  candidate: string;
}

const parseCompareOptions = (args: string[]): CompareOptions => {
  const config = loadConfig();

  const { values } = parseArgs({
    args,
    options: {
      baseline: { type: 'string', short: 'b' },
      candidate: { type: 'string', short: 'c' },
    },
  });

  const baseline = values.baseline || config?.defaults.baseline_label;
  if (!baseline) {
    console.error('--baseline is required (or set baseline_label in prompt-bench.toml)');
    process.exit(1);
  }

  if (!values.candidate) {
    console.error('--candidate is required');
    process.exit(1);
  }

  return {
    baseline,
    candidate: values.candidate,
  };
};

export const compareCommand = async (args: string[]): Promise<void> => {
  const options = parseCompareOptions(args);

  console.log(`\n📊 Prompt Bench: Compare`);
  console.log(`─────────────────────────────────`);
  console.log(`Baseline: ${options.baseline}`);
  console.log(`Candidate: ${options.candidate}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch scores for both batches
  let baselineScores: number[];
  let candidateScores: number[];

  try {
    baselineScores = await fetchBatchScores(supabase, options.baseline);
    candidateScores = await fetchBatchScores(supabase, options.candidate);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }

  if (baselineScores.length === 0) {
    console.error(`No completed evaluations found for baseline "${options.baseline}"`);
    process.exit(1);
  }

  if (candidateScores.length === 0) {
    console.error(`No completed evaluations found for candidate "${options.candidate}"`);
    process.exit(1);
  }

  // Import statistics module
  const {
    welchTTest,
    summarize,
    checkSampleSize,
    formatComparison,
  } = await import('@/lib/prompts/statistics');

  // Check sample sizes
  const baselineCheck = checkSampleSize(baselineScores.length);
  const candidateCheck = checkSampleSize(candidateScores.length);

  let sampleWarning: string | undefined;
  if (!baselineCheck.adequate || !candidateCheck.adequate) {
    sampleWarning = baselineCheck.warning || candidateCheck.warning;
  } else if (baselineCheck.warning || candidateCheck.warning) {
    sampleWarning = baselineCheck.warning || candidateCheck.warning;
  }

  // Run t-test
  const testResult = welchTTest(baselineScores, candidateScores);

  // Format and display
  const summary = {
    baseline: {
      label: options.baseline,
      stats: summarize(baselineScores),
    },
    candidate: {
      label: options.candidate,
      stats: summarize(candidateScores),
    },
    test: testResult,
    sampleWarning,
  };

  console.log(formatComparison(summary));
};
