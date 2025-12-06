# Step 11: Create Statistics Module for A/B Testing

## Objective

Create the statistics module that provides statistical analysis tools for comparing batch results, including t-tests and sample size validation.

## Prerequisites

- Steps 01-10 completed

## Files to Create

### `src/lib/prompts/statistics.ts`

```typescript
// =============================================================================
// Constants
// =============================================================================

/**
 * Minimum samples recommended for statistical significance
 */
export const MIN_SAMPLES_FOR_SIGNIFICANCE = 30;

/**
 * Minimum samples required for any comparison
 */
export const MIN_SAMPLES_FOR_COMPARISON = 10;

/**
 * P-value threshold for statistical significance
 */
export const SIGNIFICANCE_THRESHOLD = 0.05;

// =============================================================================
// Sample Size Validation
// =============================================================================

export interface SampleSizeCheck {
  adequate: boolean;
  warning?: string;
  recommendation?: string;
}

/**
 * Check if sample size is adequate for statistical analysis
 */
export const checkSampleSize = (n: number): SampleSizeCheck => {
  if (n < MIN_SAMPLES_FOR_COMPARISON) {
    return {
      adequate: false,
      warning: `Only ${n} samples - need at least ${MIN_SAMPLES_FOR_COMPARISON} for any comparison`,
      recommendation: `Add ${MIN_SAMPLES_FOR_COMPARISON - n} more tests to enable comparison`,
    };
  }

  if (n < MIN_SAMPLES_FOR_SIGNIFICANCE) {
    return {
      adequate: true,
      warning: `${n} samples may not achieve statistical significance`,
      recommendation: `Consider adding ${MIN_SAMPLES_FOR_SIGNIFICANCE - n} more tests for reliable results`,
    };
  }

  return { adequate: true };
};

// =============================================================================
// Basic Statistics
// =============================================================================

/**
 * Calculate mean of an array
 */
export const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Calculate sample variance
 */
export const variance = (values: number[], m?: number): number => {
  if (values.length < 2) return 0;
  const avg = m ?? mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length - 1);
};

/**
 * Calculate sample standard deviation
 */
export const stdDev = (values: number[], m?: number): number => {
  return Math.sqrt(variance(values, m));
};

/**
 * Calculate standard error of the mean
 */
export const standardError = (values: number[]): number => {
  if (values.length < 2) return 0;
  return stdDev(values) / Math.sqrt(values.length);
};

/**
 * Calculate summary statistics for an array
 */
export const summarize = (values: number[]): {
  n: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
} => {
  if (values.length === 0) {
    return { n: 0, mean: 0, stdDev: 0, min: 0, max: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const avg = mean(values);
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return {
    n,
    mean: avg,
    stdDev: stdDev(values, avg),
    min: sorted[0],
    max: sorted[n - 1],
    median,
  };
};

// =============================================================================
// Welch's t-test
// =============================================================================

/**
 * Standard normal CDF approximation (Abramowitz and Stegun)
 */
const normalCDF = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1 + sign * y);
};

export interface TTestResult {
  /** T-statistic value */
  tStatistic: number;
  /** Two-tailed p-value */
  pValue: number;
  /** Whether the result is statistically significant at α=0.05 */
  significant: boolean;
  /** Difference in means (B - A) */
  meanDiff: number;
  /** 95% confidence interval for the difference */
  confidenceInterval: [number, number];
  /** Effect size (Cohen's d) */
  effectSize: number;
  /** Interpretation of effect size */
  effectInterpretation: 'negligible' | 'small' | 'medium' | 'large';
}

/**
 * Welch's t-test for comparing two independent samples
 * Does not assume equal variances
 *
 * @param a - Baseline sample (control)
 * @param b - Candidate sample (treatment)
 * @returns Test results with significance and effect size
 */
export const welchTTest = (a: number[], b: number[]): TTestResult => {
  const meanA = mean(a);
  const meanB = mean(b);
  const varA = variance(a, meanA);
  const varB = variance(b, meanB);
  const nA = a.length;
  const nB = b.length;

  // Standard error of the difference
  const se = Math.sqrt(varA / nA + varB / nB);

  // T-statistic
  const t = (meanA - meanB) / se;

  // Approximate p-value using normal distribution (valid for n > 30)
  // For smaller samples, this is conservative
  const p = 2 * (1 - normalCDF(Math.abs(t)));

  // Mean difference (B - A, so positive means B is better)
  const meanDiff = meanB - meanA;

  // 95% confidence interval
  const criticalValue = 1.96; // z-score for 95% CI
  const ci: [number, number] = [
    meanDiff - criticalValue * se,
    meanDiff + criticalValue * se,
  ];

  // Cohen's d effect size
  const pooledStdDev = Math.sqrt(((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2));
  const effectSize = pooledStdDev > 0 ? Math.abs(meanDiff) / pooledStdDev : 0;

  // Interpret effect size
  let effectInterpretation: TTestResult['effectInterpretation'];
  if (effectSize < 0.2) effectInterpretation = 'negligible';
  else if (effectSize < 0.5) effectInterpretation = 'small';
  else if (effectSize < 0.8) effectInterpretation = 'medium';
  else effectInterpretation = 'large';

  return {
    tStatistic: t,
    pValue: p,
    significant: p < SIGNIFICANCE_THRESHOLD,
    meanDiff,
    confidenceInterval: ci,
    effectSize,
    effectInterpretation,
  };
};

// =============================================================================
// Comparison Formatting
// =============================================================================

export interface ComparisonSummary {
  baseline: {
    label: string;
    stats: ReturnType<typeof summarize>;
  };
  candidate: {
    label: string;
    stats: ReturnType<typeof summarize>;
  };
  test: TTestResult;
  sampleWarning?: string;
}

/**
 * Format a comparison result for CLI output
 */
export const formatComparison = (summary: ComparisonSummary): string => {
  const { baseline, candidate, test, sampleWarning } = summary;

  const direction = test.meanDiff > 0 ? '+' : '';
  const significanceNote = test.significant
    ? `✓ Statistically significant (p=${test.pValue.toFixed(4)})`
    : `✗ Not statistically significant (p=${test.pValue.toFixed(4)})`;

  let output = `
┌─────────────────────────────────────────────────────────────┐
│ A/B Comparison: ${baseline.label} vs ${candidate.label}
├─────────────────────────────────────────────────────────────┤
│ Baseline (${baseline.label}):
│   n=${baseline.stats.n}  mean=${baseline.stats.mean.toFixed(2)}  std=${baseline.stats.stdDev.toFixed(2)}
│   range: [${baseline.stats.min.toFixed(1)}, ${baseline.stats.max.toFixed(1)}]
│
│ Candidate (${candidate.label}):
│   n=${candidate.stats.n}  mean=${candidate.stats.mean.toFixed(2)}  std=${candidate.stats.stdDev.toFixed(2)}
│   range: [${candidate.stats.min.toFixed(1)}, ${candidate.stats.max.toFixed(1)}]
├─────────────────────────────────────────────────────────────┤
│ Mean difference: ${direction}${test.meanDiff.toFixed(3)} points
│ 95% CI: [${test.confidenceInterval[0].toFixed(3)}, ${test.confidenceInterval[1].toFixed(3)}]
│ Effect size: ${test.effectSize.toFixed(2)} (${test.effectInterpretation})
│
│ ${significanceNote}
└─────────────────────────────────────────────────────────────┘`;

  if (sampleWarning) {
    output += `\n⚠️  Warning: ${sampleWarning}`;
  }

  // Add interpretation
  if (test.significant) {
    if (test.meanDiff > 0) {
      output += `\n\n📈 Conclusion: ${candidate.label} performs significantly BETTER than ${baseline.label}`;
    } else {
      output += `\n\n📉 Conclusion: ${candidate.label} performs significantly WORSE than ${baseline.label}`;
    }
  } else {
    output += `\n\n📊 Conclusion: No significant difference detected between batches`;
  }

  return output;
};

// =============================================================================
// Report Formatting
// =============================================================================

export interface BatchReport {
  label: string;
  stats: ReturnType<typeof summarize>;
  scoreDistribution: Record<string, number>;
  topScores: Array<{ id: string; score: number; prompt: string }>;
  bottomScores: Array<{ id: string; score: number; prompt: string }>;
}

/**
 * Format a batch report for CLI output
 */
export const formatReport = (report: BatchReport): string => {
  const { label, stats, scoreDistribution, topScores, bottomScores } = report;

  let output = `
┌─────────────────────────────────────────────────────────────┐
│ Batch Report: ${label}
├─────────────────────────────────────────────────────────────┤
│ Summary:
│   Total tests: ${stats.n}
│   Mean score: ${stats.mean.toFixed(2)}/10
│   Std deviation: ${stats.stdDev.toFixed(2)}
│   Range: [${stats.min.toFixed(1)}, ${stats.max.toFixed(1)}]
│   Median: ${stats.median.toFixed(1)}
├─────────────────────────────────────────────────────────────┤
│ Score Distribution:`;

  for (const [range, count] of Object.entries(scoreDistribution)) {
    const bar = '█'.repeat(Math.ceil(count / stats.n * 20));
    output += `\n│   ${range}: ${bar} ${count}`;
  }

  output += `
├─────────────────────────────────────────────────────────────┤
│ Top 3 Scores:`;

  for (const item of topScores.slice(0, 3)) {
    output += `\n│   ${item.score.toFixed(1)}/10 - ${item.prompt.slice(0, 50)}...`;
  }

  output += `
├─────────────────────────────────────────────────────────────┤
│ Bottom 3 Scores:`;

  for (const item of bottomScores.slice(0, 3)) {
    output += `\n│   ${item.score.toFixed(1)}/10 - ${item.prompt.slice(0, 50)}...`;
  }

  output += `
└─────────────────────────────────────────────────────────────┘`;

  return output;
};

/**
 * Categorize scores into distribution buckets
 */
export const getScoreDistribution = (scores: number[]): Record<string, number> => {
  const distribution: Record<string, number> = {
    '1-3 (Poor)': 0,
    '4-5 (Below Avg)': 0,
    '6-7 (Average)': 0,
    '8-9 (Good)': 0,
    '10 (Excellent)': 0,
  };

  for (const score of scores) {
    if (score <= 3) distribution['1-3 (Poor)']++;
    else if (score <= 5) distribution['4-5 (Below Avg)']++;
    else if (score <= 7) distribution['6-7 (Average)']++;
    else if (score < 10) distribution['8-9 (Good)']++;
    else distribution['10 (Excellent)']++;
  }

  return distribution;
};
```

## Implementation Steps

1. Create `src/lib/prompts/statistics.ts` with the content above
2. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] File exists at `src/lib/prompts/statistics.ts`
- [ ] All code compiles without TypeScript errors
- [ ] `checkSampleSize` validates sample adequacy with appropriate warnings
- [ ] `mean`, `variance`, `stdDev` calculate basic statistics correctly
- [ ] `summarize` returns complete summary statistics
- [ ] `welchTTest` performs Welch's t-test correctly
- [ ] `welchTTest` returns p-value, significance, confidence interval, effect size
- [ ] `formatComparison` produces readable CLI output
- [ ] `formatReport` produces readable batch summary
- [ ] `getScoreDistribution` categorizes scores into buckets

## Testing

Manual verification:

```typescript
import { welchTTest, formatComparison, summarize, checkSampleSize } from './statistics';

// Sample data
const baseline = [7.2, 7.5, 7.1, 7.8, 7.3, 7.6, 7.4, 7.2, 7.7, 7.5];
const candidate = [8.1, 8.3, 7.9, 8.5, 8.2, 8.0, 8.4, 8.1, 8.3, 8.2];

// Run test
const result = welchTTest(baseline, candidate);
console.log(result);
// Expected: significant = true, meanDiff ≈ 0.8, effectSize ≈ large

// Format output
const summary = {
  baseline: { label: 'v1-baseline', stats: summarize(baseline) },
  candidate: { label: 'v2-improved', stats: summarize(candidate) },
  test: result,
  sampleWarning: checkSampleSize(10).warning,
};
console.log(formatComparison(summary));
```

## Notes

- Uses Welch's t-test which doesn't assume equal variances (more robust)
- P-value approximation uses normal distribution (accurate for n > 30)
- Effect size uses Cohen's d with interpretation guidelines
- Formatting uses box-drawing characters for clean CLI output
- Distribution buckets are designed for 1-10 scoring scale
