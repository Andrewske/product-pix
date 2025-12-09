/**
 * Type definitions for the template improvement system
 */

// =============================================================================
// Session Types
// =============================================================================

export type ImprovementSessionStatus = 'active' | 'completed' | 'abandoned';

export interface ImprovementSession {
  sessionId: string;
  templateSlug: string;
  startedAt: string;
  updatedAt: string;
  status: ImprovementSessionStatus;
  currentIteration: number;
  maxIterations: number;
  targetScore: number | null;
  initialMeanScore: number | null;
  currentMeanScore: number | null;
  totalImprovement: number;
  totalCostUsd: number;
  config: ImprovementConfig;
}

export interface ImprovementConfig {
  template: string;
  batchFile: string;
  maxIterations: number;
  targetScore: number | null;
  autoApprove: boolean;
  versionTemplates: boolean;
  aiModel: string;
}

// =============================================================================
// Iteration Types
// =============================================================================

export interface TemplateIteration {
  id: string;
  sessionId: string;
  iterationNumber: number;
  timestamp: string;
  baselineTemplate: Record<string, unknown>;
  improvedTemplate: Record<string, unknown>;
  changes: TemplateChange[];
  userModifications: string | null;
  baselineBatchLabel: string;
  improvedBatchLabel: string;
  baselineResults: TestResults;
  improvedResults: TestResults;
  delta: ScoreDelta;
  analysis: StructuredAnalysis;
  suggestions: Suggestion[];
  costs: IterationCosts;
}

// =============================================================================
// Template Change Types
// =============================================================================

export interface TemplateChange {
  type: 'addition' | 'removal' | 'modification' | 'logic_change';
  path: string; // e.g., "templateData.subject", "variablesSchema.product.description"
  oldValue?: unknown;
  newValue?: unknown;
  lineNumber?: number;
  description: string;
}

// =============================================================================
// Test Results Types
// =============================================================================

export interface EvaluationBreakdown {
  composition: number;
  lighting: number;
  productVisibility: number;
  backgroundQuality: number;
  professionalQuality: number;
  promptAdherence: number;
}

export interface ProductScore {
  productId: string;
  score: number;
  breakdown?: EvaluationBreakdown;
  reasoning?: string;
  suggestions?: string[];
}

export interface TestResults {
  scores: number[];
  meanScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  productScores: ProductScore[];
  dimensionAverages?: EvaluationBreakdown;
}

// =============================================================================
// Score Delta Types
// =============================================================================

export interface ScoreDelta {
  meanDelta: number;
  medianDelta: number;
  improved: number;
  regressed: number;
  unchanged: number;
  productDeltas: Array<{
    productId: string;
    baselineScore: number;
    improvedScore: number;
    delta: number;
  }>;
}

// =============================================================================
// AI Analysis Types
// =============================================================================

export interface StructuredAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: Pattern[];
  segmentAnalysis: SegmentAnalysis[];
  prioritizedSuggestions: Suggestion[];
}

export interface Pattern {
  type: 'success' | 'failure';
  description: string;
  frequency: number;
  examples: string[];
  confidence: number; // 0-1
}

export interface SegmentAnalysis {
  segment: string; // e.g., "electronics", "apparel", "food"
  meanScore: number;
  issues: string[];
  recommendations: string[];
}

export interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'prompt_structure' | 'variable_usage' | 'style_guidance' | 'technical';
  description: string;
  rationale: string;
  expectedImpact: string;
  confidence: number; // 0-1
  codeChanges?: TemplateChange[];
}

// =============================================================================
// Cost Types
// =============================================================================

export interface IterationCosts {
  baselineGeneration: number;
  baselineEvaluation: number;
  improvedGeneration: number;
  improvedEvaluation: number;
  aiAnalysis: number;
  aiImplementation: number;
  total: number;
}

// =============================================================================
// Database Row Types
// =============================================================================

export interface ImprovementSessionRow {
  session_id: string;
  template_slug: string;
  started_at: string;
  updated_at: string;
  status: ImprovementSessionStatus;
  current_iteration: number;
  max_iterations: number;
  target_score: number | null;
  initial_mean_score: number | null;
  current_mean_score: number | null;
  total_improvement: number;
  total_cost_usd: number;
  config: ImprovementConfig;
}

export interface TemplateIterationRow {
  id: string;
  session_id: string;
  iteration_number: number;
  timestamp: string;
  baseline_template: Record<string, unknown>;
  improved_template: Record<string, unknown>;
  changes: TemplateChange[];
  user_modifications: string | null;
  baseline_batch_label: string;
  improved_batch_label: string;
  baseline_results: TestResults;
  improved_results: TestResults;
  delta: ScoreDelta;
  analysis: StructuredAnalysis;
  suggestions: Suggestion[];
  costs: IterationCosts;
}

