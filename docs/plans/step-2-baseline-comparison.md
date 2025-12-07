# Step 2: Baseline Comparison Feature

## Objective

Add `--baseline <label>` flag to the report command that enables side-by-side comparison between two batches, showing score deltas, prompt diffs, and statistical analysis.

## Prerequisites

- Step 1 (Core HTML Report) must be completed first
- Existing `compare.ts` and `statistics.ts` modules provide statistical functions

## Current State

- `report.ts` generates HTML for a single batch
- `compare.ts` has console-based A/B comparison with statistical analysis
- `statistics.ts` has `welchTTest()`, `summarize()`, `formatComparison()`

## Target State

- `--baseline <label>` flag compares current batch against baseline
- HTML shows side-by-side comparison with:
  - Summary stats for both batches
  - Score delta visualization
  - Statistical significance indicator
  - Prompt diff highlighting
  - Image comparison grid

## Implementation Tasks

### 1. Update ReportOptions interface

```typescript
interface ReportOptions {
  label: string;
  baseline?: string;  // NEW: baseline batch for comparison
  showUrls: boolean;
}

const parseReportOptions = (args: string[]): ReportOptions => {
  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      baseline: { type: 'string', short: 'b' },  // NEW
      urls: { type: 'boolean', default: false },
    },
  });

  // ... validation ...

  return {
    label: values.label,
    baseline: values.baseline,  // NEW
    showUrls: values.urls ?? false,
  };
};
```

### 2. Create ComparisonData interface

```typescript
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
```

### 3. Fetch baseline data when flag provided

In `reportCommand()`:

```typescript
let comparisonData: ComparisonData | null = null;

if (options.baseline) {
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

  // Process baseline tests (same logic as main batch)
  const baselineScoredTests = processTests(baselineTests);
  const baselineScores = baselineScoredTests.map(t => t.score);

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
}
```

### 4. Extract test processing into helper

```typescript
const processTests = (
  tests: Array<{
    id: string;
    final_prompt: string;
    image_url: string | null;
    status: string;
    duration_ms: number | null;
    cost_usd: number | null;
    prompt_evaluations: Array<{ score_overall: number; details: unknown }> | null;
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
```

### 5. Update generateHTML to include comparison

```typescript
const generateHTML = (data: ReportData, comparison?: ComparisonData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Report: ${escapeHtml(data.label)}${comparison ? ' vs ' + escapeHtml(comparison.baseline.label) : ''}</title>
  <style>${getStyles()}</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="max-w-6xl mx-auto p-8">
    ${renderHeader(data, comparison)}
    ${comparison ? renderComparisonSummary(comparison) : ''}
    ${renderSummaryStats(data)}
    ${renderScoreDistribution(data)}
    ${comparison ? renderComparisonGrid(comparison) : renderTestGrid(data)}
    ${renderCostSummary(data)}
  </div>
</body>
</html>
`;
```

### 6. Add comparison-specific styles

Add to `getStyles()`:

```typescript
/* Comparison specific */
.comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.delta-positive { color: #22c55e; }
.delta-negative { color: #ef4444; }
.significance-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.significant { background-color: #dcfce7; color: #166534; }
.not-significant { background-color: #f3f4f6; color: #6b7280; }
.diff-added { background-color: #dcfce7; }
.diff-removed { background-color: #fee2e2; }
```

### 7. Implement renderComparisonSummary

```typescript
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
```

### 8. Implement renderComparisonGrid

Show images from both batches side-by-side:

```typescript
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
```

### 9. Update header for comparison mode

```typescript
const renderHeader = (data: ReportData, comparison?: ComparisonData): string => {
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
```

### 10. Update file output path for comparisons

```typescript
// In reportCommand()
const fileName = comparisonData
  ? `${options.baseline}-vs-${options.label}.html`
  : `${options.label}.html`;

const outputPath = join(REPORTS_DIR, fileName);
await writeFile(outputPath, html, 'utf-8');
```

## Files to Modify

| File | Changes |
|------|---------|
| `scripts/commands/report.ts` | Add --baseline flag, comparison rendering |

## Testing

1. Create two batches with different prompts
2. Run `pnpm bench report --label <candidate> --baseline <baseline>`
3. Verify HTML shows:
   - Both batch statistics
   - Mean difference with significance badge
   - Side-by-side image comparison
   - Correct delta coloring (green for improvement)
4. Test without baseline flag (should work as before)

## Success Criteria

- [ ] `--baseline` flag accepted and parsed
- [ ] Comparison statistics calculated using `welchTTest()`
- [ ] Mean delta displayed with correct sign and color
- [ ] Statistical significance badge shown
- [ ] Side-by-side image grid renders both batches
- [ ] File named `{baseline}-vs-{candidate}.html`
- [ ] Error handling for invalid baseline labels
