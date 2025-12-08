import {
  RefinementConfigSchema,
  RefinementFocusSchema,
  TemplateModificationSchema,
  ModificationTypeSchema,
  RefinementAnalysisSchema,
  ImageAnalysisSchema,
  CrossImageInsightsSchema,
  QualityHistoryEntrySchema,
  RefinementRecordSchema,
  RefinementStatusSchema,
  RefinementStateSchema,
} from '@bench/core/refinement-types';

describe('refinement-types', () => {
  describe('RefinementFocusSchema', () => {
    it('accepts valid focus areas', () => {
      expect(RefinementFocusSchema.parse('composition')).toBe('composition');
      expect(RefinementFocusSchema.parse('lighting')).toBe('lighting');
      expect(RefinementFocusSchema.parse('product_visibility')).toBe('product_visibility');
      expect(RefinementFocusSchema.parse('background_quality')).toBe('background_quality');
      expect(RefinementFocusSchema.parse('professional_quality')).toBe('professional_quality');
      expect(RefinementFocusSchema.parse('prompt_adherence')).toBe('prompt_adherence');
      expect(RefinementFocusSchema.parse('creativity')).toBe('creativity');
      expect(RefinementFocusSchema.parse('consistency')).toBe('consistency');
    });

    it('rejects invalid focus areas', () => {
      expect(() => RefinementFocusSchema.parse('invalid')).toThrow();
    });
  });

  describe('ModificationTypeSchema', () => {
    it('accepts valid modification types', () => {
      expect(ModificationTypeSchema.parse('text_replacement')).toBe('text_replacement');
      expect(ModificationTypeSchema.parse('text_addition')).toBe('text_addition');
      expect(ModificationTypeSchema.parse('text_removal')).toBe('text_removal');
      expect(ModificationTypeSchema.parse('variable_addition')).toBe('variable_addition');
      expect(ModificationTypeSchema.parse('variable_removal')).toBe('variable_removal');
      expect(ModificationTypeSchema.parse('variable_modification')).toBe('variable_modification');
      expect(ModificationTypeSchema.parse('schema_restructure')).toBe('schema_restructure');
    });

    it('rejects invalid modification types', () => {
      expect(() => ModificationTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('RefinementStatusSchema', () => {
    it('accepts valid refinement statuses', () => {
      expect(RefinementStatusSchema.parse('analyzing')).toBe('analyzing');
      expect(RefinementStatusSchema.parse('modifying')).toBe('modifying');
      expect(RefinementStatusSchema.parse('testing')).toBe('testing');
      expect(RefinementStatusSchema.parse('completed')).toBe('completed');
      expect(RefinementStatusSchema.parse('failed')).toBe('failed');
    });

    it('rejects invalid statuses', () => {
      expect(() => RefinementStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('RefinementConfigSchema', () => {
    it('applies defaults', () => {
      const config = RefinementConfigSchema.parse({});
      expect(config.maxIterations).toBe(20);
      expect(config.targetQuality).toBe(8.5);
      expect(config.focusAreas).toEqual([
        'composition',
        'lighting',
        'product_visibility',
        'professional_quality',
      ]);
      expect(config.minImprovementThreshold).toBe(0.05);
      expect(config.analysisDepth).toBe('detailed');
      expect(config.allowTemplateStructureChanges).toBe(false);
    });

    it('accepts custom values', () => {
      const config = RefinementConfigSchema.parse({
        maxIterations: 15,
        targetQuality: 9.0,
        focusAreas: ['creativity', 'consistency'],
        analysisDepth: 'comprehensive',
        allowTemplateStructureChanges: true,
      });
      expect(config.maxIterations).toBe(15);
      expect(config.targetQuality).toBe(9.0);
      expect(config.focusAreas).toEqual(['creativity', 'consistency']);
      expect(config.analysisDepth).toBe('comprehensive');
      expect(config.allowTemplateStructureChanges).toBe(true);
    });

    it('validates ranges', () => {
      expect(() => RefinementConfigSchema.parse({ maxIterations: 0 })).toThrow();
      expect(() => RefinementConfigSchema.parse({ targetQuality: 0 })).toThrow();
      expect(() => RefinementConfigSchema.parse({ targetQuality: 11 })).toThrow();
      expect(() => RefinementConfigSchema.parse({ minImprovementThreshold: -0.1 })).toThrow();
      expect(() => RefinementConfigSchema.parse({ minImprovementThreshold: 1.1 })).toThrow();
    });
  });

  describe('TemplateModificationSchema', () => {
    it('validates text replacement modification', () => {
      const modification = {
        id: '12345678-1234-1234-8123-123456789abc',
        type: 'text_replacement',
        targetField: 'subject',
        description: 'Replace generic subject with specific product type',
        oldText: 'product',
        newText: 'coffee grinder',
        confidence: 0.8,
        expectedImpact: 0.3,
        rationale: 'More specific subjects improve prompt adherence',
      };
      expect(TemplateModificationSchema.parse(modification)).toMatchObject(modification);
    });

    it('validates variable addition modification', () => {
      const modification = {
        id: '87654321-4321-4321-8123-cba987654321',
        type: 'variable_addition',
        targetField: 'variables',
        description: 'Add color variable for better customization',
        variableName: 'color',
        variableChanges: { type: 'string', required: false, default: 'black' },
        confidence: 0.9,
        expectedImpact: 0.2,
        rationale: 'Color variations improve product representation',
      };
      expect(TemplateModificationSchema.parse(modification)).toMatchObject(modification);
    });

    it('rejects invalid confidence range', () => {
      const modification = {
        id: '12345678-1234-1234-8123-123456789abc',
        type: 'text_replacement',
        targetField: 'subject',
        description: 'Test',
        oldText: 'old',
        newText: 'new',
        confidence: 1.5, // Invalid
        expectedImpact: 0.3,
        rationale: 'Test',
      };
      expect(() => TemplateModificationSchema.parse(modification)).toThrow();
    });

    it('rejects invalid expected impact range', () => {
      const modification = {
        id: '12345678-1234-1234-8123-123456789abc',
        type: 'text_replacement',
        targetField: 'subject',
        description: 'Test',
        oldText: 'old',
        newText: 'new',
        confidence: 0.8,
        expectedImpact: 2.0, // Invalid
        rationale: 'Test',
      };
      expect(() => TemplateModificationSchema.parse(modification)).toThrow();
    });
  });

  describe('ImageAnalysisSchema', () => {
    it('validates complete image analysis', () => {
      const analysis = {
        testIndex: 0,
        score: 8.5,
        strengths: ['Good composition', 'Excellent lighting'],
        weaknesses: ['Minor background artifacts'],
        keyInsights: ['Lighting is the strongest aspect'],
        improvementSuggestions: ['Consider different background'],
      };
      expect(ImageAnalysisSchema.parse(analysis)).toMatchObject(analysis);
    });

    it('rejects invalid score range', () => {
      const analysis = {
        testIndex: 0,
        score: 12, // Invalid
        strengths: [],
        weaknesses: [],
        keyInsights: [],
        improvementSuggestions: [],
      };
      expect(() => ImageAnalysisSchema.parse(analysis)).toThrow();
    });
  });

  describe('CrossImageInsightsSchema', () => {
    it('validates complete cross-image insights', () => {
      const insights = {
        consistentStrengths: ['Lighting consistently excellent'],
        consistentWeaknesses: ['Background sometimes cluttered'],
        scoreDistribution: {
          mean: 8.2,
          median: 8.0,
          stdDev: 0.5,
          min: 7.5,
          max: 9.0,
        },
        correlationPatterns: [
          {
            factor: 'lighting_quality',
            correlation: 0.85,
            significance: 'strong',
          },
        ],
        recommendedFocusAreas: ['background_quality', 'consistency'],
      };
      expect(CrossImageInsightsSchema.parse(insights)).toMatchObject(insights);
    });

    it('rejects invalid correlation range', () => {
      const insights = {
        consistentStrengths: [],
        consistentWeaknesses: [],
        scoreDistribution: {
          mean: 8.0,
          median: 8.0,
          stdDev: 0.5,
          min: 7.0,
          max: 9.0,
        },
        correlationPatterns: [
          {
            factor: 'test',
            correlation: 1.5, // Invalid
            significance: 'strong',
          },
        ],
        recommendedFocusAreas: [],
      };
      expect(() => CrossImageInsightsSchema.parse(insights)).toThrow();
    });
  });

  describe('RefinementAnalysisSchema', () => {
    it('validates complete analysis', () => {
      const analysis = {
        batchLabel: 'test-batch-001',
        overallScore: 8.3,
        imageAnalyses: [
          {
            testIndex: 0,
            score: 8.5,
            strengths: ['Good lighting'],
            weaknesses: ['Minor artifacts'],
            keyInsights: ['Lighting works well'],
            improvementSuggestions: ['Clean up artifacts'],
          },
        ],
        crossImageInsights: {
          consistentStrengths: ['Lighting'],
          consistentWeaknesses: ['Artifacts'],
          scoreDistribution: {
            mean: 8.3,
            median: 8.2,
            stdDev: 0.3,
            min: 8.0,
            max: 8.5,
          },
          correlationPatterns: [],
          recommendedFocusAreas: ['consistency'],
        },
        keyFindings: ['Lighting is strongest aspect'],
        proposedModifications: [
          {
            id: '12345678-1234-1234-8123-123456789abc',
            type: 'text_addition',
            targetField: 'lighting',
            description: 'Enhance lighting description',
            newText: 'with professional studio lighting',
            confidence: 0.8,
            expectedImpact: 0.2,
            rationale: 'Better lighting descriptions improve results',
          },
        ],
        confidence: 0.9,
        tokensUsed: 1500,
        costUsd: 0.03,
        analysisTimestamp: '2025-12-07T12:00:00.000Z',
      };
      expect(RefinementAnalysisSchema.parse(analysis)).toMatchObject(analysis);
    });
  });

  describe('QualityHistoryEntrySchema', () => {
    it('validates complete history entry', () => {
      const entry = {
        iteration: 1,
        timestamp: '2025-12-07T12:00:00.000Z',
        overallScore: 8.3,
        scoreChange: 0.5,
        modificationsApplied: 2,
        analysisConfidence: 0.85,
        notes: 'Significant improvement in lighting',
      };
      expect(QualityHistoryEntrySchema.parse(entry)).toMatchObject(entry);
    });
  });

  describe('RefinementRecordSchema', () => {
    it('validates complete record', () => {
      const record = {
        iteration: 1,
        status: 'completed',
        startedAt: '2025-12-07T11:00:00.000Z',
        completedAt: '2025-12-07T12:00:00.000Z',
        appliedModifications: [
          {
            id: '12345678-1234-1234-8123-123456789abc',
            type: 'text_replacement',
            targetField: 'lighting',
            description: 'Improve lighting description',
            oldText: 'good lighting',
            newText: 'professional studio lighting',
            confidence: 0.8,
            expectedImpact: 0.3,
            rationale: 'More specific lighting terms improve results',
          },
        ],
        testBatchLabel: 'iteration-1-batch',
        durationMs: 300000,
        costUsd: 0.05,
      };
      expect(RefinementRecordSchema.parse(record)).toMatchObject(record);
    });
  });

  describe('RefinementStateSchema', () => {
    it('validates complete state', () => {
      const state = {
        sessionId: '12345678-1234-1234-8123-123456789abc',
        templateSlug: 'ecommerce-base',
        templateVersion: 1,
        createdAt: '2025-12-07T10:00:00.000Z',
        updatedAt: '2025-12-07T12:00:00.000Z',
        config: {
          maxIterations: 20,
          targetQuality: 8.5,
          focusAreas: ['composition', 'lighting'],
        },
        currentIteration: 2,
        isActive: true,
        refinementRecords: [],
        qualityHistory: [],
      };
      expect(RefinementStateSchema.parse(state)).toMatchObject(state);
    });

    it('applies defaults for optional fields', () => {
      const state = {
        sessionId: '12345678-1234-1234-8123-123456789abc',
        templateSlug: 'ecommerce-base',
        templateVersion: 1,
        createdAt: '2025-12-07T10:00:00.000Z',
        updatedAt: '2025-12-07T12:00:00.000Z',
        config: RefinementConfigSchema.parse({}),
        refinementRecords: [],
        qualityHistory: [],
      };
      const parsed = RefinementStateSchema.parse(state);
      expect(parsed.currentIteration).toBe(0);
      expect(parsed.isActive).toBe(true);
    });

    it('rejects invalid datetime strings', () => {
      const state = {
        sessionId: '12345678-1234-1234-8123-123456789abc',
        templateSlug: 'ecommerce-base',
        templateVersion: 1,
        createdAt: 'invalid-date',
        updatedAt: '2025-12-07T12:00:00.000Z',
        config: RefinementConfigSchema.parse({}),
        refinementRecords: [],
        qualityHistory: [],
      };
      expect(() => RefinementStateSchema.parse(state)).toThrow();
    });
  });
});