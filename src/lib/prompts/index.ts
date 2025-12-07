/**
 * Prompt Testing Framework
 *
 * A lightweight tool for iterating on prompt templates with LLM evaluation.
 *
 * @example
 * ```typescript
 * import { compileTemplate, fetchTemplate, evaluateImage } from '@bench/core/compiler';
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
} from '@bench/core/types';

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
} from '@bench/core/errors';

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
} from '@bench/core/compiler';

// Registry
export {
  ECOMMERCE_BASE,
  LIFESTYLE_PRODUCT,
  TEMPLATE_REGISTRY,
  getRegisteredTemplate,
  getRegisteredSlugs,
} from '@bench/templates/registry';

// Database operations
export {
  fetchTemplate,
  syncTemplate,
  syncAllTemplates,
  updateTemplateStatus,
} from '@bench/db/templates';

// Evaluator
export {
  type EvaluationResult,
  type EvaluateOptions,
  evaluateImage,
  evaluateBatch,
} from '@bench/core/evaluator';

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
} from '@bench/core/statistics';

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
} from '@bench/core/source-image';

// Orchestrator
export {
  runPipeline,
  generateBatchLabel,
  type PipelineOptions,
  type PipelineResult,
  type ProgressCallback,
} from '@bench/core/orchestrator';