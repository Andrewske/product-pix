# Prompt Testing & Feedback Loop Framework

## Overview

A CLI-based development tool for iterating on prompt templates with LLM evaluation, human validation, and full database persistence for the ProductPix e-commerce image generation app.

## Goals

1. Create a structured **base prompt template** using proven e-commerce photography techniques
2. Build a **feedback loop** to test prompts, analyze outputs, and improve iteratively
3. Enable **systematic A/B testing** of prompt variants with measurable scores

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

  -- Variable definitions as JSON
  variables JSONB NOT NULL DEFAULT '{}',

  parent_version_id UUID REFERENCES public.prompt_templates(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_templates_slug ON public.prompt_templates(slug);
CREATE INDEX idx_prompt_templates_status ON public.prompt_templates(status);
```

### prompt_tests

Individual test runs:

```sql
CREATE TYPE prompt_test_status AS ENUM ('pending', 'generating', 'evaluating', 'completed', 'failed');

CREATE TABLE public.prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id),
  status prompt_test_status NOT NULL DEFAULT 'pending',

  input_variables JSONB NOT NULL,
  compiled_prompt TEXT NOT NULL,
  negative_prompt TEXT,
  config JSONB NOT NULL DEFAULT '{"aspectRatio": "1:1", "resolution": "1k"}',
  source_upload_id UUID REFERENCES public.uploads(id),

  generated_image_url TEXT,
  generated_image_key TEXT,
  generation_time_ms INTEGER,
  error_message TEXT,

  run_label TEXT,
  run_notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_prompt_tests_template ON public.prompt_tests(template_id);
CREATE INDEX idx_prompt_tests_status ON public.prompt_tests(status);
CREATE INDEX idx_prompt_tests_label ON public.prompt_tests(run_label);
```

### prompt_evaluations

LLM and human scores:

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

  llm_model TEXT,
  llm_reasoning TEXT,
  llm_suggestions TEXT[],

  human_approved BOOLEAN,
  human_notes TEXT,

  evaluated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_evaluations_test ON prompt_evaluations(test_id);
CREATE INDEX idx_prompt_evaluations_source ON prompt_evaluations(source);
```

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

### LLM Evaluation

- **Use Claude** for image evaluation (avoids bias from Gemini evaluating its own outputs)
- Requires `ANTHROPIC_API_KEY` environment variable
- Model: `claude-sonnet-4-20250514` (vision-capable, cost-effective)
- Returns scores + reasoning + improvement suggestions
- Runs automatically after each generation

### Test Image Storage

- Store in same R2 bucket: `generated/{userId}/tests/{testId}.png`
- Keeps infrastructure simple, easy cleanup via prefix-based deletion

### Human Validation

- Interactive CLI mode for reviewing outputs
- Approve/reject LLM scores
- Add notes and adjusted scores

---

## CLI Commands

```bash
# Run a single test
npm run prompt-test run --template ecommerce-base \
  --var product_name="leather wallet" --var product_color="brown"

# Run batch tests
npm run prompt-test run --template ecommerce-base \
  --batch tests/product-variants.json --label "wallet-batch-001"

# Compare template versions
npm run prompt-test compare --templates ecommerce-base-v1,ecommerce-base-v2

# Analyze results
npm run prompt-test analyze --template ecommerce-base --since 7d

# Interactive human scoring
npm run prompt-test analyze --interactive --pending
```

---

## File Structure

```
src/lib/prompts/
├── index.ts              # Barrel exports
├── types.ts              # TypeScript interfaces
├── compiler.ts           # Template compilation
├── evaluation.ts         # Evaluation types and LLM prompt
├── evaluate.ts           # Claude evaluation executor
├── db.ts                 # Database operations
└── templates/
    ├── index.ts          # Template registry
    └── ecommerce-base.ts # Base template

scripts/prompt-test/
├── index.ts              # CLI entry point
├── commands/
│   ├── run.ts            # Execute tests
│   ├── compare.ts        # Compare variants
│   ├── analyze.ts        # View results
│   └── templates.ts      # Manage templates
└── lib/
    ├── interactive.ts    # Human scoring UI
    └── formatters.ts     # Output formatting

supabase/migrations/
├── 00009_create_prompt_templates.sql
├── 00010_create_prompt_tests.sql
├── 00011_create_prompt_evaluations.sql
└── 00012_create_prompt_testing_functions.sql
```

---

## Implementation Phases

### Phase 1: Foundation
1. Database migrations (all 4 files)
2. Type definitions (`src/lib/prompts/types.ts`)
3. Template compiler (`src/lib/prompts/compiler.ts`)
4. Base template (`src/lib/prompts/templates/ecommerce-base.ts`)

### Phase 2: Core CLI
5. CLI entry point (`scripts/prompt-test/index.ts`)
6. Run command (`scripts/prompt-test/commands/run.ts`)
7. Database operations (`src/lib/prompts/db.ts`)

### Phase 3: Evaluation
8. Evaluation prompt and types (`src/lib/prompts/evaluation.ts`)
9. Claude evaluator (`src/lib/prompts/evaluate.ts`)
10. Interactive human scoring (`scripts/prompt-test/lib/interactive.ts`)

### Phase 4: Analysis
11. Compare command
12. Analyze command
13. Formatters and reporting

---

## Modifications to Existing Files

### `src/lib/ai/providers/gemini.ts`
- Remove hardcoded prompt prefix `"Generate a professional product photo: ..."`
- Accept compiled prompt directly from template system
- Add negative prompt support

### `package.json`
```json
{
  "scripts": {
    "prompt-test": "tsx scripts/prompt-test/index.ts"
  }
}
```

### `src/lib/env.ts`
- Add `ANTHROPIC_API_KEY` for Claude evaluation

---

## Feedback Loop Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FEEDBACK LOOP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CREATE/MODIFY TEMPLATE                                      │
│     └─> Define variables, adjust wording                        │
│                                                                 │
│  2. RUN TESTS                                                   │
│     └─> npm run prompt-test run --template <name>               │
│     └─> Gemini generates image                                  │
│     └─> Image stored in R2                                      │
│                                                                 │
│  3. AUTO-EVALUATE (Claude)                                      │
│     └─> Score composition, lighting, visibility, etc.           │
│     └─> Generate improvement suggestions                        │
│     └─> Store in prompt_evaluations                             │
│                                                                 │
│  4. HUMAN REVIEW (optional)                                     │
│     └─> npm run prompt-test analyze --interactive               │
│     └─> Approve/reject, add notes                               │
│                                                                 │
│  5. ANALYZE & COMPARE                                           │
│     └─> npm run prompt-test compare --templates v1,v2           │
│     └─> Identify winning variants                               │
│                                                                 │
│  6. ITERATE                                                     │
│     └─> Apply learnings to template                             │
│     └─> Increment version                                       │
│     └─> Return to step 1                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Files to Read Before Implementation

1. `src/lib/ai/providers/gemini.ts` - Understand current prompt handling
2. `src/lib/ai/generate-image.ts` - Generation flow integration point
3. `src/lib/db/jobs.ts` - Database query patterns to follow
4. `scripts/test-ai.ts` - Existing CLI script patterns
5. `supabase/migrations/` - Migration file naming conventions
