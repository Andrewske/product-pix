/**
 * Report Command - Generate batch analysis reports
 */

import { parseArgs } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';

interface ReportOptions {
  label: string;
  showUrls: boolean;
}

const parseReportOptions = (args: string[]): ReportOptions => {
  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      urls: { type: 'boolean', default: false },
    },
  });

  if (!values.label) {
    console.error('--label is required');
    process.exit(1);
  }

  return {
    label: values.label,
    showUrls: values.urls ?? false,
  };
};

export const reportCommand = async (args: string[]): Promise<void> => {
  const options = parseReportOptions(args);

  console.log(`\n📋 Prompt Bench: Report`);
  console.log(`─────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch all tests with evaluations for this batch
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select(`
      id,
      final_prompt,
      image_url,
      status,
      duration_ms,
      cost_usd,
      prompt_evaluations (
        score_overall,
        details
      )
    `)
    .eq('batch_label', options.label)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(`No tests found for label "${options.label}"`);
    return;
  }

  // Extract scores and build report data
  const scoredTests = tests
    .map((t) => {
      const evals = t.prompt_evaluations as Array<{ score_overall: number; details: unknown }> | null;
      const score = evals?.[0]?.score_overall;
      return {
        id: t.id,
        prompt: t.final_prompt,
        imageUrl: t.image_url,
        status: t.status,
        score: score ?? null,
        durationMs: t.duration_ms,
        costUsd: t.cost_usd,
      };
    })
    .filter((t) => t.score !== null) as Array<{
      id: string;
      prompt: string;
      imageUrl: string | null;
      status: string;
      score: number;
      durationMs: number | null;
      costUsd: number | null;
    }>;

  if (scoredTests.length === 0) {
    console.log(`No evaluated tests found for label "${options.label}"`);
    console.log(`Run: npm run bench evaluate --label "${options.label}"`);
    return;
  }

  const scores = scoredTests.map((t) => t.score);

  // Import statistics
  const { summarize, formatReport, getScoreDistribution } = await import('@/lib/prompts/statistics');

  // Sort by score for top/bottom
  const sortedByScore = [...scoredTests].sort((a, b) => b.score - a.score);

  const report = {
    label: options.label,
    stats: summarize(scores),
    scoreDistribution: getScoreDistribution(scores),
    topScores: sortedByScore.slice(0, 3).map((t) => ({
      id: t.id,
      score: t.score,
      prompt: t.prompt,
    })),
    bottomScores: sortedByScore.slice(-3).reverse().map((t) => ({
      id: t.id,
      score: t.score,
      prompt: t.prompt,
    })),
  };

  console.log(formatReport(report));

  // Show URLs if requested
  if (options.showUrls) {
    console.log(`\n📷 Image URLs:`);
    console.log(`─────────────────────────────────`);
    for (const test of sortedByScore) {
      if (test.imageUrl) {
        console.log(`[${test.score.toFixed(1)}] ${test.imageUrl}`);
      }
    }
  }

  // Cost summary
  const totalGenerationCost = tests.reduce((sum, t) => sum + (t.cost_usd || 0), 0);
  const { data: evalCosts } = await supabase
    .from('prompt_evaluations')
    .select('cost_usd')
    .in('test_id', tests.map((t) => t.id));

  const totalEvalCost = (evalCosts || []).reduce((sum, e) => sum + (e.cost_usd || 0), 0);

  console.log(`\n💰 Cost Summary:`);
  console.log(`─────────────────────────────────`);
  console.log(`   Generation: $${totalGenerationCost.toFixed(4)}`);
  console.log(`   Evaluation: $${totalEvalCost.toFixed(4)}`);
  console.log(`   Total: $${(totalGenerationCost + totalEvalCost).toFixed(4)}`);
};
