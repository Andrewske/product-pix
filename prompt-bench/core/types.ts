import { z } from 'zod';

// =============================================================================
// Variable Definition Schemas
// =============================================================================

/**
 * Schema for string variable definitions in templates
 */
export const StringVariableDefSchema = z.object({
  type: z.literal('string'),
  required: z.boolean(),
  default: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Schema for enum variable definitions in templates
 */
export const EnumVariableDefSchema = z.object({
  type: z.literal('enum'),
  required: z.boolean(),
  options: z.array(z.string()).min(1),
  default: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Union schema for all variable types
 */
export const VariableDefSchema = z.discriminatedUnion('type', [
  StringVariableDefSchema,
  EnumVariableDefSchema,
]);

export type VariableDef = z.infer<typeof VariableDefSchema>;
export type StringVariableDef = z.infer<typeof StringVariableDefSchema>;
export type EnumVariableDef = z.infer<typeof EnumVariableDefSchema>;

/**
 * Schema for the variables_schema JSONB field
 */
export const VariablesSchemaSchema = z.record(z.string(), VariableDefSchema);
export type VariablesSchema = z.infer<typeof VariablesSchemaSchema>;

// =============================================================================
// Template Data Schemas
// =============================================================================

/**
 * Schema for template_data JSONB - the actual prompt components
 */
export const TemplateDataSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  background: z.string().optional(),
  lighting: z.string().optional(),
  camera: z.string().optional(),
  style: z.string().optional(),
  quality: z.string().optional(),
  negative: z.string().optional(),
  icon: z.string().optional(),
});

export type TemplateData = z.infer<typeof TemplateDataSchema>;

// =============================================================================
// Prompt Template Schemas
// =============================================================================

export const TemplateStatusSchema = z.enum(['draft', 'active', 'archived']);
export type TemplateStatus = z.infer<typeof TemplateStatusSchema>;

/**
 * Schema for a complete prompt template
 */
export const PromptTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  version: z.number().int().positive(),
  status: TemplateStatusSchema,
  templateData: TemplateDataSchema,
  variablesSchema: VariablesSchemaSchema,
  createdBy: z.string().uuid().optional(),
  createdAt: z.date().optional(),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

// =============================================================================
// Test Schemas
// =============================================================================

export const TestStatusSchema = z.enum(['pending', 'generating', 'evaluating', 'completed', 'failed']);
export type TestStatus = z.infer<typeof TestStatusSchema>;

/**
 * Schema for a single test case in a batch file
 */
export const TestCaseSchema = z.object({
  variables: z.record(z.string(), z.unknown()),
  notes: z.string().optional(),
  sourceImage: z.string().optional(),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

/**
 * Schema for a batch file containing multiple test cases
 */
export const BatchFileSchema = z.object({
  label: z.string().optional(),
  sourceImage: z.string().optional(),
  tests: z.array(TestCaseSchema).min(1, 'At least one test is required'),
});

export type BatchFile = z.infer<typeof BatchFileSchema>;

/**
 * Schema for a prompt test record from the database
 */
export const PromptTestSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  idempotencyKey: z.string().nullable(),
  status: TestStatusSchema,
  errorMessage: z.string().nullable(),
  errorCode: z.string().nullable(),
  inputs: z.record(z.string(), z.unknown()),
  finalPrompt: z.string(),
  imageUrl: z.string().nullable(),
  imageKey: z.string().nullable(),
  sourceImageUrl: z.string().nullable(),
  sourceImageKey: z.string().nullable(),
  batchLabel: z.string().nullable(),
  durationMs: z.number().nullable(),
  costUsd: z.number().nullable(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

export type PromptTest = z.infer<typeof PromptTestSchema>;

// =============================================================================
// Evaluation Schemas
// =============================================================================

export const EvaluatorTypeSchema = z.enum(['llm', 'human']);
export type EvaluatorType = z.infer<typeof EvaluatorTypeSchema>;

/**
 * Schema for score values (1.0 to 10.0)
 */
export const ScoreSchema = z.number().min(1).max(10);

/**
 * Schema for evaluation details JSONB
 */
export const EvaluationDetailsSchema = z.object({
  composition: ScoreSchema.optional(),
  lighting: ScoreSchema.optional(),
  productVisibility: ScoreSchema.optional(),
  backgroundQuality: ScoreSchema.optional(),
  professionalQuality: ScoreSchema.optional(),
  promptAdherence: ScoreSchema.optional(),
  reasoning: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
}).passthrough(); // Allow additional fields

export type EvaluationDetails = z.infer<typeof EvaluationDetailsSchema>;

/**
 * Schema for a prompt evaluation record
 */
export const PromptEvaluationSchema = z.object({
  id: z.string().uuid(),
  testId: z.string().uuid(),
  scoreOverall: ScoreSchema,
  details: EvaluationDetailsSchema.nullable(),
  evaluatorModel: z.string().nullable(),
  evaluatorType: EvaluatorTypeSchema,
  costUsd: z.number().nullable(),
  tokensUsed: z.number().nullable(),
  createdAt: z.date(),
});

export type PromptEvaluation = z.infer<typeof PromptEvaluationSchema>;

// =============================================================================
// CLI Command Schemas
// =============================================================================

/**
 * Schema for the 'run' command options
 */
export const RunCommandOptionsSchema = z.object({
  template: z.string().min(1),
  version: z.union([z.literal('latest'), z.number().int().positive()]).default('latest'),
  batch: z.string().min(1),
  label: z.string().optional(),
  dryRun: z.boolean().default(false),
});

export type RunCommandOptions = z.infer<typeof RunCommandOptionsSchema>;

/**
 * Schema for the 'evaluate' command options
 */
export const EvaluateCommandOptionsSchema = z.object({
  label: z.string().min(1),
  model: z.string().default('claude-sonnet-4-20250514'), // TODO: load from config
});

export type EvaluateCommandOptions = z.infer<typeof EvaluateCommandOptionsSchema>;

/**
 * Schema for the 'compare' command options
 */
export const CompareCommandOptionsSchema = z.object({
  baseline: z.string().min(1),
  candidate: z.string().min(1),
});

export type CompareCommandOptions = z.infer<typeof CompareCommandOptionsSchema>;
