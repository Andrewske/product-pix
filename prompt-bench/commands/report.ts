/**
 * Report Command - Generate batch analysis reports
 */

import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { createAdminClient } from '@/lib/supabase/admin';
import { summarize } from '@bench/core/statistics';
import { generateInsights, BatchSummary, InsightResult } from './insights';
import { loadConfig } from './shared';

const REPORTS_DIR = join(process.cwd(), 'reports');

interface ReportOptions {
  label: string;
  baseline?: string;
  insights: boolean;
  showUrls: boolean;
}

interface ReportData {
  label: string;
  generatedAt: string;
  stats: {
    n: number;
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    median: number;
  };
  scoreDistribution: Record<string, number>;
  tests: Array<{
    id: string;
    prompt: string;
    imageUrl: string | null;
    score: number;
    durationMs: number | null;
    costUsd: number | null;
  }>;
  costs: {
    generation: number;
    evaluation: number;
    total: number;
  };
  insights?: InsightResult;
}

interface ComparisonData {
  baseline: {
    label: string;
    stats: ReturnType<typeof summarize>;
    tests: ReportData['tests'];
  };
  candidate: {
    label: string;
    stats: ReturnType<typeof summarize>;
    tests: ReportData['tests'];
  };
  analysis: {
    meanDiff: number;
    pValue: number;
    significant: boolean;
    effectSize: number;
    effectInterpretation: string;
    confidenceInterval: [number, number];
  };
}

const parseReportOptions = (args: string[]): ReportOptions => {
  const config = loadConfig();

  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      baseline: { type: 'string', short: 'b' },
      insights: { type: 'boolean' },
      urls: { type: 'boolean' },
    },
  });

  if (!values.label) {
    console.error('--label is required');
    process.exit(1);
  }

  return {
    label: values.label,
    baseline: values.baseline || config?.defaults.baseline_label || undefined,
    insights: values.insights ?? config?.defaults.report?.insights ?? false,
    showUrls: values.urls ?? config?.defaults.report?.show_urls ?? false,
  };
};

const processTests = (
  tests: Array<{
    id: string;
    final_prompt: string;
    image_url: string | null;
    status: string;
    duration_ms: number | null;
    cost_usd: number | null;
    prompt_evaluations: Array<{ score_overall: number | null; details: unknown }> | null;
  }>
): Array<{
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: string;
  score: number;
  durationMs: number | null;
  costUsd: number | null;
}> => {
  return tests
    .map((t) => {
      const evals = t.prompt_evaluations;
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
    .filter((t): t is { id: string; prompt: string; imageUrl: string | null; status: string; score: number; durationMs: number | null; costUsd: number | null } =>
      t.score !== null
    );
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getStyles = (): string => `
  /* Reset */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }

  /* Layout */
  .max-w-6xl { max-width: 72rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .p-8 { padding: 2rem; }
  .p-4 { padding: 1rem; }
  .p-2 { padding: 0.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .mb-4 { margin-bottom: 1rem; }
  .gap-4 { gap: 1rem; }
  .gap-2 { gap: 0.5rem; }

  /* Grid */
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

  /* Flexbox */
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }

  /* Colors */
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-white { background-color: #fff; }
  .bg-gray-200 { background-color: #e5e7eb; }
  .bg-green-500 { background-color: #22c55e; }
  .bg-yellow-500 { background-color: #eab308; }
  .bg-red-500 { background-color: #ef4444; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-700 { color: #374151; }
  .text-gray-900 { color: #111827; }

  /* Typography */
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }

  /* Borders & Shadows */
  .rounded { border-radius: 0.25rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .shadow-md { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .border { border: 1px solid #e5e7eb; }

  /* Images */
  .aspect-square { aspect-ratio: 1; }
  .object-cover { object-fit: cover; }
  .w-full { width: 100%; }
  .h-4 { height: 1rem; }
  .min-h-screen { min-height: 100vh; }

  /* Score bar */
  .score-bar { height: 1rem; border-radius: 0.25rem; transition: width 0.3s; }

  /* Print styles */
  @media print {
    body { background: white; }
    .no-print { display: none; }
  }

  /* Comparison specific */
  .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  .delta-positive { color: #22c55e; }
  .delta-negative { color: #ef4444; }
  .significance-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
  .significant { background-color: #dcfce7; color: #166534; }
  .not-significant { background-color: #f3f4f6; color: #6b7280; }
  .diff-added { background-color: #dcfce7; }
  .diff-removed { background-color: #fee2e2; }

  /* Insights section */
  .from-purple-50 { --tw-gradient-from: #faf5ff; }
  .to-blue-50 { --tw-gradient-to: #eff6ff; }
  .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)); }
  .border-purple-100 { border-color: #f3e8ff; }
  .text-purple-500 { color: #a855f7; }
  .text-blue-500 { color: #3b82f6; }
  .text-green-500 { color: #22c55e; }
  .space-y-2 > * + * { margin-top: 0.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .ml-auto { margin-left: auto; }

  /* Responsive */
  @media (max-width: 768px) {
    .grid-cols-3, .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
    .comparison-grid { grid-template-columns: 1fr; gap: 1rem; }
  }
`;

const renderHeader = (data: ReportData, comparison?: ComparisonData | null): string => {
  const title = comparison
    ? `Comparison Report: ${escapeHtml(comparison.baseline.label)} vs ${escapeHtml(data.label)}`
    : `Batch Report: ${escapeHtml(data.label)}`;

  return `
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">${title}</h1>
    <p class="text-sm text-gray-500">Generated: ${data.generatedAt}</p>
  </header>
`;
};

const renderSummaryStats = (data: ReportData): string => `
  <section class="bg-white rounded-lg shadow p-4 mb-8">
    <h2 class="text-lg font-semibold mb-4">Summary Statistics</h2>
    <div class="grid grid-cols-3 gap-4">
      ${renderStatCard('Tests', data.stats.n.toString())}
      ${renderStatCard('Mean Score', data.stats.mean.toFixed(2) + '/10')}
      ${renderStatCard('Std Dev', data.stats.stdDev.toFixed(2))}
      ${renderStatCard('Median', data.stats.median.toFixed(1))}
      ${renderStatCard('Min', data.stats.min.toFixed(1))}
      ${renderStatCard('Max', data.stats.max.toFixed(1))}
    </div>
  </section>
`;

const renderStatCard = (label: string, value: string): string => `
  <div class="p-4 bg-gray-50 rounded">
    <p class="text-sm text-gray-500">${label}</p>
    <p class="text-2xl font-bold text-gray-900">${value}</p>
  </div>
`;

const renderScoreDistribution = (data: ReportData): string => {
  const maxCount = Math.max(...Object.values(data.scoreDistribution));

  const bars = Object.entries(data.scoreDistribution)
    .map(([range, count]) => {
      const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
      const color = getDistributionColor(range);
      return `
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm text-gray-700 w-32">${range}</span>
          <div class="flex-1 bg-gray-200 rounded h-4">
            <div class="score-bar ${color}" style="width: ${width}%"></div>
          </div>
          <span class="text-sm text-gray-500 w-8">${count}</span>
        </div>
      `;
    })
    .join('');

  return `
    <section class="bg-white rounded-lg shadow p-4 mb-8">
      <h2 class="text-lg font-semibold mb-4">Score Distribution</h2>
      ${bars}
    </section>
  `;
};

const getDistributionColor = (range: string): string => {
  if (range.includes('Poor')) return 'bg-red-500';
  if (range.includes('Below')) return 'bg-yellow-500';
  if (range.includes('Average')) return 'bg-yellow-500';
  if (range.includes('Good')) return 'bg-green-500';
  return 'bg-green-500'; // Excellent
};

const renderTestGrid = (data: ReportData): string => {
  const sortedTests = [...data.tests].sort((a, b) => b.score - a.score);

  const cards = sortedTests.map(test => `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      ${test.imageUrl
        ? `<img src="${escapeHtml(test.imageUrl)}" alt="Generated image" class="w-full aspect-square object-cover" loading="lazy">`
        : `<div class="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-500">No image</div>`
      }
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold">${test.score.toFixed(1)}/10</span>
          ${renderScoreBadge(test.score)}
        </div>
        <p class="text-sm text-gray-500 truncate" title="${escapeHtml(test.prompt)}">
          ${escapeHtml(test.prompt.slice(0, 60))}...
        </p>
      </div>
    </div>
  `).join('');

  return `
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">Test Results (${data.tests.length} tests)</h2>
      <div class="grid grid-cols-4 gap-4">
        ${cards}
      </div>
    </section>
  `;
};

const renderScoreBadge = (score: number): string => {
  const color = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';
  return `<span class="text-xs text-white ${color} rounded px-2 py-1">${score >= 7 ? 'Good' : score >= 5 ? 'Avg' : 'Low'}</span>`;
};

const renderComparisonSummary = (comparison: ComparisonData): string => {
  const { baseline, candidate, analysis } = comparison;
  const direction = analysis.meanDiff > 0 ? '+' : '';
  const deltaClass = analysis.meanDiff > 0 ? 'delta-positive' : analysis.meanDiff < 0 ? 'delta-negative' : '';
  const sigClass = analysis.significant ? 'significant' : 'not-significant';
  const sigText = analysis.significant ? 'Statistically Significant' : 'Not Significant';

  return `
    <section class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-lg font-semibold mb-4">Comparison: ${escapeHtml(baseline.label)} → ${escapeHtml(candidate.label)}</h2>

      <div class="grid grid-cols-2 gap-8 mb-6">
        <!-- Baseline -->
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-700 mb-2">Baseline: ${escapeHtml(baseline.label)}</h3>
          <p class="text-3xl font-bold">${baseline.stats.mean.toFixed(2)}<span class="text-lg text-gray-500">/10</span></p>
          <p class="text-sm text-gray-500">n=${baseline.stats.n}, σ=${baseline.stats.stdDev.toFixed(2)}</p>
        </div>

        <!-- Candidate -->
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-700 mb-2">Candidate: ${escapeHtml(candidate.label)}</h3>
          <p class="text-3xl font-bold">${candidate.stats.mean.toFixed(2)}<span class="text-lg text-gray-500">/10</span></p>
          <p class="text-sm text-gray-500">n=${candidate.stats.n}, σ=${candidate.stats.stdDev.toFixed(2)}</p>
        </div>
      </div>

      <!-- Analysis -->
      <div class="border-t pt-4">
        <div class="flex items-center gap-4 mb-2">
          <span class="text-2xl font-bold ${deltaClass}">${direction}${analysis.meanDiff.toFixed(3)}</span>
          <span class="significance-badge ${sigClass}">${sigText}</span>
        </div>
        <p class="text-sm text-gray-500">
          p-value: ${analysis.pValue.toFixed(4)} |
          Effect size: ${analysis.effectSize.toFixed(2)} (${analysis.effectInterpretation}) |
          95% CI: [${analysis.confidenceInterval[0].toFixed(3)}, ${analysis.confidenceInterval[1].toFixed(3)}]
        </p>
      </div>
    </section>
  `;
};

const renderComparisonGrid = (comparison: ComparisonData): string => {
  const { baseline, candidate } = comparison;

  // Sort both by score descending
  const baselineSorted = [...baseline.tests].sort((a, b) => b.score - a.score);
  const candidateSorted = [...candidate.tests].sort((a, b) => b.score - a.score);

  // Take top N from each
  const topN = 6;
  const baselineTop = baselineSorted.slice(0, topN);
  const candidateTop = candidateSorted.slice(0, topN);

  return `
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">Top Results Comparison</h2>
      <div class="comparison-grid">
        <!-- Baseline Column -->
        <div>
          <h3 class="font-semibold text-gray-700 mb-4">${escapeHtml(baseline.label)} (Top ${topN})</h3>
          <div class="grid grid-cols-2 gap-4">
            ${baselineTop.map(test => renderComparisonCard(test)).join('')}
          </div>
        </div>

        <!-- Candidate Column -->
        <div>
          <h3 class="font-semibold text-gray-700 mb-4">${escapeHtml(candidate.label)} (Top ${topN})</h3>
          <div class="grid grid-cols-2 gap-4">
            ${candidateTop.map(test => renderComparisonCard(test)).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Full results for candidate (current batch) -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">All ${escapeHtml(candidate.label)} Results (${candidate.tests.length} tests)</h2>
      <div class="grid grid-cols-4 gap-4">
        ${candidateSorted.map(test => renderTestCard(test)).join('')}
      </div>
    </section>
  `;
};

const renderComparisonCard = (test: ReportData['tests'][0]): string => `
  <div class="bg-white rounded-lg shadow overflow-hidden">
    ${test.imageUrl
      ? `<img src="${escapeHtml(test.imageUrl)}" alt="Generated image" class="w-full aspect-square object-cover" loading="lazy">`
      : `<div class="w-full aspect-square bg-gray-200"></div>`
    }
    <div class="p-2">
      <span class="font-semibold">${test.score.toFixed(1)}/10</span>
      ${renderScoreBadge(test.score)}
    </div>
  </div>
`;

const renderTestCard = (test: ReportData['tests'][0]): string => `
  <div class="bg-white rounded-lg shadow overflow-hidden">
    ${test.imageUrl
      ? `<img src="${escapeHtml(test.imageUrl)}" alt="Generated image" class="w-full aspect-square object-cover" loading="lazy">`
      : `<div class="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-500">No image</div>`
    }
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold">${test.score.toFixed(1)}/10</span>
        ${renderScoreBadge(test.score)}
      </div>
      <p class="text-sm text-gray-500 truncate" title="${escapeHtml(test.prompt)}">
        ${escapeHtml(test.prompt.slice(0, 60))}...
      </p>
    </div>
  </div>
`;

const renderInsights = (insights: InsightResult): string => `
  <section class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-8 border border-purple-100">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-2xl">🤖</span>
      <h2 class="text-lg font-semibold">AI-Powered Insights</h2>
      <span class="text-xs text-gray-500 ml-auto">Cost: $${insights.costUsd.toFixed(4)}</span>
    </div>

    <!-- Key Findings -->
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 mb-2">📊 Key Findings</h3>
      <ul class="space-y-2">
        ${insights.keyFindings.map(finding => `
          <li class="flex items-start gap-2">
            <span class="text-purple-500 mt-1">•</span>
            <span class="text-gray-700">${escapeHtml(finding)}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Recommendations -->
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 mb-2">💡 Recommendations</h3>
      <ul class="space-y-2">
        ${insights.recommendations.map(rec => `
          <li class="flex items-start gap-2">
            <span class="text-blue-500 mt-1">•</span>
            <span class="text-gray-700">${escapeHtml(rec)}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Next Steps -->
    <div>
      <h3 class="font-semibold text-gray-700 mb-2">🎯 Next Steps</h3>
      <ul class="space-y-2">
        ${insights.nextSteps.map(step => `
          <li class="flex items-start gap-2">
            <span class="text-green-500 mt-1">•</span>
            <span class="text-gray-700">${escapeHtml(step)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  </section>
`;

const renderCostSummary = (data: ReportData): string => `
  <section class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">Cost Summary</h2>
    <div class="grid grid-cols-${data.insights ? '4' : '3'} gap-4">
      ${renderStatCard('Generation', '$' + data.costs.generation.toFixed(4))}
      ${renderStatCard('Evaluation', '$' + data.costs.evaluation.toFixed(4))}
      ${data.insights ? renderStatCard('Insights', '$' + data.insights.costUsd.toFixed(4)) : ''}
      ${renderStatCard('Total', '$' + (data.costs.total + (data.insights?.costUsd ?? 0)).toFixed(4))}
    </div>
  </section>
`;

const generateHTML = (data: ReportData, comparison?: ComparisonData | null): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Report: ${escapeHtml(data.label)}</title>
  <style>${getStyles()}</style>
</head>
  <body class="bg-gray-50 min-h-screen">
   <div class="max-w-6xl mx-auto p-8">
     ${renderHeader(data, comparison)}
     ${comparison ? renderComparisonSummary(comparison) : ''}
     ${data.insights ? renderInsights(data.insights) : ''}
     ${renderSummaryStats(data)}
     ${renderScoreDistribution(data)}
     ${comparison ? renderComparisonGrid(comparison) : renderTestGrid(data)}
     ${renderCostSummary(data)}
   </div>
  </body>
</html>
`;

export const reportCommand = async (args: string[]): Promise<void> => {
  const options = parseReportOptions(args);

  console.log(`\n📋 Prompt Bench: Report`);
  console.log(`─────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  if (options.baseline) {
    console.log(`Baseline: ${options.baseline}`);
  }
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
  const scoredTests = processTests(tests);

  if (scoredTests.length === 0) {
    console.log(`No evaluated tests found for label "${options.label}"`);
    console.log(`Run: npm run bench evaluate --label "${options.label}"`);
    return;
  }

  const scores = scoredTests.map((t) => t.score);
  const sortedByScore = [...scoredTests].sort((a, b) => b.score - a.score);

  // Import statistics
  const { summarize, getScoreDistribution, welchTTest } = await import('@bench/core/statistics');

  // Fetch baseline data if requested
  let comparisonData: ComparisonData | null = null;

  if (options.baseline) {
    console.log(`\n📊 Fetching baseline batch: ${options.baseline}`);

    // Fetch baseline batch
    const { data: baselineTests, error: baselineError } = await supabase
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
      .eq('batch_label', options.baseline)
      .order('created_at', { ascending: true });

    if (baselineError) {
      console.error(`Error fetching baseline: ${baselineError.message}`);
      process.exit(1);
    }

    if (!baselineTests || baselineTests.length === 0) {
      console.error(`No tests found for baseline "${options.baseline}"`);
      process.exit(1);
    }

    // Process baseline tests
    const baselineScoredTests = processTests(baselineTests);
    const baselineScores = baselineScoredTests.map(t => t.score);

    if (baselineScoredTests.length === 0) {
      console.error(`No evaluated tests found for baseline "${options.baseline}"`);
      console.error(`Run: npm run bench evaluate --label "${options.baseline}"`);
      process.exit(1);
    }

    // Run statistical comparison
    const testResult = welchTTest(baselineScores, scores);

    comparisonData = {
      baseline: {
        label: options.baseline,
        stats: summarize(baselineScores),
        tests: baselineScoredTests,
      },
      candidate: {
        label: options.label,
        stats: summarize(scores),
        tests: scoredTests,
      },
      analysis: {
        meanDiff: testResult.meanDiff,
        pValue: testResult.pValue,
        significant: testResult.significant,
        effectSize: testResult.effectSize,
        effectInterpretation: testResult.effectInterpretation,
        confidenceInterval: testResult.confidenceInterval,
      },
    };

    console.log(`✅ Baseline comparison ready: ${baselineScoredTests.length} vs ${scoredTests.length} tests`);
  }

  // Generate insights if requested
  let insights: InsightResult | null = null;

  if (options.insights) {
    console.log('🤖 Generating AI insights...');

    const summary: BatchSummary = {
      label: options.label,
      testCount: scoredTests.length,
      stats: summarize(scores),
      scoreDistribution: getScoreDistribution(scores),
      topTests: sortedByScore.slice(0, 3).map(t => ({
        score: t.score,
        prompt: t.prompt,
      })),
      bottomTests: sortedByScore.slice(-3).reverse().map(t => ({
        score: t.score,
        prompt: t.prompt,
      })),
    };

    // Add comparison data if baseline provided
    if (comparisonData) {
      summary.comparison = {
        baselineLabel: comparisonData.baseline.label,
        baselineMean: comparisonData.baseline.stats.mean,
        meanDiff: comparisonData.analysis.meanDiff,
        significant: comparisonData.analysis.significant,
      };
    }

    const insightsResult = await generateInsights(summary);

    if (insightsResult.ok) {
      insights = insightsResult.data;
      console.log(`   ✓ Insights generated ($${insights.costUsd.toFixed(4)})`);
    } else {
      console.warn(`   ⚠ Insights generation failed: ${insightsResult.error.message}`);
      // Continue without insights - don't fail the whole report
    }
  }

  // Cost summary
  const totalGenerationCost = tests.reduce((sum, t) => sum + (t.cost_usd || 0), 0);
  const { data: evalCosts } = await supabase
    .from('prompt_evaluations')
    .select('cost_usd')
    .in('test_id', tests.map((t) => t.id));

  const totalEvalCost = (evalCosts || []).reduce((sum, e) => sum + (e.cost_usd || 0), 0);

  // Build report data
  const reportData: ReportData = {
    label: options.label,
    generatedAt: new Date().toISOString(),
    stats: summarize(scores),
    scoreDistribution: getScoreDistribution(scores),
    tests: scoredTests,
    costs: {
      generation: totalGenerationCost,
      evaluation: totalEvalCost,
      total: totalGenerationCost + totalEvalCost,
    },
    insights: insights ?? undefined,
  };

  // Generate HTML
  const html = generateHTML(reportData, comparisonData);

  // Write to file
  await mkdir(REPORTS_DIR, { recursive: true });
  const fileName = comparisonData
    ? `${options.baseline}-vs-${options.label}.html`
    : `${options.label}.html`;
  const outputPath = join(REPORTS_DIR, fileName);
  await writeFile(outputPath, html, 'utf-8');

  console.log(`\n✅ Report generated: ${outputPath}`);

  // Show URLs if requested
  if (options.showUrls) {
    console.log(`\n📷 Image URLs:`);
    console.log(`─────────────────────────────────`);
    const sortedByScore = [...scoredTests].sort((a, b) => b.score - a.score);
    for (const test of sortedByScore) {
      if (test.imageUrl) {
        console.log(`[${test.score.toFixed(1)}] ${test.imageUrl}`);
      }
    }
  }
};
