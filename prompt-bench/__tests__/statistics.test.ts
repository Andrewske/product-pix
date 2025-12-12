import {
  mean,
  variance,
  stdDev,
  standardError,
  summarize,
  welchTTest,
  checkSampleSize,
  getScoreDistribution,
  formatComparison,
  formatReport,
  MIN_SAMPLES_FOR_SIGNIFICANCE,
  MIN_SAMPLES_FOR_COMPARISON,
  SIGNIFICANCE_THRESHOLD,
  type ComparisonSummary,
  type BatchReport,
} from '@bench/core/statistics';

describe('statistics module', () => {
  describe('constants', () => {
    it('has correct default values', () => {
      expect(MIN_SAMPLES_FOR_SIGNIFICANCE).toBe(30);
      expect(MIN_SAMPLES_FOR_COMPARISON).toBe(10);
      expect(SIGNIFICANCE_THRESHOLD).toBe(0.05);
    });
  });

  describe('mean', () => {
    it('calculates mean of positive numbers', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('calculates mean with decimals', () => {
      expect(mean([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
    });

    it('calculates mean with negative numbers', () => {
      expect(mean([-1, 0, 1])).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(mean([])).toBe(0);
    });

    it('returns the value for single element', () => {
      expect(mean([42])).toBe(42);
    });

    it('handles large numbers', () => {
      expect(mean([1000000, 2000000, 3000000])).toBe(2000000);
    });
  });

  describe('variance', () => {
    it('calculates sample variance', () => {
      // Sample variance of [2,4,4,4,5,5,7,9] with mean 5
      // Sum of squared deviations: 9+1+1+1+0+0+4+16 = 32
      // Sample variance = 32/7 = 4.571...
      expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4.571, 2);
    });

    it('returns 0 for single element', () => {
      expect(variance([42])).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(variance([])).toBe(0);
    });

    it('returns 0 for identical values', () => {
      expect(variance([5, 5, 5, 5])).toBe(0);
    });

    it('uses provided mean if given', () => {
      const values = [2, 4, 6];
      const precomputedMean = 4;
      expect(variance(values, precomputedMean)).toBeCloseTo(4, 5);
    });

    it('handles two elements', () => {
      // Sample variance of [0, 2]: mean=1, deviations=[-1,1], sum=2, variance=2/1=2
      expect(variance([0, 2])).toBe(2);
    });
  });

  describe('stdDev', () => {
    it('calculates standard deviation', () => {
      // std dev is sqrt of variance
      expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
    });

    it('returns 0 for single element', () => {
      expect(stdDev([42])).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(stdDev([])).toBe(0);
    });

    it('returns 0 for identical values', () => {
      expect(stdDev([7, 7, 7])).toBe(0);
    });

    it('uses provided mean if given', () => {
      const values = [1, 3];
      const precomputedMean = 2;
      // variance = ((1-2)^2 + (3-2)^2) / 1 = 2
      // stdDev = sqrt(2) = 1.414...
      expect(stdDev(values, precomputedMean)).toBeCloseTo(1.414, 2);
    });
  });

  describe('standardError', () => {
    it('calculates standard error of the mean', () => {
      // SE = stdDev / sqrt(n)
      const values = [2, 4, 4, 4, 5, 5, 7, 9]; // n=8
      const sd = stdDev(values);
      const expected = sd / Math.sqrt(8);
      expect(standardError(values)).toBeCloseTo(expected, 5);
    });

    it('returns 0 for single element', () => {
      expect(standardError([42])).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(standardError([])).toBe(0);
    });
  });

  describe('summarize', () => {
    it('returns correct summary for standard array', () => {
      const result = summarize([1, 2, 3, 4, 5]);

      expect(result.n).toBe(5);
      expect(result.mean).toBe(3);
      expect(result.min).toBe(1);
      expect(result.max).toBe(5);
      expect(result.median).toBe(3);
      expect(result.stdDev).toBeCloseTo(1.581, 2);
    });

    it('calculates median for even length array', () => {
      const result = summarize([1, 2, 3, 4]);

      expect(result.median).toBe(2.5);
    });

    it('handles empty array', () => {
      const result = summarize([]);

      expect(result.n).toBe(0);
      expect(result.mean).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.median).toBe(0);
    });

    it('handles single element', () => {
      const result = summarize([7]);

      expect(result.n).toBe(1);
      expect(result.mean).toBe(7);
      expect(result.min).toBe(7);
      expect(result.max).toBe(7);
      expect(result.median).toBe(7);
      expect(result.stdDev).toBe(0);
    });

    it('handles unsorted input', () => {
      const result = summarize([5, 1, 3, 2, 4]);

      expect(result.min).toBe(1);
      expect(result.max).toBe(5);
      expect(result.median).toBe(3);
    });

    it('handles identical values', () => {
      const result = summarize([5, 5, 5, 5]);

      expect(result.mean).toBe(5);
      expect(result.stdDev).toBe(0);
      expect(result.min).toBe(5);
      expect(result.max).toBe(5);
    });

    it('handles decimal values', () => {
      const result = summarize([1.5, 2.5, 3.5]);

      expect(result.mean).toBeCloseTo(2.5);
      expect(result.median).toBe(2.5);
    });
  });

  describe('welchTTest', () => {
    it('detects significant difference between groups', () => {
      // Two clearly different distributions
      const a = [1, 2, 2, 3, 3, 3, 4, 4, 5];
      const b = [6, 7, 7, 8, 8, 8, 9, 9, 10];
      const result = welchTTest(a, b);

      expect(result.significant).toBe(true);
      expect(result.pValue).toBeLessThan(SIGNIFICANCE_THRESHOLD);
      expect(result.meanDiff).toBeGreaterThan(0); // B has higher mean
    });

    it('returns non-significant for similar groups', () => {
      const a = [5, 5, 5, 5, 5];
      const b = [5.1, 4.9, 5.0, 5.1, 4.9];
      const result = welchTTest(a, b);

      expect(result.significant).toBe(false);
      expect(result.pValue).toBeGreaterThan(SIGNIFICANCE_THRESHOLD);
    });

    it('handles identical samples', () => {
      const a = [5, 5, 5, 5];
      const b = [5, 5, 5, 5];
      const result = welchTTest(a, b);

      expect(result.significant).toBe(false);
      expect(result.pValue).toBe(1);
      expect(result.tStatistic).toBe(0);
      expect(result.meanDiff).toBe(0);
    });

    it('handles zero variance safely', () => {
      const a = [5, 5, 5];
      const b = [5, 5, 5];

      expect(() => welchTTest(a, b)).not.toThrow();
      const result = welchTTest(a, b);
      expect(result.pValue).toBe(1);
      expect(result.effectSize).toBe(0);
      expect(result.effectInterpretation).toBe('negligible');
    });

    it('calculates correct mean difference (B - A)', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      const result = welchTTest(a, b);

      expect(result.meanDiff).toBeCloseTo(3); // 5 - 2 = 3
    });

    it('provides confidence interval', () => {
      const a = [1, 2, 3, 4, 5];
      const b = [6, 7, 8, 9, 10];
      const result = welchTTest(a, b);

      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(result.meanDiff);
      expect(result.confidenceInterval[1]).toBeGreaterThan(result.meanDiff);
    });

    it('categorizes effect size correctly', () => {
      // Negligible effect (d < 0.2)
      const negligible = welchTTest([5, 5, 5, 5], [5.05, 5.05, 5.05, 5.05]);
      expect(negligible.effectInterpretation).toBe('negligible');

      // Large effect (d >= 0.8)
      const large = welchTTest([1, 2, 3], [10, 11, 12]);
      expect(large.effectInterpretation).toBe('large');
    });

    it('handles different sample sizes', () => {
      const a = [1, 2, 3];
      const b = [5, 6, 7, 8, 9, 10];

      expect(() => welchTTest(a, b)).not.toThrow();
      const result = welchTTest(a, b);
      expect(result.meanDiff).toBeGreaterThan(0);
    });

    it('handles minimum sample sizes', () => {
      const a = [1, 2];
      const b = [5, 6];

      expect(() => welchTTest(a, b)).not.toThrow();
      const result = welchTTest(a, b);
      expect(result.tStatistic).toBeDefined();
    });
  });

  describe('checkSampleSize', () => {
    it('returns inadequate for very small samples', () => {
      const check = checkSampleSize(5);

      expect(check.adequate).toBe(false);
      expect(check.warning).toBeDefined();
      expect(check.warning).toContain('5');
      expect(check.recommendation).toContain('5'); // Need 5 more
    });

    it('returns adequate with warning for medium samples', () => {
      const check = checkSampleSize(15);

      expect(check.adequate).toBe(true);
      expect(check.warning).toBeDefined();
      expect(check.warning).toContain('15');
      expect(check.recommendation).toBeDefined();
    });

    it('returns adequate without warning for large samples', () => {
      const check = checkSampleSize(50);

      expect(check.adequate).toBe(true);
      expect(check.warning).toBeUndefined();
      expect(check.recommendation).toBeUndefined();
    });

    it('returns adequate for exact minimum comparison threshold', () => {
      const check = checkSampleSize(MIN_SAMPLES_FOR_COMPARISON);

      expect(check.adequate).toBe(true);
    });

    it('returns inadequate just below minimum', () => {
      const check = checkSampleSize(MIN_SAMPLES_FOR_COMPARISON - 1);

      expect(check.adequate).toBe(false);
    });

    it('returns adequate without warning at significance threshold', () => {
      const check = checkSampleSize(MIN_SAMPLES_FOR_SIGNIFICANCE);

      expect(check.adequate).toBe(true);
      expect(check.warning).toBeUndefined();
    });
  });

  describe('getScoreDistribution', () => {
    it('categorizes scores correctly', () => {
      const dist = getScoreDistribution([2, 5, 7, 9, 10]);

      expect(dist['1-3 (Poor)']).toBe(1);
      expect(dist['4-5 (Below Avg)']).toBe(1);
      expect(dist['6-7 (Average)']).toBe(1);
      expect(dist['8-9 (Good)']).toBe(1);
      expect(dist['10 (Excellent)']).toBe(1);
    });

    it('handles empty array', () => {
      const dist = getScoreDistribution([]);

      expect(dist['1-3 (Poor)']).toBe(0);
      expect(dist['4-5 (Below Avg)']).toBe(0);
      expect(dist['6-7 (Average)']).toBe(0);
      expect(dist['8-9 (Good)']).toBe(0);
      expect(dist['10 (Excellent)']).toBe(0);
    });

    it('handles all scores in one category', () => {
      const dist = getScoreDistribution([1, 2, 3, 2, 1]);

      expect(dist['1-3 (Poor)']).toBe(5);
      expect(dist['4-5 (Below Avg)']).toBe(0);
    });

    it('handles boundary values correctly', () => {
      // Test exact boundaries
      const dist = getScoreDistribution([3, 5, 7, 9, 10]);

      expect(dist['1-3 (Poor)']).toBe(1);     // 3 is in Poor
      expect(dist['4-5 (Below Avg)']).toBe(1); // 5 is in Below Avg
      expect(dist['6-7 (Average)']).toBe(1);   // 7 is in Average
      expect(dist['8-9 (Good)']).toBe(1);      // 9 is in Good
      expect(dist['10 (Excellent)']).toBe(1);  // 10 is Excellent
    });

    it('handles decimal scores', () => {
      const dist = getScoreDistribution([3.5, 5.5, 7.5, 9.5]);

      expect(dist['1-3 (Poor)']).toBe(0);
      expect(dist['4-5 (Below Avg)']).toBe(1); // 3.5 > 3, so it's 4-5
      expect(dist['6-7 (Average)']).toBe(1);   // 5.5 > 5
      expect(dist['8-9 (Good)']).toBe(2);      // 7.5 > 7, 9.5 < 10
    });
  });

  describe('formatComparison', () => {
    it('formats comparison summary with significant difference', () => {
      const summary: ComparisonSummary = {
        baseline: {
          label: 'v1',
          stats: summarize([3, 4, 5, 4, 3]),
        },
        candidate: {
          label: 'v2',
          stats: summarize([7, 8, 9, 8, 7]),
        },
        test: welchTTest([3, 4, 5, 4, 3], [7, 8, 9, 8, 7]),
      };

      const output = formatComparison(summary);

      expect(output).toContain('v1');
      expect(output).toContain('v2');
      expect(output).toContain('Baseline');
      expect(output).toContain('Candidate');
      expect(output).toContain('Mean difference');
      expect(output).toContain('95% CI');
      expect(output).toContain('Effect size');
    });

    it('includes sample warning when provided', () => {
      const summary: ComparisonSummary = {
        baseline: {
          label: 'A',
          stats: summarize([5, 5, 5]),
        },
        candidate: {
          label: 'B',
          stats: summarize([5, 5, 5]),
        },
        test: welchTTest([5, 5, 5], [5, 5, 5]),
        sampleWarning: 'Small sample size',
      };

      const output = formatComparison(summary);

      expect(output).toContain('Warning');
      expect(output).toContain('Small sample size');
    });

    it('shows appropriate conclusion for better candidate', () => {
      const summary: ComparisonSummary = {
        baseline: {
          label: 'old',
          stats: summarize([1, 2, 3]),
        },
        candidate: {
          label: 'new',
          stats: summarize([8, 9, 10]),
        },
        test: welchTTest([1, 2, 3], [8, 9, 10]),
      };

      const output = formatComparison(summary);

      expect(output).toContain('BETTER');
    });

    it('shows appropriate conclusion for worse candidate', () => {
      const summary: ComparisonSummary = {
        baseline: {
          label: 'old',
          stats: summarize([8, 9, 10]),
        },
        candidate: {
          label: 'new',
          stats: summarize([1, 2, 3]),
        },
        test: welchTTest([8, 9, 10], [1, 2, 3]),
      };

      const output = formatComparison(summary);

      expect(output).toContain('WORSE');
    });

    it('shows no significant difference conclusion', () => {
      const summary: ComparisonSummary = {
        baseline: {
          label: 'A',
          stats: summarize([5, 5, 5, 5]),
        },
        candidate: {
          label: 'B',
          stats: summarize([5, 5, 5, 5]),
        },
        test: welchTTest([5, 5, 5, 5], [5, 5, 5, 5]),
      };

      const output = formatComparison(summary);

      expect(output).toContain('No significant difference');
    });
  });

  describe('formatReport', () => {
    it('formats batch report with all sections', () => {
      const report: BatchReport = {
        label: 'test-batch',
        stats: summarize([5, 6, 7, 8, 9]),
        scoreDistribution: getScoreDistribution([5, 6, 7, 8, 9]),
        topScores: [
          { id: '1', score: 9, prompt: 'Best prompt with high quality results' },
          { id: '2', score: 8, prompt: 'Second best prompt' },
          { id: '3', score: 7, prompt: 'Third best prompt' },
        ],
        bottomScores: [
          { id: '4', score: 5, prompt: 'Worst prompt with issues' },
          { id: '5', score: 6, prompt: 'Second worst prompt' },
        ],
      };

      const output = formatReport(report);

      expect(output).toContain('test-batch');
      expect(output).toContain('Summary');
      expect(output).toContain('Total tests: 5');
      expect(output).toContain('Mean score');
      expect(output).toContain('Score Distribution');
      expect(output).toContain('Top 3 Scores');
      expect(output).toContain('Bottom 3 Scores');
    });

    it('shows score distribution bars', () => {
      const report: BatchReport = {
        label: 'test',
        stats: summarize([10, 10, 10, 10, 10]),
        scoreDistribution: getScoreDistribution([10, 10, 10, 10, 10]),
        topScores: [{ id: '1', score: 10, prompt: 'Perfect score prompt' }],
        bottomScores: [{ id: '1', score: 10, prompt: 'Perfect score prompt' }],
      };

      const output = formatReport(report);

      // Should have bar characters for the distribution
      expect(output).toContain('10 (Excellent)');
    });

    it('truncates long prompts in top/bottom scores', () => {
      const longPrompt = 'A'.repeat(100);
      const report: BatchReport = {
        label: 'test',
        stats: summarize([5]),
        scoreDistribution: getScoreDistribution([5]),
        topScores: [{ id: '1', score: 5, prompt: longPrompt }],
        bottomScores: [{ id: '1', score: 5, prompt: longPrompt }],
      };

      const output = formatReport(report);

      // Verify prompts are truncated (the format shows first 50 chars + '...')
      expect(output).toContain('...');
      // Full prompt (100 chars) should not appear - only truncated (50 chars + ...)
      expect(output).not.toContain(longPrompt);
    });
  });
});