import {
  EvaluationBreakdown,
  ProductScore,
  TestResults,
} from '@bench/core/improvement-types';

describe('improvement-types', () => {
  describe('EvaluationBreakdown', () => {
    it('validates complete evaluation breakdown', () => {
      const breakdown: EvaluationBreakdown = {
        composition: 8.5,
        lighting: 7.2,
        productVisibility: 9.1,
        backgroundQuality: 8.8,
        professionalQuality: 8.3,
        promptAdherence: 9.5,
      };

      expect(breakdown.composition).toBe(8.5);
      expect(breakdown.lighting).toBe(7.2);
      expect(breakdown.productVisibility).toBe(9.1);
      expect(breakdown.backgroundQuality).toBe(8.8);
      expect(breakdown.professionalQuality).toBe(8.3);
      expect(breakdown.promptAdherence).toBe(9.5);
    });

    it('validates minimum scores', () => {
      const breakdown: EvaluationBreakdown = {
        composition: 1,
        lighting: 1,
        productVisibility: 1,
        backgroundQuality: 1,
        professionalQuality: 1,
        promptAdherence: 1,
      };

      expect(breakdown.composition).toBe(1);
    });

    it('validates maximum scores', () => {
      const breakdown: EvaluationBreakdown = {
        composition: 10,
        lighting: 10,
        productVisibility: 10,
        backgroundQuality: 10,
        professionalQuality: 10,
        promptAdherence: 10,
      };

      expect(breakdown.promptAdherence).toBe(10);
    });
  });

  describe('ProductScore', () => {
    it('validates minimal product score', () => {
      const score: ProductScore = {
        productId: 'product-123',
        score: 8.5,
      };

      expect(score.productId).toBe('product-123');
      expect(score.score).toBe(8.5);
      expect(score.breakdown).toBeUndefined();
      expect(score.reasoning).toBeUndefined();
      expect(score.suggestions).toBeUndefined();
    });

    it('validates complete product score with all optional fields', () => {
      const score: ProductScore = {
        productId: 'product-456',
        score: 7.8,
        breakdown: {
          composition: 8.0,
          lighting: 7.5,
          productVisibility: 9.0,
          backgroundQuality: 7.0,
          professionalQuality: 8.5,
          promptAdherence: 8.2,
        },
        reasoning: 'Good composition but lighting could be improved',
        suggestions: [
          'Increase key light intensity',
          'Add fill light from the left',
          'Adjust white balance',
        ],
      };

      expect(score.productId).toBe('product-456');
      expect(score.score).toBe(7.8);
      expect(score.breakdown).toBeDefined();
      expect(score.breakdown?.composition).toBe(8.0);
      expect(score.reasoning).toBe('Good composition but lighting could be improved');
      expect(score.suggestions).toHaveLength(3);
      expect(score.suggestions?.[0]).toBe('Increase key light intensity');
    });

    it('validates product score with partial breakdown', () => {
      const score: ProductScore = {
        productId: 'product-789',
        score: 9.2,
        breakdown: {
          composition: 9.5,
          lighting: 8.8,
          productVisibility: 9.8,
          backgroundQuality: 9.0,
          professionalQuality: 9.2,
          promptAdherence: 9.6,
        },
        reasoning: 'Excellent overall quality',
      };

      expect(score.productId).toBe('product-789');
      expect(score.score).toBe(9.2);
      expect(score.breakdown?.promptAdherence).toBe(9.6);
      expect(score.suggestions).toBeUndefined();
    });
  });

  describe('TestResults', () => {
    it('validates minimal test results', () => {
      const results: TestResults = {
        scores: [8.5, 7.2, 9.1],
        meanScore: 8.27,
        medianScore: 8.5,
        minScore: 7.2,
        maxScore: 9.1,
        productScores: [
          { productId: 'prod-1', score: 8.5 },
          { productId: 'prod-2', score: 7.2 },
          { productId: 'prod-3', score: 9.1 },
        ],
      };

      expect(results.scores).toEqual([8.5, 7.2, 9.1]);
      expect(results.meanScore).toBe(8.27);
      expect(results.productScores).toHaveLength(3);
      expect(results.dimensionAverages).toBeUndefined();
    });

    it('validates complete test results with dimension averages', () => {
      const results: TestResults = {
        scores: [8.5, 7.2, 9.1, 8.8],
        meanScore: 8.4,
        medianScore: 8.65,
        minScore: 7.2,
        maxScore: 9.1,
        productScores: [
          {
            productId: 'prod-1',
            score: 8.5,
            breakdown: {
              composition: 8.5,
              lighting: 8.0,
              productVisibility: 9.0,
              backgroundQuality: 8.5,
              professionalQuality: 8.5,
              promptAdherence: 9.0,
            },
            reasoning: 'Strong composition and product visibility',
            suggestions: ['Minor lighting adjustment needed'],
          },
          {
            productId: 'prod-2',
            score: 7.2,
            breakdown: {
              composition: 7.0,
              lighting: 6.5,
              productVisibility: 8.0,
              backgroundQuality: 7.5,
              professionalQuality: 7.0,
              promptAdherence: 7.5,
            },
            reasoning: 'Lighting needs improvement',
            suggestions: ['Increase overall brightness', 'Add rim lighting'],
          },
        ],
        dimensionAverages: {
          composition: 7.75,
          lighting: 7.25,
          productVisibility: 8.5,
          backgroundQuality: 8.0,
          professionalQuality: 7.75,
          promptAdherence: 8.25,
        },
      };

      expect(results.scores).toHaveLength(4);
      expect(results.productScores).toHaveLength(2);
      expect(results.dimensionAverages).toBeDefined();
      expect(results.dimensionAverages?.composition).toBe(7.75);
      expect(results.dimensionAverages?.lighting).toBe(7.25);
      expect(results.productScores[0].breakdown?.composition).toBe(8.5);
      expect(results.productScores[1].suggestions).toHaveLength(2);
    });

    it('validates test results with mixed product scores', () => {
      const results: TestResults = {
        scores: [9.0, 6.5, 8.7],
        meanScore: 8.07,
        medianScore: 8.7,
        minScore: 6.5,
        maxScore: 9.0,
        productScores: [
          { productId: 'prod-1', score: 9.0 },
          {
            productId: 'prod-2',
            score: 6.5,
            reasoning: 'Poor lighting and composition',
          },
          {
            productId: 'prod-3',
            score: 8.7,
            suggestions: ['Improve background consistency'],
          },
        ],
        dimensionAverages: {
          composition: 7.2,
          lighting: 6.8,
          productVisibility: 8.9,
          backgroundQuality: 7.5,
          professionalQuality: 8.1,
          promptAdherence: 8.7,
        },
      };

      expect(results.productScores[0].breakdown).toBeUndefined();
      expect(results.productScores[1].reasoning).toBeDefined();
      expect(results.productScores[2].suggestions).toBeDefined();
      expect(results.dimensionAverages?.backgroundQuality).toBe(7.5);
    });
  });
});