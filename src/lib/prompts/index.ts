/**
 * Prompt Testing Framework
 *
 * A lightweight tool for iterating on prompt templates with LLM evaluation.
 *
 * @example
 * ```typescript
 * import { compileTemplate, fetchTemplate, evaluateImage } from '@/lib/prompts';
 *
 * // Fetch a template
 * const template = await fetchTemplate('ecommerce-base', 'latest');
 *
 * // Compile with variables
 * const result = compileTemplate(
 *   template.templateData,
 *   template.variablesSchema,
 *   { product: 'coffee mug', color: 'blue' }
 * );
 *
 * // Evaluate generated image
 * const evaluation = await evaluateImage(imageUrl, result.prompt);
 * ```
 */

// Types
export {
  // Variable definitions
  type VariableDef,
  type StringVariableDef,
  type EnumVariableDef,
  type VariablesSchema,
  VariableDefSchema,
  VariablesSchemaSchema,

  // Template types
  type TemplateData,
  type TemplateStatus,
  type PromptTemplate,
  TemplateDataSchema,
  TemplateStatusSchema,
  PromptTemplateSchema,

  // Test types
  type TestStatus,
  type TestCase,
  type BatchFile,
  type PromptTest,
  TestStatusSchema,
  TestCaseSchema,
  BatchFileSchema,
  PromptTestSchema,

  // Evaluation types
  type EvaluatorType,
  type EvaluationDetails,
  type PromptEvaluation,
  EvaluatorTypeSchema,
  EvaluationDetailsSchema,
  PromptEvaluationSchema,
  ScoreSchema,

  // CLI types
  type RunCommandOptions,
  type EvaluateCommandOptions,
  type CompareCommandOptions,
  RunCommandOptionsSchema,
  EvaluateCommandOptionsSchema,
  CompareCommandOptionsSchema,
} from './types';

// Errors
export {
  type ErrorCode,
  type PromptTestError,
  type Result,
  type Ok,
  type Err,
  createError,
  ok,
  err,
  isOk,
  isErr,
  isRetryable,
  isErrorCode,
  validateCompiledPrompt,
  validateRequiredVariables,
  validateEnumValues,
  formatError,
} from './errors';

// Compiler
export {
  type CompileOptions,
  type CompiledPrompt,
  compileTemplate,
  applyDefaults,
  substituteVariables,
  assemblePrompt,
  generateIdempotencyKey,
  extractVariableNames,
  getTemplateVariables,
  validateTemplateVariables,
} from './compiler';

// Registry
export {
  ECOMMERCE_BASE,
  LIFESTYLE_PRODUCT,
  TEMPLATE_REGISTRY,
  getRegisteredTemplate,
  getRegisteredSlugs,
} from './registry';

// Database operations
export {
  fetchTemplate,
  syncTemplate,
  syncAllTemplates,
  updateTemplateStatus,
} from './db/templates';

// Evaluator
export {
  type EvaluationResult,
  type EvaluateOptions,
  evaluateImage,
  evaluateBatch,
} from './evaluator';

// Statistics
export {
  MIN_SAMPLES_FOR_SIGNIFICANCE,
  MIN_SAMPLES_FOR_COMPARISON,
  SIGNIFICANCE_THRESHOLD,
  type SampleSizeCheck,
  type TTestResult,
  type ComparisonSummary,
  type BatchReport,
  checkSampleSize,
  mean,
  variance,
  stdDev,
  standardError,
  summarize,
  welchTTest,
  formatComparison,
  formatReport,
  getScoreDistribution,
} from './statistics';

// Source image utilities
export {
  type ResolvedSourceImage,
  type SourceImageOptions,
  getMimeType,
  computeHash,
  resolveSourcePath,
  loadSourceImage,
  fetchSourceImage,
  uploadSourceImage,
  resolveSourceImage,
} from './source-image';

// Orchestrator
export {
  runPipeline,
  generateBatchLabel,
  type PipelineOptions,
  type PipelineResult,
  type ProgressCallback,
} from './orchestrator';