import { z } from 'zod';

// =============================================================================
// Mutation Types
// =============================================================================

/**
 * Types of mutations that can be applied to prompt variations
 */
export const MutationTypeSchema = z.enum([
  'wording',      // Change phrasing while keeping intent
  'addition',     // Add new descriptive elements
  'removal',      // Simplify by removing elements
  'substitution', // Replace one concept with another
  'emphasis',     // Strengthen or weaken an aspect
  'wild'          // Experimental/creative variation
]);

export type MutationType = z.infer<typeof MutationTypeSchema>;

// =============================================================================
// Variation Source Types
// =============================================================================

/**
 * How a variation was created
 */
export const VariationSourceSchema = z.enum([
  'mutation',     // Single parent mutation
  'crossover',    // Two parent combination
  'wild',         // Random exploration
  'user'          // User-provided custom variation
]);

export type VariationSource = z.infer<typeof VariationSourceSchema>;

// =============================================================================
// Prompt Variation Schema
// =============================================================================

/**
 * A single prompt variation with metadata
 */
export const PromptVariationSchema = z.object({
  id: z.string().uuid(),
  parentIds: z.array(z.string().uuid()).max(2), // Empty for initial, 1 for mutation, 2 for crossover
  source: VariationSourceSchema,
  mutationType: MutationTypeSchema.optional(),
  templateData: z.object({
    subject: z.string().min(1, 'Subject is required'),
    background: z.string().optional(),
    lighting: z.string().optional(),
    camera: z.string().optional(),
    style: z.string().optional(),
    quality: z.string().optional(),
    negative: z.string().optional(),
  }).passthrough(),
  rationale: z.string().min(1, 'Rationale is required'),
  confidence: z.number().min(0).max(1),
  approved: z.boolean().optional(),
  score: z.number().optional(),
});

export type PromptVariation = z.infer<typeof PromptVariationSchema>;

// =============================================================================
// Structured Insight Schema
// =============================================================================

/**
 * Success pattern analysis
 */
export const SuccessPatternSchema = z.object({
  pattern: z.string(),
  component: z.string(),
  frequency: z.number().int().min(0),
  avgScore: z.number().min(0).max(10),
});

export type SuccessPattern = z.infer<typeof SuccessPatternSchema>;

/**
 * Failure pattern analysis
 */
export const FailurePatternSchema = z.object({
  pattern: z.string(),
  component: z.string(),
  frequency: z.number().int().min(0),
  avgScore: z.number().min(0).max(10),
});

export type FailurePattern = z.infer<typeof FailurePatternSchema>;

/**
 * Enhanced insights with machine-readable variations
 */
export const StructuredInsightSchema = z.object({
  keyFindings: z.array(z.string()),
  recommendations: z.array(z.string()),
  nextSteps: z.array(z.string()),
  proposedVariations: z.array(PromptVariationSchema),
  successPatterns: z.array(SuccessPatternSchema),
  failurePatterns: z.array(FailurePatternSchema),
  tokensUsed: z.number().int().min(0),
  costUsd: z.number().min(0),
});

export type StructuredInsight = z.infer<typeof StructuredInsightSchema>;

// =============================================================================
// Iteration Configuration Schema
// =============================================================================

/**
 * Configuration for evolution parameters
 */
export const IterationConfigSchema = z.object({
  populationSize: z.number().int().positive().default(8),
  eliteCount: z.number().int().min(0).default(2),
  mutationRate: z.number().min(0).max(1).default(0.6),
  crossoverRate: z.number().min(0).max(1).default(0.3),
  wildRate: z.number().min(0).max(1).default(0.1),
  convergenceThreshold: z.number().min(0).max(1).default(0.05),
  maxGenerations: z.number().int().positive().default(10),
});

export type IterationConfig = z.infer<typeof IterationConfigSchema>;

// =============================================================================
// Generation Record Schema
// =============================================================================

/**
 * Record of a single generation in the iteration process
 */
export const GenerationRecordSchema = z.object({
  generation: z.number().int().min(0),
  batchLabel: z.string(),
  variations: z.array(PromptVariationSchema),
  bestScore: z.number().optional(),
  meanScore: z.number().optional(),
  completedAt: z.string().datetime().optional(),
});

export type GenerationRecord = z.infer<typeof GenerationRecordSchema>;

// =============================================================================
// Population Entry Schema
// =============================================================================

/**
 * Entry in the current population with fitness score
 */
export const PopulationEntrySchema = z.object({
  variationId: z.string().uuid(),
  fitness: z.number(),
  generation: z.number().int().min(0),
});

export type PopulationEntry = z.infer<typeof PopulationEntrySchema>;

// =============================================================================
// Score History Entry Schema
// =============================================================================

/**
 * Historical score statistics for a generation
 */
export const ScoreHistoryEntrySchema = z.object({
  generation: z.number().int().min(0),
  best: z.number(),
  mean: z.number(),
  stdDev: z.number(),
});

export type ScoreHistoryEntry = z.infer<typeof ScoreHistoryEntrySchema>;

// =============================================================================
// Iteration State Schema
// =============================================================================

/**
 * Session state persisted between runs
 */
export const IterationStateSchema = z.object({
  sessionId: z.string().uuid(),
  templateSlug: z.string(),
  templateVersion: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  generations: z.array(GenerationRecordSchema),
  currentPopulation: z.array(PopulationEntrySchema),
  scoreHistory: z.array(ScoreHistoryEntrySchema),
  config: IterationConfigSchema,
});

export type IterationState = z.infer<typeof IterationStateSchema>;

// =============================================================================
// Iteration Proposal Schema
// =============================================================================

/**
 * Proposal for human-in-the-loop approval
 */
export const IterationProposalSchema = z.object({
  generation: z.number().int().min(0),
  sessionId: z.string().uuid(),
  baselineScore: z.number(),
  proposedVariations: z.array(PromptVariationSchema),
  insights: StructuredInsightSchema,
});

export type IterationProposal = z.infer<typeof IterationProposalSchema>;

// =============================================================================
// Session Summary Type
// =============================================================================

/**
 * Summary information for a session (used in listings)
 */
export interface SessionSummary {
  sessionId: string;
  templateSlug: string;
  createdAt: string;
  generationCount: number;
  lastBestScore: number | null;
}