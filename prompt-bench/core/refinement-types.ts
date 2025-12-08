import { z } from 'zod';

// =============================================================================
// Refinement Configuration Schema
// =============================================================================

/**
 * Focus areas for refinement optimization
 */
export const RefinementFocusSchema = z.enum([
  'composition',
  'lighting',
  'product_visibility',
  'background_quality',
  'professional_quality',
  'prompt_adherence',
  'creativity',
  'consistency',
]);

export type RefinementFocus = z.infer<typeof RefinementFocusSchema>;

/**
 * Configuration for refinement process parameters
 */
export const RefinementConfigSchema = z.object({
  maxIterations: z.number().int().positive().default(20),
  targetQuality: z.number().min(1).max(10).default(8.5),
  focusAreas: z.array(RefinementFocusSchema).default([
    'composition',
    'lighting',
    'product_visibility',
    'professional_quality',
  ]),
  minImprovementThreshold: z.number().min(0).max(1).default(0.05),
  analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
  allowTemplateStructureChanges: z.boolean().default(false),
});

export type RefinementConfig = z.infer<typeof RefinementConfigSchema>;

// =============================================================================
// Template Modification Schema
// =============================================================================

/**
 * Types of modifications that can be applied to templates
 */
export const ModificationTypeSchema = z.enum([
  'text_replacement',
  'text_addition',
  'text_removal',
  'variable_addition',
  'variable_removal',
  'variable_modification',
  'schema_restructure',
]);

export type ModificationType = z.infer<typeof ModificationTypeSchema>;

/**
 * Proposed changes to template text, variables, or schema
 */
export const TemplateModificationSchema = z.object({
  id: z.string().uuid(),
  type: ModificationTypeSchema,
  targetField: z.string().min(1, 'Target field is required'),
  description: z.string().min(1, 'Description is required'),
  // For text modifications
  oldText: z.string().optional(),
  newText: z.string().optional(),
  // For variable modifications
  variableName: z.string().optional(),
  variableChanges: z.record(z.string(), z.unknown()).optional(),
  // For schema modifications
  schemaChanges: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1),
  expectedImpact: z.number().min(-1).max(1), // -1 (worse) to +1 (better)
  rationale: z.string().min(1, 'Rationale is required'),
});

export type TemplateModification = z.infer<typeof TemplateModificationSchema>;

// =============================================================================
// Refinement Analysis Schema
// =============================================================================

/**
 * Analysis of individual image performance
 */
export const ImageAnalysisSchema = z.object({
  testIndex: z.number().int().min(0),
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyInsights: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
});

export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

/**
 * Cross-image patterns and trends
 */
export const CrossImageInsightsSchema = z.object({
  consistentStrengths: z.array(z.string()),
  consistentWeaknesses: z.array(z.string()),
  scoreDistribution: z.object({
    mean: z.number(),
    median: z.number(),
    stdDev: z.number(),
    min: z.number(),
    max: z.number(),
  }),
  correlationPatterns: z.array(z.object({
    factor: z.string(),
    correlation: z.number().min(-1).max(1),
    significance: z.enum(['weak', 'moderate', 'strong']),
  })),
  recommendedFocusAreas: z.array(RefinementFocusSchema),
});

export type CrossImageInsights = z.infer<typeof CrossImageInsightsSchema>;

/**
 * Batch analysis output with per-image and cross-image insights
 */
export const RefinementAnalysisSchema = z.object({
  batchLabel: z.string(),
  overallScore: z.number().min(1).max(10),
  imageAnalyses: z.array(ImageAnalysisSchema),
  crossImageInsights: CrossImageInsightsSchema,
  keyFindings: z.array(z.string()),
  proposedModifications: z.array(TemplateModificationSchema),
  confidence: z.number().min(0).max(1),
  tokensUsed: z.number().int().min(0),
  costUsd: z.number().min(0),
  analysisTimestamp: z.string().datetime(),
});

export type RefinementAnalysis = z.infer<typeof RefinementAnalysisSchema>;

// =============================================================================
// Quality History Entry Schema
// =============================================================================

/**
 * Score progression tracking for refinement iterations
 */
export const QualityHistoryEntrySchema = z.object({
  iteration: z.number().int().min(0),
  timestamp: z.string().datetime(),
  overallScore: z.number().min(1).max(10),
  scoreChange: z.number(), // Change from previous iteration
  modificationsApplied: z.number().int().min(0),
  analysisConfidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

export type QualityHistoryEntry = z.infer<typeof QualityHistoryEntrySchema>;

// =============================================================================
// Refinement Record Schema
// =============================================================================

/**
 * Status of a refinement iteration
 */
export const RefinementStatusSchema = z.enum([
  'analyzing',
  'modifying',
  'testing',
  'completed',
  'failed',
]);

export type RefinementStatus = z.infer<typeof RefinementStatusSchema>;

/**
 * Tracks each iteration with analysis, modifications, scores
 */
export const RefinementRecordSchema = z.object({
  iteration: z.number().int().min(0),
  status: RefinementStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  analysis: RefinementAnalysisSchema.optional(),
  appliedModifications: z.array(TemplateModificationSchema),
  testBatchLabel: z.string().optional(),
  errorMessage: z.string().optional(),
  durationMs: z.number().int().min(0).optional(),
  costUsd: z.number().min(0).optional(),
});

export type RefinementRecord = z.infer<typeof RefinementRecordSchema>;

// =============================================================================
// Refinement State Schema
// =============================================================================

/**
 * Session state with iterations, current template, config
 */
export const RefinementStateSchema = z.object({
  sessionId: z.string().uuid(),
  templateSlug: z.string(),
  templateVersion: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  config: RefinementConfigSchema,
  currentIteration: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  refinementRecords: z.array(RefinementRecordSchema),
  qualityHistory: z.array(QualityHistoryEntrySchema),
  bestScore: z.number().min(1).max(10).optional(),
  bestIteration: z.number().int().min(0).optional(),
  convergenceReason: z.string().optional(),
});

export type RefinementState = z.infer<typeof RefinementStateSchema>;