# Prompt Testing & Feedback Loop Framework

## Overview

A lightweight, script-based tool for iterating on prompt templates with LLM evaluation and historical tracking. Designed for efficiency and low maintenance while maintaining reliability guarantees.

## Goals

1. **Structured Templates**: Component-based prompts (Subject + Lighting + Style) validated by Zod schemas
2. **Feedback Loop**: Fast iteration cycle: Edit Template → Run Batch → Auto-Evaluate → Compare
3. **Cost & Quality Tracking**: Monitor improvements in quality and cost per image over time
4. **Reliability**: Idempotent operations, retry logic, and structured error handling
5. **Simplicity**: Minimal database footprint and "script-first" architecture

---

## Database Schema

Three core tables. A/B comparison uses `batch_label` grouping instead of a dedicated table.

### 1. prompt_templates

Stores versioned prompt definitions.

```sql
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,               -- e.g., 'ecommerce-base'
  version INTEGER NOT NULL,         -- 1, 2, 3...
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- The core template logic
  template_data JSONB NOT NULL,     -- { subject: "...", lighting: "...", negative: "..." }

  -- Zod schema definition for variables
  variables_schema JSONB NOT NULL,  -- { product: { type: 'string', required: true }, ... }

  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slug, version)
);

CREATE INDEX idx_prompt_templates_slug ON prompt_templates(slug);
CREATE INDEX idx_prompt_templates_status ON prompt_templates(status);
```

### 2. prompt_tests

Individual generations with idempotency and status tracking.

```sql
CREATE TYPE prompt_test_status AS ENUM ('pending', 'generating', 'evaluating', 'completed', 'failed');

CREATE TABLE public.prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.prompt_templates(id),

  -- Idempotency (prevents duplicate tests from script reruns)
  idempotency_key TEXT UNIQUE,

  -- Status tracking
  status prompt_test_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  error_code TEXT,                  -- e.g., 'GENERATION_ERROR', 'EVALUATION_ERROR'

  -- Inputs & Output
  inputs JSONB NOT NULL,            -- { product: "mug", color: "red" }
  final_prompt TEXT NOT NULL,
  image_url TEXT,                   -- R2 URL
  image_key TEXT,                   -- R2 key for cleanup

  -- Metadata
  batch_label TEXT,                 -- e.g., "experiment-v1-lighting-tweak"
  duration_ms INTEGER,
  cost_usd DECIMAL(10,5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_prompt_tests_batch ON prompt_tests(batch_label);
CREATE INDEX idx_prompt_tests_status ON prompt_tests(status);
CREATE INDEX idx_prompt_tests_idempotency ON prompt_tests(idempotency_key);
```

### 3. prompt_evaluations

Flexible scoring with JSONB details to allow criteria evolution without migrations.

```sql
CREATE TABLE public.prompt_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.prompt_tests(id) ON DELETE CASCADE,

  -- High-level Score
  score_overall DECIMAL(3,1),       -- 1.0 to 10.0

  -- Detailed Breakdown (flexible schema)
  details JSONB,                    -- { composition: 8, lighting: 9, reasoning: "...", suggestions: [...] }

  -- Metadata
  evaluator_model TEXT,             -- e.g., 'claude-sonnet-4-20250514'
  evaluator_type TEXT NOT NULL CHECK (evaluator_type IN ('llm', 'human')),
  cost_usd DECIMAL(10,5),
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_evaluations_test ON prompt_evaluations(test_id);
```

### Database Function

Atomic status update to prevent race conditions:

```sql
CREATE OR REPLACE FUNCTION update_prompt_test_status(
  p_test_id UUID,
  p_new_status prompt_test_status,
  p_error_message TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE prompt_tests
  SET
    status = p_new_status,
    error_message = COALESCE(p_error_message, error_message),
    error_code = COALESCE(p_error_code, error_code),
    completed_at = CASE
      WHEN p_new_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_test_id;
END;
$$ LANGUAGE plpgsql;
```

---

## File Structure

Focused library with a single runner script.

```
src/lib/prompts/
├── index.ts              # Barrel exports
├── types.ts              # Zod schemas & TypeScript interfaces
├── errors.ts             # Structured error types
├── compiler.ts           # {variable} substitution + validation
├── evaluator.ts          # Claude scoring with retry logic
├── statistics.ts         # T-test, sample size warnings
└── registry.ts           # Template definitions (synced to DB)

scripts/
└── prompt-bench.ts       # Main CLI entry point

supabase/migrations/
├── 00009_create_prompt_templates.sql
├── 00010_create_prompt_tests.sql
├── 00011_create_prompt_evaluations.sql
└── 00012_create_prompt_testing_functions.sql
```

---

## Type Safety & Error Handling

### Zod Schemas (`types.ts`)

```typescript
import { z } from 'zod';

// Variable definition schema
export const VariableDefSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('string'), required: z.boolean(), default: z.string().optional() }),
  z.object({ type: z.literal('enum'), required: z.boolean(), options: z.array(z.string()).min(1), default: z.string().optional() }),
]);

// Template data schema
export const TemplateDataSchema = z.object({
  subject: z.string().min(1),
  background: z.string().optional(),
  lighting: z.string().optional(),
  camera: z.string().optional(),
  style: z.string().optional(),
  quality: z.string().optional(),
  negative: z.string().optional(),
});

// Batch file schema
export const BatchFileSchema = z.object({
  label: z.string().optional(),
  tests: z.array(z.object({
    variables: z.record(z.string(), z.unknown()),
    notes: z.string().optional(),
  })),
});

// Score range validation
export const ScoreSchema = z.number().min(1).max(10);
```

### Structured Errors (`errors.ts`)

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'COMPILATION_ERROR'
  | 'GENERATION_ERROR'
  | 'EVALUATION_ERROR'
  | 'DATABASE_ERROR';

export interface PromptTestError {
  code: ErrorCode;
  message: string;
  testId?: string;
  retryable: boolean;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: PromptTestError };

export const createError = (
  code: ErrorCode,
  message: string,
  opts: { testId?: string; retryable?: boolean } = {}
): PromptTestError => ({
  code,
  message,
  testId: opts.testId,
  retryable: opts.retryable ?? false,
});

// Check for unresolved template variables
export const validateCompiledPrompt = (prompt: string): PromptTestError | null => {
  const unresolved = prompt.match(/\{[a-zA-Z_]+\}/g);
  if (unresolved) {
    return createError('COMPILATION_ERROR', `Unresolved variables: ${unresolved.join(', ')}`);
  }
  return null;
};
```

---

## Evaluator with Retry Logic (`evaluator.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { createError, Result, PromptTestError } from './errors';

const EVALUATION_PROMPT = `You are evaluating an AI-generated product photo for e-commerce.

Score each criterion from 1-10:
- Composition: Product placement, balance, fill percentage
- Lighting: Even illumination, no harsh shadows
- Product Visibility: Sharp focus, all features visible
- Background Quality: Clean, distraction-free
- Professional Quality: Marketplace-ready, color accuracy
- Prompt Adherence: How well it matches the request

Return JSON: { "overall": 8.5, "composition": 8, "lighting": 9, ... , "reasoning": "...", "suggestions": [...] }`;

interface EvaluationResult {
  overall: number;
  details: Record<string, unknown>;
  tokensUsed: number;
  costUsd: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const evaluateImage = async (
  imageUrl: string,
  prompt: string,
  maxRetries = 3
): Promise<Result<EvaluationResult>> => {
  const client = new Anthropic();
  let lastError: PromptTestError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            { type: 'text', text: `${EVALUATION_PROMPT}\n\nOriginal prompt: "${prompt}"` },
          ],
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);

      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const costUsd = tokensUsed * 0.000003; // Approximate

      return {
        ok: true,
        data: {
          overall: parsed.overall,
          details: parsed,
          tokensUsed,
          costUsd,
        },
      };
    } catch (error) {
      lastError = createError(
        'EVALUATION_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        { retryable: attempt < maxRetries - 1 }
      );

      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff: 1s, 2s, 4s
      }
    }
  }

  return { ok: false, error: lastError! };
};
```

---

## Statistics Module (`statistics.ts`)

```typescript
// Minimum sample size warning
export const MIN_SAMPLES_FOR_SIGNIFICANCE = 30;

export const checkSampleSize = (n: number): { adequate: boolean; warning?: string } => {
  if (n < 10) {
    return { adequate: false, warning: `Only ${n} samples - need at least 10 for any comparison, 30+ recommended` };
  }
  if (n < MIN_SAMPLES_FOR_SIGNIFICANCE) {
    return { adequate: true, warning: `${n} samples may not achieve statistical significance (recommend 30+)` };
  }
  return { adequate: true };
};

// Welch's t-test for comparing two batches
export const welchTTest = (
  a: number[],
  b: number[]
): { tStatistic: number; pValue: number; significant: boolean; meanDiff: number } => {
  const mean = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  const variance = (arr: number[], m: number) =>
    arr.reduce((s, x) => s + Math.pow(x - m, 2), 0) / (arr.length - 1);

  const meanA = mean(a), meanB = mean(b);
  const varA = variance(a, meanA), varB = variance(b, meanB);
  const se = Math.sqrt(varA / a.length + varB / b.length);
  const t = (meanA - meanB) / se;

  // Approximate p-value using normal distribution (good enough for n > 30)
  const p = 2 * (1 - normalCDF(Math.abs(t)));

  return {
    tStatistic: t,
    pValue: p,
    significant: p < 0.05,
    meanDiff: meanB - meanA,
  };
};

// Standard normal CDF approximation
const normalCDF = (x: number): number => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
};

// Format comparison result for CLI output
export const formatComparison = (
  baselineLabel: string,
  candidateLabel: string,
  result: ReturnType<typeof welchTTest>,
  sampleWarning?: string
): string => {
  const direction = result.meanDiff > 0 ? '+' : '';
  const significanceNote = result.significant
    ? `✓ Significant (p=${result.pValue.toFixed(3)})`
    : `✗ Not significant (p=${result.pValue.toFixed(3)})`;

  let output = `
Comparison: ${baselineLabel} vs ${candidateLabel}
─────────────────────────────────────────
Mean difference: ${direction}${result.meanDiff.toFixed(2)} points
${significanceNote}
`;

  if (sampleWarning) {
    output += `⚠ Warning: ${sampleWarning}\n`;
  }

  return output;
};
```

---

## CLI Workflow (`scripts/prompt-bench.ts`)

Single script with subcommands via `tsx`.

### 1. Run a Test Batch
```bash
npm run bench run \
  --template ecommerce-base \
  --version latest \
  --batch ./tests/fixtures/products-mix.json \
  --label "v1-baseline"
```

### 2. Evaluate Results
```bash
npm run bench evaluate --label "v1-baseline"
```

### 3. Compare Batches (A/B Test)
```bash
npm run bench compare \
  --baseline "v1-baseline" \
  --candidate "v2-lighting-tweak"

# Output:
# Comparison: v1-baseline vs v2-lighting-tweak
# ─────────────────────────────────────────
# Mean difference: +0.8 points
# ✓ Significant (p=0.032)
```

### 4. Quick Report
```bash
npm run bench report --label "v2-lighting-tweak"
# Prints summary table + image URLs for manual review
```

### 5. Dry Run (Validate Only)
```bash
npm run bench run --template ecommerce-base --batch ./tests/fixtures/test.json --dry-run
# Validates inputs against schema without generating
```

---

## Base E-commerce Template

Defined in `registry.ts` and synced to database:

```typescript
export const ECOMMERCE_BASE = {
  slug: 'ecommerce-base',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Professional e-commerce photo of {product}, {color} {material}',
    background: 'on {background_type} background',
    lighting: '{lighting_style} lighting with soft fill',
    camera: 'shot on DSLR with 85mm lens f/8',
    style: '{style} photography, color-accurate',
    quality: '4K resolution, sharp focus, product centered filling 85% of frame',
    negative: 'worst quality, blurry, watermark, text, logo',
  },
  variablesSchema: {
    product: { type: 'string', required: true },
    color: { type: 'string', required: false, default: '' },
    material: { type: 'string', required: false, default: '' },
    background_type: {
      type: 'enum',
      required: true,
      options: ['pure white seamless', 'light gray gradient', 'marble surface'],
      default: 'pure white seamless',
    },
    lighting_style: {
      type: 'enum',
      required: true,
      options: ['soft diffused studio', 'high-key bright', 'three-point'],
      default: 'soft diffused studio',
    },
    style: {
      type: 'enum',
      required: true,
      options: ['commercial catalog', 'luxury advertising', 'minimalist'],
      default: 'commercial catalog',
    },
  },
};
```

---

## Implementation Plan

### Phase 1: Foundation (Day 1)
1. **Migrations**: Create the 3 tables + status update function
2. **Types & Errors**: Implement `types.ts` and `errors.ts` with Zod schemas
3. **Compiler**: Implement `compiler.ts` with variable substitution and validation
4. **Registry**: Define `ecommerce-base` template

### Phase 2: Execution (Day 2)
5. **Gemini Update**: Modify `src/lib/ai/providers/gemini.ts` to accept raw prompts
6. **Runner**: Build `scripts/prompt-bench.ts` with `run` command
7. **Idempotency**: Implement duplicate detection via `idempotency_key`

### Phase 3: Evaluation & Stats (Day 3)
8. **Evaluator**: Implement Claude scoring with retry logic
9. **Statistics**: Implement t-test and sample size warnings
10. **Compare Command**: Add comparison output with significance testing
11. **Report Command**: Simple summary output

---

## Key Modifications to Existing Files

### `src/lib/ai/providers/gemini.ts`
```typescript
interface ImageConfig {
  // ... existing fields
  rawPrompt?: boolean; // If true, use prompt as-is without prefixes
}

// In generateFromText:
const finalPrompt = config.rawPrompt
  ? prompt
  : `Generate a professional product photo: ${prompt}`;
```

### `src/lib/env.ts`
```typescript
// Add to schema
ANTHROPIC_API_KEY: z.string().min(1).optional(), // Required only for evaluation
```

### `package.json`
```json
{
  "scripts": {
    "bench": "tsx scripts/prompt-bench.ts"
  }
}
```

---

## Example Batch File

```json
{
  "label": "ceramics-test-v1",
  "tests": [
    {
      "variables": {
        "product": "ceramic coffee mug",
        "color": "matte black",
        "material": "glazed ceramic",
        "background_type": "pure white seamless",
        "lighting_style": "soft diffused studio",
        "style": "commercial catalog"
      }
    },
    {
      "variables": {
        "product": "ceramic vase",
        "color": "terracotta",
        "material": "unglazed clay",
        "background_type": "marble surface",
        "lighting_style": "three-point",
        "style": "luxury advertising"
      }
    }
  ]
}
```

---

## Future Improvements (v2)

- **Multi-judge evaluation**: Add GPT-4o as secondary evaluator for consensus
- **HTML report generation**: Visual comparison of batches
- **Deployment tracking**: Promote templates to production with rollback
- **Batch API**: Use Gemini batch mode for 50% cost reduction
- **Cleanup command**: Archive old tests and R2 images
