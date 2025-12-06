# Step 12: Add Compare and Report Commands to CLI

## Objective

Add the `compare` and `report` commands to the CLI for A/B testing and batch reporting.

## Prerequisites

- Steps 01-11 completed

## Files to Modify

### Update `scripts/prompt-bench.ts`

Add the following commands after the existing `evaluateCommand`:

```typescript
// =============================================================================
// Compare Command
// =============================================================================

interface CompareOptions {
  baseline: string;
  candidate: string;
}

const parseCompareOptions = (args: string[]): CompareOptions => {
  const { values } = parseArgs({
    args,
    options: {
      baseline: { type: 'string', short: 'b' },
      candidate: { type: 'string', short: 'c' },
    },
  });

  if (!values.baseline) {
    console.error('--baseline is required');
    process.exit(1);
  }

  if (!values.candidate) {
    console.error('--candidate is required');
    process.exit(1);
  }

  return {
    baseline: values.baseline,
    candidate: values.candidate,
  };
};

const fetchBatchScores = async (
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

const compareCommand = async (args: string[]): Promise<void> => {
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

// =============================================================================
// Report Command
// =============================================================================

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

const reportCommand = async (args: string[]): Promise<void> => {
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
```

Update the main switch statement to include the new commands:

```typescript
case 'compare':
  await compareCommand(args);
  break;
case 'report':
  await reportCommand(args);
  break;
```

## Complete CLI Script

For reference, here's the complete updated main switch:

```typescript
const main = async (): Promise<void> => {
  const { command, args } = parseCommand();

  switch (command) {
    case 'run':
      await runCommand(args);
      break;
    case 'evaluate':
      await evaluateCommand(args);
      break;
    case 'compare':
      await compareCommand(args);
      break;
    case 'report':
      await reportCommand(args);
      break;
    case 'sync':
      await syncCommand();
      break;
    default:
      console.error(`Command not implemented: ${command}`);
      process.exit(1);
  }
};
```

## Implementation Steps

1. Open `scripts/prompt-bench.ts`
2. Add the `fetchBatchScores` helper function
3. Add the `compareCommand` function with argument parsing
4. Add the `reportCommand` function with argument parsing
5. Update the main switch statement
6. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] `compare` command parses `--baseline` and `--candidate` options
- [ ] `compare` command fetches scores from database
- [ ] `compare` command runs Welch's t-test
- [ ] `compare` command displays formatted comparison with significance
- [ ] `compare` command shows sample size warnings when appropriate
- [ ] `report` command parses `--label` option
- [ ] `report` command fetches tests and evaluations
- [ ] `report` command displays formatted batch report
- [ ] `report` command shows score distribution
- [ ] `report` command shows top/bottom scores
- [ ] `report --urls` shows image URLs for manual review
- [ ] `report` command shows cost summary

## Usage

```bash
# Compare two batches
npm run bench compare --baseline "v1-baseline" --candidate "v2-improved"

# Output:
# ┌─────────────────────────────────────────────────────────────┐
# │ A/B Comparison: v1-baseline vs v2-improved
# ├─────────────────────────────────────────────────────────────┤
# │ Baseline (v1-baseline):
# │   n=30  mean=7.25  std=0.82
# │   range: [5.5, 9.0]
# │
# │ Candidate (v2-improved):
# │   n=30  mean=8.10  std=0.65
# │   range: [6.5, 9.5]
# ├─────────────────────────────────────────────────────────────┤
# │ Mean difference: +0.850 points
# │ 95% CI: [0.472, 1.228]
# │ Effect size: 1.15 (large)
# │
# │ ✓ Statistically significant (p=0.0001)
# └─────────────────────────────────────────────────────────────┘
#
# 📈 Conclusion: v2-improved performs significantly BETTER than v1-baseline

# Generate batch report
npm run bench report --label "v1-baseline"

# Show image URLs for manual review
npm run bench report --label "v1-baseline" --urls
```

## Notes

- The compare command requires both batches to have completed evaluations
- Sample size warnings appear when n < 30 (statistical significance may be unreliable)
- The report command shows cost breakdown for both generation and evaluation
- URLs can be used for manual visual inspection of results
