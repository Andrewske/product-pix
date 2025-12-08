import {
  selectParents,
  getVariationTemplateData,
} from '@bench/core/evolution';
import type { IterationState, PopulationEntry } from '@bench/core/iteration-types';

describe('evolution', () => {
  describe('selectParents', () => {
    it('selects from population using tournament', () => {
      const population: PopulationEntry[] = [
        { variationId: 'a', fitness: 0.9, generation: 1 },
        { variationId: 'b', fitness: 0.7, generation: 1 },
        { variationId: 'c', fitness: 0.5, generation: 1 },
        { variationId: 'd', fitness: 0.3, generation: 1 },
      ];

      const parents = selectParents(population, 2);

      expect(parents.length).toBe(2);
      expect(parents.every(p => ['a', 'b', 'c', 'd'].includes(p))).toBe(true);
    });

    it('favors higher fitness', () => {
      const population: PopulationEntry[] = [
        { variationId: 'high', fitness: 0.99, generation: 1 },
        { variationId: 'low', fitness: 0.01, generation: 1 },
      ];

      // Run multiple times to verify bias
      const selections = Array(100).fill(null).map(() => selectParents(population, 1)[0]);
      const highCount = selections.filter(s => s === 'high').length;

      expect(highCount).toBeGreaterThan(70); // Should heavily favor 'high'
    });
  });

  describe('getVariationTemplateData', () => {
    it('returns template data for existing variation', () => {
      const mockState: IterationState = {
        sessionId: 'test',
        templateSlug: 'test',
        templateVersion: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        generations: [
          {
            generation: 1,
            batchLabel: 'test',
            variations: [
              {
                id: 'var-1',
                parentIds: [],
                source: 'user',
                templateData: {
                  subject: 'Test subject',
                  background: 'white',
                  lighting: 'soft',
                  camera: 'dslr',
                  style: 'product',
                  quality: 'high',
                  negative: 'blur',
                },
                rationale: 'test',
                confidence: 0.8,
              },
            ],
          },
        ],
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
      };

      const result = getVariationTemplateData('var-1', mockState);

      expect(result).toEqual({
        subject: 'Test subject',
        background: 'white',
        lighting: 'soft',
        camera: 'dslr',
        style: 'product',
        quality: 'high',
        negative: 'blur',
      });
    });

    it('returns null for non-existent variation', () => {
      const mockState: IterationState = {
        sessionId: 'test',
        templateSlug: 'test',
        templateVersion: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
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
      };

      const result = getVariationTemplateData('non-existent', mockState);

      expect(result).toBeNull();
    });
  });

  // Note: evolvePopulation tests would require mocking the Anthropic API
  // Consider using dependency injection for testability in the future
});