# Prompt Testing & Feedback Loop Framework

## Overview

A CLI-based development tool for iterating on prompt templates with LLM evaluation, human validation, and full database persistence for the ProductPix e-commerce image generation app.

## Goals

1. Create a structured **base prompt template** using proven e-commerce photography techniques
2. Build a **feedback loop** to test prompts, analyze outputs, and improve iteratively
3. Enable **systematic A/B testing** of prompt variants with **statistical significance**
4. Provide **cost visibility** and **reliability guarantees** for batch testing

---

## Database Schema

### prompt_templates

Versioned prompt templates following the Subject+Background+Lighting+Camera+Style+Quality formula:

```sql
CREATE TYPE prompt_template_status AS ENUM ('draft', 'active', 'deprecated');

CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status prompt_template_status NOT NULL DEFAULT 'draft',

  -- Template components
  subject_template TEXT NOT NULL,
  background_template TEXT,
  lighting_template TEXT,
  camera_template TEXT,
  style_template TEXT,
  quality_template TEXT,
  negative_prompt_template TEXT,
  full_template TEXT NOT NULL,

  -- Variable definitions as JSON (validated by Zod at application layer)
  variables JSONB NOT NULL DEFAULT '{}',

  -- A/B testing configuration
  min_test_samples INTEGER DEFAULT 30,
  target_effect_size DECIMAL(3,2) DEFAULT 0.5,

  parent_version_id UUID REFERENCES public.prompt_templates(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_templates_slug ON public.prompt_templates(slug);
CREATE INDEX idx_prompt_templates_status ON public.prompt_templates(status);
CREATE INDEX idx_prompt_templates_created ON public.prompt_templates(created_by, created_at DESC);
```

### prompt_tests

Individual test runs with idempotency and cost tracking:

```sql
CREATE TYPE prompt_test_status AS ENUM ('pending', 'generating', 'evaluating', 'completed', 'failed');

CREATE TABLE public.prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id),
  status prompt_test_status NOT NULL DEFAULT 'pending',

  -- Idempotency (prevents duplicate tests from CLI reruns)
  idempotency_key TEXT UNIQUE,

  input_variables JSONB NOT NULL,
  compiled_prompt TEXT NOT NULL,
  negative_prompt TEXT,
  config JSONB NOT NULL DEFAULT '{"aspectRatio": "1:1", "resolution": "1k"}',
  source_upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,

  generated_image_url TEXT,
  generated_image_key TEXT,
  generation_time_ms INTEGER,
  error_message TEXT,

  -- Cost tracking
  generation_cost_usd DECIMAL(10,4),

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_error_code TEXT,

  run_label TEXT,
  run_notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Soft delete for cleanup
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_prompt_tests_template ON public.prompt_tests(template_id);
CREATE INDEX idx_prompt_tests_status ON public.prompt_tests(status);
CREATE INDEX idx_prompt_tests_label ON public.prompt_tests(run_label);
CREATE INDEX idx_prompt_tests_idempotency ON public.prompt_tests(idempotency_key);
CREATE INDEX idx_prompt_tests_active ON public.prompt_tests(deleted_at) WHERE deleted_at IS NULL;
```

### prompt_evaluations

LLM and human scores with multi-judge support:

```sql
CREATE TYPE evaluation_source AS ENUM ('llm', 'human');

CREATE TABLE public.prompt_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.prompt_tests(id) ON DELETE CASCADE,
  source evaluation_source NOT NULL,

  -- Scoring rubric (1-10 scale)
  score_overall DECIMAL(3,1) NOT NULL,
  score_composition DECIMAL(3,1),
  score_lighting DECIMAL(3,1),
  score_product_visibility DECIMAL(3,1),
  score_background_quality DECIMAL(3,1),
  score_professional_quality DECIMAL(3,1),
  score_prompt_adherence DECIMAL(3,1),

  -- LLM evaluation details
  llm_model TEXT,
  llm_reasoning TEXT,
  llm_suggestions TEXT[],

  -- Cost tracking for LLM evaluations
  evaluation_tokens_used INTEGER,
  evaluation_cost_usd DECIMAL(10,4),

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,

  -- Human validation
  human_approved BOOLEAN,
  human_notes TEXT,

  evaluated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_evaluations_test ON prompt_evaluations(test_id);
CREATE INDEX idx_prompt_evaluations_source ON prompt_evaluations(source);
CREATE INDEX idx_prompt_evaluations_test_source ON prompt_evaluations(test_id, source);
```

### prompt_ab_tests

Statistical comparison of template variants:

```sql
CREATE TABLE public.prompt_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_template_id UUID NOT NULL REFERENCES public.prompt_templates(id),
  variant_template_id UUID NOT NULL REFERENCES public.prompt_templates(id),

  -- Sample configuration
  target_sample_size INTEGER NOT NULL DEFAULT 30,
  current_sample_size INTEGER DEFAULT 0,

  -- Statistical results (populated on completion)
  control_mean DECIMAL(4,2),
  control_std_dev DECIMAL(4,2),
  variant_mean DECIMAL(4,2),
  variant_std_dev DECIMAL(4,2),
  effect_size DECIMAL(4,3),
  t_statistic DECIMAL(6,3),
  p_value DECIMAL(10,8),
  confidence_interval_lower DECIMAL(4,2),
  confidence_interval_upper DECIMAL(4,2),
  statistical_power DECIMAL(3,2),
  is_significant BOOLEAN,

  -- Winner determination
  winner_template_id UUID REFERENCES public.prompt_templates(id),

  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_prompt_ab_tests_status ON prompt_ab_tests(status);
CREATE INDEX idx_prompt_ab_tests_templates ON prompt_ab_tests(control_template_id, variant_template_id);
```

### prompt_deployments

Environment-based deployment with rollback support:

```sql
CREATE TYPE deployment_environment AS ENUM ('development', 'staging', 'production');

CREATE TABLE public.prompt_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id),
  environment deployment_environment NOT NULL,
  deployment_percentage INTEGER DEFAULT 100 CHECK (deployment_percentage BETWEEN 0 AND 100),

  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deployed_by UUID REFERENCES public.users(id),
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,

  -- Performance tracking
  total_uses INTEGER DEFAULT 0,
  avg_score DECIMAL(3,1),
  error_rate DECIMAL(5,4),

  UNIQUE(environment, template_id, deployed_at)
);

CREATE INDEX idx_prompt_deployments_env ON prompt_deployments(environment);
CREATE INDEX idx_prompt_deployments_active ON prompt_deployments(environment)
  WHERE rolled_back_at IS NULL;
```

---

## Database Functions

Atomic operations to prevent race conditions:

```sql
-- Atomic test status update
CREATE OR REPLACE FUNCTION update_prompt_test_status(
  p_test_id UUID,
  p_new_status prompt_test_status,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE prompt_tests
  SET
    status = p_new_status,
    error_message = COALESCE(p_error_message, error_message),
    completed_at = CASE
      WHEN p_new_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END,
    retry_count = CASE
      WHEN p_new_status = 'failed' THEN retry_count + 1
      ELSE retry_count
    END
  WHERE id = p_test_id;
END;
$$ LANGUAGE plpgsql;

-- Cost analysis view
CREATE OR REPLACE VIEW prompt_test_costs AS
SELECT
  t.template_id,
  pt.name as template_name,
  COUNT(*) as test_count,
  SUM(t.generation_cost_usd) as total_generation_cost,
  SUM(e.evaluation_cost_usd) as total_evaluation_cost,
  AVG(e.score_overall) as avg_score,
  (SUM(COALESCE(t.generation_cost_usd, 0)) + SUM(COALESCE(e.evaluation_cost_usd, 0))) /
    NULLIF(AVG(e.score_overall), 0) as cost_per_quality_point
FROM prompt_tests t
JOIN prompt_templates pt ON t.template_id = pt.id
LEFT JOIN prompt_evaluations e ON t.id = e.test_id AND e.source = 'llm'
WHERE t.deleted_at IS NULL
GROUP BY t.template_id, pt.name;
```

---

## Type Safety & Validation

### Zod Schemas

All JSONB fields are validated at the application layer:

```typescript
// src/lib/prompts/types.ts
import { z } from 'zod';

// Variable type definitions
export const VariableTypeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('string'),
    required: z.boolean(),
    default: z.string().optional(),
  }),
  z.object({
    type: z.literal('enum'),
    required: z.boolean(),
    default: z.string().optional(),
    options: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('number'),
    required: z.boolean(),
    default: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
]);

export type VariableType = z.infer<typeof VariableTypeSchema>;

// Template variables schema
export const TemplateVariablesSchema = z.record(z.string(), VariableTypeSchema);

// Prompt template schema
export const PromptTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  subjectTemplate: z.string().min(1),
  backgroundTemplate: z.string().optional(),
  lightingTemplate: z.string().optional(),
  cameraTemplate: z.string().optional(),
  styleTemplate: z.string().optional(),
  qualityTemplate: z.string().optional(),
  negativePromptTemplate: z.string().optional(),
  variables: TemplateVariablesSchema,
});

// Test config schema
export const TestConfigSchema = z.object({
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']),
  resolution: z.enum(['1k', '2k', '4k']),
});

// Batch file schema
export const BatchFileSchema = z.object({
  label: z.string().optional(),
  tests: z.array(z.object({
    template: z.string(),
    variables: z.record(z.string(), z.unknown()),
    notes: z.string().optional(),
  })),
});

// Evaluation scores schema (1-10 scale)
export const ScoreSchema = z.number().min(1).max(10).multipleOf(0.1);
export const EvaluationScoresSchema = z.object({
  overall: ScoreSchema,
  composition: ScoreSchema.optional(),
  lighting: ScoreSchema.optional(),
  productVisibility: ScoreSchema.optional(),
  backgroundQuality: ScoreSchema.optional(),
  professionalQuality: ScoreSchema.optional(),
  promptAdherence: ScoreSchema.optional(),
});
```

### Error Handling

Structured errors with context for debugging:

```typescript
// src/lib/prompts/errors.ts
export type PromptErrorCode =
  | 'COMPILATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'GENERATION_ERROR'
  | 'EVALUATION_ERROR'
  | 'STORAGE_ERROR'
  | 'DATABASE_ERROR';

export interface PromptTestError {
  code: PromptErrorCode;
  message: string;
  context: {
    templateId?: string;
    testId?: string;
    step: 'compile' | 'validate' | 'generate' | 'evaluate' | 'store';
    cause?: string;
    retryable: boolean;
  };
  timestamp: string;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: PromptTestError };

export const createPromptError = (
  code: PromptErrorCode,
  message: string,
  context: PromptTestError['context']
): PromptTestError => ({
  code,
  message,
  context,
  timestamp: new Date().toISOString(),
});

// Validate compiled prompt has no unresolved variables
export const validateCompiledPrompt = (compiled: string): PromptTestError | null => {
  const unresolvedPattern = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g;
  const matches = compiled.match(unresolvedPattern);
  if (matches) {
    return createPromptError(
      'COMPILATION_ERROR',
      `Unresolved variables: ${matches.join(', ')}`,
      { step: 'compile', retryable: false }
    );
  }
  if (compiled.length > 4000) {
    return createPromptError(
      'VALIDATION_ERROR',
      'Compiled prompt exceeds 4000 character limit',
      { step: 'validate', retryable: false }
    );
  }
  return null;
};
```

---

## Statistical Analysis

### Sample Size Calculation

Before running A/B tests, calculate required sample size:

```typescript
// src/lib/prompts/statistics.ts

interface SampleSizeParams {
  baselineScore: number;           // Current template's mean score
  minimumDetectableEffect: number; // e.g., 0.5 points improvement
  standardDeviation: number;       // Estimated score variance
  alpha?: number;                  // Significance level (default: 0.05)
  power?: number;                  // Statistical power (default: 0.8)
}

export const calculateRequiredSampleSize = (params: SampleSizeParams): number => {
  const { baselineScore, minimumDetectableEffect, standardDeviation } = params;
  const alpha = params.alpha ?? 0.05;
  const power = params.power ?? 0.8;

  // Z-scores for two-tailed test
  const zAlpha = 1.96;  // 95% confidence
  const zBeta = 0.84;   // 80% power

  // Two-sample t-test formula: n = 2 * (Z_α/2 + Z_β)² * σ² / δ²
  const n = 2 * Math.pow(zAlpha + zBeta, 2) * Math.pow(standardDeviation, 2)
            / Math.pow(minimumDetectableEffect, 2);

  return Math.ceil(n);
};

export const performWelchTTest = (
  controlScores: number[],
  variantScores: number[]
): { tStatistic: number; pValue: number; significant: boolean } => {
  const n1 = controlScores.length;
  const n2 = variantScores.length;
  const mean1 = controlScores.reduce((a, b) => a + b, 0) / n1;
  const mean2 = variantScores.reduce((a, b) => a + b, 0) / n2;

  const var1 = controlScores.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
  const var2 = variantScores.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);

  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = (mean1 - mean2) / se;

  // Approximate p-value (would use t-distribution in practice)
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)));

  return {
    tStatistic,
    pValue,
    significant: pValue < 0.05,
  };
};

export const calculateConfidenceInterval = (
  scores: number[],
  confidenceLevel: number = 0.95
): { lower: number; upper: number; margin: number } => {
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(
    scores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1)
  );

  const zScore = 1.96; // 95% confidence
  const margin = zScore * (stdDev / Math.sqrt(n));

  return {
    lower: mean - margin,
    upper: mean + margin,
    margin,
  };
};
```

### Minimum Requirements

- **Minimum sample size**: 30 tests per variant (for t-test validity)
- **Recommended**: 50-100 for detecting 0.5-point differences
- **Statistical power**: Target 80% (β = 0.2)
- **Significance level**: α = 0.05 (95% confidence)

---

## Evaluation System

### Scoring Criteria (1-10 scale)

| Criterion | Description |
|-----------|-------------|
| **Composition** | Product placement, balance, fill percentage (ideal: 80-90%) |
| **Lighting** | Even illumination, no harsh shadows, professional studio feel |
| **Product Visibility** | All features visible, sharp focus, accurate shape |
| **Background Quality** | Clean, distraction-free, consistent color/tone |
| **Professional Quality** | Overall polish, marketplace-ready, color accuracy |
| **Prompt Adherence** | How well image matches the requested prompt |

### Multi-Judge Evaluation Strategy

To mitigate LLM-as-judge bias, use ensemble evaluation:

```typescript
// src/lib/prompts/evaluation.ts

export interface EvaluationConfig {
  // Primary evaluator (required)
  primaryModel: 'claude-sonnet-4-20250514';

  // Secondary evaluator for ensemble (optional, recommended)
  secondaryModel?: 'gpt-4o' | 'gemini-1.5-pro';

  // Consensus strategy
  strategy: 'primary-only' | 'ensemble-average' | 'ensemble-min';

  // Calibration examples to anchor scoring
  calibrationExamples?: CalibrationExample[];

  // Maximum score variance before flagging for human review
  maxScoreVariance?: number; // default: 2.0
}

export interface CalibrationExample {
  imageUrl: string;
  expectedScores: EvaluationScores;
  description: string;
}

// Default: single-judge with fallback
export const DEFAULT_EVALUATION_CONFIG: EvaluationConfig = {
  primaryModel: 'claude-sonnet-4-20250514',
  strategy: 'primary-only',
  maxScoreVariance: 2.0,
};
```

### Evaluation with Retry Logic

```typescript
// src/lib/prompts/evaluate.ts

export const evaluateWithRetry = async (
  test: PromptTest,
  config: EvaluationConfig = DEFAULT_EVALUATION_CONFIG,
  maxRetries: number = 3
): Promise<Result<EvaluationResult>> => {
  let lastError: PromptTestError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await evaluateImage(test.generated_image_url, config);
      return { success: true, data: result };
    } catch (error) {
      lastError = createPromptError(
        'EVALUATION_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        {
          testId: test.id,
          step: 'evaluate',
          retryable: attempt < maxRetries - 1,
          cause: `Attempt ${attempt + 1} of ${maxRetries}`,
        }
      );

      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }
  }

  // Mark for human review instead of failing completely
  return {
    success: false,
    error: lastError!,
  };
};
```

### Test Image Storage

- Store in same R2 bucket: `generated/{userId}/tests/{testId}.png`
- Automatic cleanup: Tests older than 30 days can be archived
- Soft delete: Set `deleted_at` before removing from R2

### Human Validation

- Interactive CLI mode for reviewing outputs
- Approve/reject LLM scores
- Add notes and adjusted scores
- Track inter-rater reliability (LLM vs human correlation)

---

## Base E-commerce Template

Using techniques from prompt engineering research (Subject+Background+Lighting+Camera+Style+Quality):

```typescript
export const ECOMMERCE_BASE_TEMPLATE = {
  name: 'E-commerce Base',
  slug: 'ecommerce-base',
  version: 1,
  status: 'active',

  subjectTemplate: 'Professional e-commerce photo of {product_name}, {product_color} {product_material}',
  backgroundTemplate: 'on {background_type} background',
  lightingTemplate: '{lighting_setup} lighting with {lighting_modifier}',
  cameraTemplate: 'shot on DSLR with {lens_mm}mm lens f/{aperture}',
  styleTemplate: '{style_type} photography, {style_modifier}',
  qualityTemplate: '{resolution}, sharp focus throughout, product centered filling {fill_percent}% of frame',
  negativePromptTemplate: 'worst quality, low quality, blurry, pixelated, watermark, text, signature, logo',

  variables: {
    product_name: { type: 'string', required: true },
    product_color: { type: 'string', required: false, default: '' },
    product_material: { type: 'string', required: false, default: '' },
    background_type: {
      type: 'enum', required: true, default: 'pure white seamless',
      options: ['pure white seamless', 'light gray gradient', 'dark gradient', 'marble surface']
    },
    lighting_setup: {
      type: 'enum', required: true, default: 'soft diffused studio',
      options: ['soft diffused studio', 'high-key bright', 'low-key dramatic', 'three-point']
    },
    lighting_modifier: { type: 'string', required: false, default: 'subtle fill light' },
    lens_mm: { type: 'enum', required: false, default: '85', options: ['50', '85', '100', '135'] },
    aperture: { type: 'enum', required: false, default: '8', options: ['2.8', '4', '5.6', '8', '11'] },
    style_type: {
      type: 'enum', required: true, default: 'commercial catalog',
      options: ['commercial catalog', 'luxury advertising', 'lifestyle', 'minimalist']
    },
    style_modifier: { type: 'string', required: false, default: 'color-accurate' },
    resolution: { type: 'enum', required: false, default: '4K', options: ['HD', '4K'] },
    fill_percent: { type: 'enum', required: false, default: '85', options: ['70', '80', '85', '90'] },
  },
};
```

**Example compiled prompt:**
```
Professional e-commerce photo of ceramic coffee mug, matte black glazed ceramic,
on pure white seamless background, soft diffused studio lighting with subtle fill light,
shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate,
4K, sharp focus throughout, product centered filling 85% of frame
```

---

## CLI Commands

```bash
# Run a single test
npm run prompt-test run --template ecommerce-base \
  --var product_name="leather wallet" --var product_color="brown"

# Run batch tests
npm run prompt-test run --template ecommerce-base \
  --batch tests/product-variants.json --label "wallet-batch-001"

# Dry run (validate without generating)
npm run prompt-test run --template ecommerce-base \
  --var product_name="wallet" --dry-run

# Estimate costs before running
npm run prompt-test estimate --template ecommerce-base \
  --batch tests/products.json

# Compare template versions with statistical analysis
npm run prompt-test compare --templates ecommerce-base-v1,ecommerce-base-v2

# Plan A/B test (calculate required sample size)
npm run prompt-test plan-ab \
  --control ecommerce-base-v1 \
  --variant ecommerce-base-v2 \
  --baseline-score 7.5 \
  --detect-improvement 0.5

# Analyze results
npm run prompt-test analyze --template ecommerce-base --since 7d

# Interactive human scoring
npm run prompt-test review --pending

# View costs
npm run prompt-test costs --template ecommerce-base

# Deploy to environment
npm run prompt-test deploy --template ecommerce-base-v2 --environment staging

# Rollback deployment
npm run prompt-test rollback --environment production --reason "Score regression"

# Cleanup old test data
npm run prompt-test cleanup --older-than-days 30
```

---

## File Structure

```
src/lib/prompts/
├── index.ts              # Barrel exports
├── types.ts              # TypeScript interfaces & Zod schemas
├── errors.ts             # Error types and factories
├── compiler.ts           # Template compilation with validation
├── statistics.ts         # Sample size, t-tests, confidence intervals
├── evaluation.ts         # Evaluation types, config, LLM prompt
├── evaluate.ts           # Claude evaluation executor with retry
├── db.ts                 # Database operations (atomic via RPC)
└── templates/
    ├── index.ts          # Template registry
    └── ecommerce-base.ts # Base template

src/cli/prompt-test/
├── index.ts              # CLI entry point (Commander.js)
├── commands/
│   ├── run.ts            # Execute tests (single & batch)
│   ├── compare.ts        # Compare variants with stats
│   ├── analyze.ts        # View results
│   ├── review.ts         # Interactive human scoring
│   ├── estimate.ts       # Cost estimation
│   ├── plan-ab.ts        # Sample size calculator
│   ├── deploy.ts         # Environment deployment
│   ├── rollback.ts       # Deployment rollback
│   ├── costs.ts          # Cost reporting
│   ├── cleanup.ts        # Data cleanup
│   └── templates.ts      # Manage templates
└── lib/
    ├── interactive.ts    # Human scoring UI (readline/Ink)
    ├── formatters.ts     # Output formatting (table, JSON)
    └── progress.ts       # Progress bar for batch operations

tests/lib/prompts/
├── compiler.test.ts      # Template compilation tests
├── statistics.test.ts    # Statistical function tests
├── evaluate.test.ts      # Evaluation logic tests
└── db.test.ts            # Database operation tests

supabase/migrations/
├── 00009_create_prompt_templates.sql
├── 00010_create_prompt_tests.sql
├── 00011_create_prompt_evaluations.sql
├── 00012_create_prompt_ab_tests.sql
├── 00013_create_prompt_deployments.sql
└── 00014_create_prompt_testing_functions.sql
```

---

## Implementation Phases

### Phase 1: Foundation & Type Safety
1. Database migrations (all 6 files)
2. Error types and factories (`src/lib/prompts/errors.ts`)
3. Type definitions with Zod schemas (`src/lib/prompts/types.ts`)
4. Template compiler with validation (`src/lib/prompts/compiler.ts`)
5. Base template (`src/lib/prompts/templates/ecommerce-base.ts`)
6. Unit tests for compiler and types

### Phase 2: Core CLI & Database
7. CLI entry point (`src/cli/prompt-test/index.ts`)
8. Run command with dry-run support (`src/cli/prompt-test/commands/run.ts`)
9. Database operations with atomic RPC (`src/lib/prompts/db.ts`)
10. Progress bar and formatters
11. Cost tracking implementation

### Phase 3: Evaluation & Reliability
12. Evaluation prompt and types (`src/lib/prompts/evaluation.ts`)
13. Claude evaluator with retry logic (`src/lib/prompts/evaluate.ts`)
14. Interactive human scoring (`src/cli/prompt-test/lib/interactive.ts`)
15. Review command for pending evaluations
16. Unit tests for evaluation logic

### Phase 4: Statistical Analysis
17. Statistics module (`src/lib/prompts/statistics.ts`)
18. Compare command with significance testing
19. Plan-ab command (sample size calculator)
20. A/B test tracking in database
21. Unit tests for statistics

### Phase 5: Operations & Deployment
22. Deploy and rollback commands
23. Costs reporting command
24. Cleanup command for old data
25. Analyze command with filtering
26. End-to-end integration tests

---

## Modifications to Existing Files

### `src/lib/ai/providers/gemini.ts`
- Remove hardcoded prompt prefix `"Generate a professional product photo: ..."`
- Accept compiled prompt directly from template system
- Add negative prompt support
- Add optional `systemPrompt` config override

```typescript
interface ImageConfig {
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  resolution: '1k' | '2k' | '4k';
  systemPrompt?: string; // Optional override for testing
}
```

### `package.json`
```json
{
  "scripts": {
    "prompt-test": "tsx src/cli/prompt-test/index.ts",
    "test:prompts": "jest tests/lib/prompts"
  }
}
```

### `src/lib/env.ts`
```typescript
// Add to envSchema
ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY required for evaluation'),

// Optional configuration
PROMPT_TEST_MAX_RETRIES: z.coerce.number().default(3),
PROMPT_TEST_CLEANUP_DAYS: z.coerce.number().default(30),
```

---

## Feedback Loop Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FEEDBACK LOOP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CREATE/MODIFY TEMPLATE                                      │
│     └─> Define variables, adjust wording                        │
│     └─> Validate with Zod schemas                               │
│                                                                 │
│  2. PLAN TEST (for A/B comparisons)                             │
│     └─> npm run prompt-test plan-ab --control v1 --variant v2   │
│     └─> Calculate required sample size                          │
│     └─> Estimate costs                                          │
│                                                                 │
│  3. RUN TESTS                                                   │
│     └─> npm run prompt-test run --template <name>               │
│     └─> Gemini generates image                                  │
│     └─> Image stored in R2 with cost tracking                   │
│                                                                 │
│  4. AUTO-EVALUATE (Claude with retry)                           │
│     └─> Score composition, lighting, visibility, etc.           │
│     └─> Generate improvement suggestions                        │
│     └─> Store in prompt_evaluations with cost                   │
│     └─> Flag high-variance for human review                     │
│                                                                 │
│  5. HUMAN REVIEW (for flagged tests)                            │
│     └─> npm run prompt-test review --pending                    │
│     └─> Approve/reject, add notes                               │
│                                                                 │
│  6. ANALYZE & COMPARE                                           │
│     └─> npm run prompt-test compare --templates v1,v2           │
│     └─> Statistical significance testing                        │
│     └─> Confidence intervals                                    │
│     └─> Identify winning variants                               │
│                                                                 │
│  7. DEPLOY WINNER                                               │
│     └─> npm run prompt-test deploy --template v2 --env staging  │
│     └─> Canary release (percentage-based)                       │
│     └─> Monitor performance                                     │
│                                                                 │
│  8. ITERATE                                                     │
│     └─> Apply learnings to template                             │
│     └─> Increment version                                       │
│     └─> Return to step 1                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Tracking

### Estimated Costs (per test)

| Operation | Cost |
|-----------|------|
| Gemini generation | ~$0.04 |
| Claude evaluation | ~$0.015 |
| R2 storage (30 days) | ~$0.0001 |
| **Total per test** | **~$0.055** |

### CLI Cost Commands

```bash
# Estimate before running
npm run prompt-test estimate --batch tests/50-products.json
# Output:
# Generation: 50 images × $0.04 = $2.00
# Evaluation: 50 images × $0.015 = $0.75
# Total estimated: $2.75

# View actual costs
npm run prompt-test costs --template ecommerce-base --since 7d
# Output:
# ┌─────────────────┬───────┬────────────┬────────────┬───────────┐
# │ Template        │ Tests │ Generation │ Evaluation │ Total     │
# ├─────────────────┼───────┼────────────┼────────────┼───────────┤
# │ ecommerce-base  │ 150   │ $6.00      │ $2.25      │ $8.25     │
# └─────────────────┴───────┴────────────┴────────────┴───────────┘
```

---

## Testing Strategy

### Unit Tests (80% coverage target)

```typescript
// tests/lib/prompts/compiler.test.ts
describe('compilePrompt', () => {
  test('resolves all template variables correctly', () => {
    const template = 'Photo of {product_name} on {background}';
    const variables = { product_name: 'mug', background: 'white' };
    expect(compilePrompt(template, variables)).toBe('Photo of mug on white');
  });

  test('throws on missing required variables', () => {
    const template = 'Photo of {product_name}';
    const variables = {};
    const schema = { product_name: { type: 'string', required: true } };
    expect(() => compilePrompt(template, variables, schema))
      .toThrow('Missing required variable: product_name');
  });

  test('validates enum options strictly', () => {
    const variables = { lighting: 'invalid' };
    const schema = { lighting: { type: 'enum', options: ['soft', 'bright'] } };
    expect(() => validateVariables(variables, schema))
      .toThrow('Invalid enum value');
  });

  test('detects unresolved variables in compiled prompt', () => {
    const compiled = 'Photo of {product_name} on white';
    const error = validateCompiledPrompt(compiled);
    expect(error?.code).toBe('COMPILATION_ERROR');
  });
});

// tests/lib/prompts/statistics.test.ts
describe('calculateRequiredSampleSize', () => {
  test('returns minimum 30 for small effect sizes', () => {
    const n = calculateRequiredSampleSize({
      baselineScore: 7.0,
      minimumDetectableEffect: 0.5,
      standardDeviation: 1.5,
    });
    expect(n).toBeGreaterThanOrEqual(30);
  });
});
```

---

## Critical Files to Read Before Implementation

1. `src/lib/ai/providers/gemini.ts` - Understand current prompt handling
2. `src/lib/ai/generate-image.ts` - Generation flow integration point
3. `src/lib/db/jobs.ts` - Database query patterns to follow
4. `src/lib/db/credits.ts` - Idempotency key pattern to follow
5. `scripts/test-ai.ts` - Existing CLI script patterns
6. `supabase/migrations/` - Migration file naming conventions

---

## Known Limitations & Future Improvements

### Deferred to v2
- **Multi-judge ensemble**: Currently single-judge (Claude). Add GPT-4o as secondary for consensus.
- **Computational metrics**: CLIP score, aesthetic score for objective measurement.
- **Bandit optimization**: Thompson sampling for adaptive test allocation.
- **Test coverage matrix**: Track diversity across product categories.

### Technical Debt
- Consider moving CLI from `src/cli/` to `scripts/` if it grows too large
- Batch API support for Gemini when available (50% cost reduction)
- Webhook notifications for long-running batch jobs
