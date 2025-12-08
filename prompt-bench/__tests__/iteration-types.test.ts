import {
  PromptVariationSchema,
  IterationStateSchema,
  IterationConfigSchema,
  MutationTypeSchema,
  VariationSourceSchema,
} from '@bench/core/iteration-types';

describe('iteration-types', () => {
  describe('MutationTypeSchema', () => {
    it('accepts valid mutation types', () => {
      expect(MutationTypeSchema.parse('wording')).toBe('wording');
      expect(MutationTypeSchema.parse('addition')).toBe('addition');
      expect(MutationTypeSchema.parse('removal')).toBe('removal');
      expect(MutationTypeSchema.parse('substitution')).toBe('substitution');
      expect(MutationTypeSchema.parse('emphasis')).toBe('emphasis');
      expect(MutationTypeSchema.parse('wild')).toBe('wild');
    });

    it('rejects invalid mutation types', () => {
      expect(() => MutationTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('VariationSourceSchema', () => {
    it('accepts valid variation sources', () => {
      expect(VariationSourceSchema.parse('mutation')).toBe('mutation');
      expect(VariationSourceSchema.parse('crossover')).toBe('crossover');
      expect(VariationSourceSchema.parse('wild')).toBe('wild');
      expect(VariationSourceSchema.parse('elite')).toBe('elite');
      expect(VariationSourceSchema.parse('user')).toBe('user');
    });

    it('rejects invalid variation sources', () => {
      expect(() => VariationSourceSchema.parse('invalid')).toThrow();
    });
  });

  describe('PromptVariationSchema', () => {
    it('validates complete variation', () => {
      const variation = {
        id: '12345678-1234-1234-8123-123456789abc',
        parentIds: ['87654321-4321-4321-8123-cba987654321'],
        source: 'mutation',
        mutationType: 'wording',
        templateData: {
          subject: 'Test subject',
          background: 'white background',
          lighting: 'soft lighting',
          camera: 'DSLR camera',
          style: 'product photography',
          quality: 'high quality',
          negative: 'blurry, low quality',
        },
        rationale: 'Test rationale',
        confidence: 0.8,
      };
      expect(PromptVariationSchema.parse(variation)).toMatchObject(variation);
    });

    it('rejects confidence out of range', () => {
      const variation = {
        id: 'var-12345678-1234-1234-1234-123456789abc',
        parentIds: [],
        source: 'wild',
        templateData: { subject: 'Test' },
        rationale: 'Test',
        confidence: 1.5, // Invalid
      };
      expect(() => PromptVariationSchema.parse(variation)).toThrow();
    });

    it('rejects invalid UUID', () => {
      const variation = {
        id: 'invalid-uuid',
        parentIds: [],
        source: 'wild',
        templateData: { subject: 'Test' },
        rationale: 'Test',
        confidence: 0.8,
      };
      expect(() => PromptVariationSchema.parse(variation)).toThrow();
    });

    it('accepts variation without mutationType for non-mutation sources', () => {
      const variation = {
        id: '12345678-1234-1234-8123-123456789abc',
        parentIds: [],
        source: 'wild',
        templateData: { subject: 'Test' },
        rationale: 'Test',
        confidence: 0.8,
      };
      expect(PromptVariationSchema.parse(variation)).toMatchObject(variation);
    });
  });

  describe('IterationConfigSchema', () => {
    it('applies defaults', () => {
      const config = IterationConfigSchema.parse({});
      expect(config.populationSize).toBe(8);
      expect(config.eliteCount).toBe(2);
      expect(config.mutationRate).toBe(0.6);
      expect(config.crossoverRate).toBe(0.3);
      expect(config.wildRate).toBe(0.1);
      expect(config.convergenceThreshold).toBe(0.05);
      expect(config.maxGenerations).toBe(10);
    });

    it('accepts custom values', () => {
      const config = IterationConfigSchema.parse({
        populationSize: 12,
        eliteCount: 3,
        maxGenerations: 5,
      });
      expect(config.populationSize).toBe(12);
      expect(config.eliteCount).toBe(3);
      expect(config.maxGenerations).toBe(5);
    });

    it('validates positive integers', () => {
      expect(() => IterationConfigSchema.parse({ populationSize: 0 })).toThrow();
      expect(() => IterationConfigSchema.parse({ maxGenerations: -1 })).toThrow();
    });

    it('validates rate ranges', () => {
      expect(() => IterationConfigSchema.parse({ mutationRate: 1.5 })).toThrow();
      expect(() => IterationConfigSchema.parse({ mutationRate: -0.1 })).toThrow();
    });
  });

  describe('IterationStateSchema', () => {
    it('validates complete state', () => {
      const state = {
        sessionId: '12345678-1234-1234-8123-123456789abc',
        templateSlug: 'test-template',
        templateVersion: 1,
        createdAt: '2025-12-07T10:00:00.000Z',
        updatedAt: '2025-12-07T10:00:00.000Z',
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
      expect(IterationStateSchema.parse(state)).toMatchObject(state);
    });

    it('rejects invalid datetime strings', () => {
      const state = {
        sessionId: '12345678-1234-1234-8123-123456789abc',
        templateSlug: 'test-template',
        templateVersion: 1,
        createdAt: 'invalid-date',
        updatedAt: '2025-12-07T10:00:00.000Z',
        generations: [],
        currentPopulation: [],
        scoreHistory: [],
        config: IterationConfigSchema.parse({}),
      };
      expect(() => IterationStateSchema.parse(state)).toThrow();
    });
  });
});