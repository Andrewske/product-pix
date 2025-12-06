# Step 13: Create Index Barrel File and Package.json Updates

## Objective

Create the barrel export file for the prompts library and ensure all package.json dependencies and scripts are properly configured.

## Prerequisites

- Steps 01-12 completed

## Files to Create/Modify

### 1. Create `src/lib/prompts/index.ts`

```typescript
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
  fetchTemplate,
  syncTemplate,
  syncAllTemplates,
  updateTemplateStatus,
} from './registry';

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
```

### 2. Update `package.json`

Add the required dependencies and scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "bench": "tsx scripts/prompt-bench.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0"
  }
}
```

Run installation:

```bash
npm install @anthropic-ai/sdk
npm install -D tsx
```

### 3. Update `src/lib/env.ts`

Add the Anthropic API key to environment validation:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // ... existing variables ...

  // Anthropic API (required for prompt evaluation)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});

// Export for use in evaluator
export const env = envSchema.parse(process.env);
```

### 4. Update `.env.example`

Add example for the new environment variable:

```bash
# Anthropic API (required for prompt testing evaluation)
ANTHROPIC_API_KEY=sk-ant-xxx
```

## Implementation Steps

1. Create `src/lib/prompts/index.ts` with the barrel exports
2. Run `npm install @anthropic-ai/sdk` to add Anthropic SDK
3. Run `npm install -D tsx` to add tsx for script execution
4. Update `package.json` with the `bench` script
5. Update `src/lib/env.ts` to include `ANTHROPIC_API_KEY`
6. Update `.env.example` with the new variable
7. Verify there are no TypeScript errors: `npx tsc --noEmit`
8. Verify the CLI runs: `npm run bench`

## Acceptance Criteria

- [ ] `src/lib/prompts/index.ts` exists with all exports
- [ ] `@anthropic-ai/sdk` is in dependencies
- [ ] `tsx` is in devDependencies
- [ ] `package.json` has `"bench": "tsx scripts/prompt-bench.ts"` script
- [ ] `src/lib/env.ts` includes optional `ANTHROPIC_API_KEY`
- [ ] `.env.example` documents the new variable
- [ ] No TypeScript errors when running `npx tsc --noEmit`
- [ ] `npm run bench` shows available commands

## Verification

After completing this step, the following should work:

```bash
# Show available commands
npm run bench

# Output:
# Unknown command: undefined
# Available commands: run, evaluate, compare, report, sync

# Sync templates to database
npm run bench sync

# Run a dry-run test
npm run bench run \
  --template ecommerce-base \
  --batch tests/fixtures/products-mix.json \
  --dry-run
```

## Notes

- The barrel file uses explicit named exports for tree-shaking
- All types are exported with `type` keyword for clarity
- The CLI script uses tsx for TypeScript execution without compilation
- ANTHROPIC_API_KEY is optional (only required for evaluation)
