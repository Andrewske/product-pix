import {
  checkConvergence,
  calculateImprovementRate,
  estimateGenerationsToTarget,
} from '@bench/core/convergence';
import type { IterationState } from '@bench/core/iteration-types';

const createMockState = (overrides: Partial<IterationState> = {}): IterationState => ({
  sessionId: 'test-session',
  templateSlug: 'test-template',
  templateVersion: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  generations: [],
  currentPopulation: [],
  scoreHistory: [],
  config: {
    populationSize: 8,
    eliteCount: 2,
    mutationRate: 0.6,
    crossoverRate: 0.3,
    wildRate: 0.1,
    convergenceThreshold: 0.05,
    maxGenerations: 10,
  },
  ...overrides,
});

describe('convergence', () => {
  describe('checkConvergence', () => {
    it('returns not converged for empty state', () => {
      const state = createMockState();
      const result = checkConvergence(state);

      expect(result.converged).toBe(false);
    });

    it('detects max generations reached', () => {
      const state = createMockState({
        generations: Array(10).fill({ generation: 0, batchLabel: '', variations: [] }),
        scoreHistory: Array(10).fill({ generation: 0, best: 8, mean: 7.5, stdDev: 0.5 }),
      });

      const result = checkConvergence(state);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('max_generations');
    });

    it('detects stddev threshold', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 9.0, mean: 8.8, stdDev: 0.03 }, // Below 0.05 threshold
        ],
      });

      const result = checkConvergence(state);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('stddev_threshold');
    });

    it('detects plateau', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 8.5, mean: 8.0, stdDev: 0.3 },
          { generation: 2, best: 8.5, mean: 8.1, stdDev: 0.25 },
          { generation: 3, best: 8.5, mean: 8.1, stdDev: 0.2 },
          { generation: 4, best: 8.5, mean: 8.1, stdDev: 0.15 }, // No improvement in best for 3 gens
        ],
      });

      const result = checkConvergence(state);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('plateau');
    });

    it('detects target reached', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 9.5, mean: 9.0, stdDev: 0.3 },
        ],
      });

      const result = checkConvergence(state, 9.5);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('target_reached');
    });
  });

  describe('calculateImprovementRate', () => {
    it('calculates average improvement', () => {
      const history = [
        { generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 },
        { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
        { generation: 3, best: 8.0, mean: 7.5, stdDev: 0.3 },
      ];

      const rate = calculateImprovementRate(history);

      expect(rate).toBeCloseTo(0.5, 2); // 0.5 improvement per generation
    });

    it('returns 0 for insufficient history', () => {
      const history = [{ generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 }];

      const rate = calculateImprovementRate(history);

      expect(rate).toBe(0);
    });

    it('handles regression', () => {
      const history = [
        { generation: 1, best: 8.0, mean: 7.5, stdDev: 0.5 },
        { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
        { generation: 3, best: 7.0, mean: 6.5, stdDev: 0.3 },
      ];

      const rate = calculateImprovementRate(history);

      expect(rate).toBeCloseTo(-0.5, 2); // -0.5 regression per generation
    });
  });

  describe('estimateGenerationsToTarget', () => {
    it('estimates based on improvement rate', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 },
          { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
          { generation: 3, best: 8.0, mean: 7.5, stdDev: 0.3 },
        ],
      });

      const estimate = estimateGenerationsToTarget(state, 9.5);

      expect(estimate).toBe(3); // Need 1.5 more, at 0.5/gen = 3 generations
    });

    it('returns null if regressing', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 8.0, mean: 7.5, stdDev: 0.5 },
          { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
          { generation: 3, best: 7.0, mean: 6.5, stdDev: 0.3 },
        ],
      });

      const estimate = estimateGenerationsToTarget(state, 9.0);

      expect(estimate).toBeNull();
    });

    it('returns null if no improvement rate available', () => {
      const state = createMockState({
        scoreHistory: [{ generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 }],
      });

      const estimate = estimateGenerationsToTarget(state, 9.0);

      expect(estimate).toBeNull();
    });
  });
});