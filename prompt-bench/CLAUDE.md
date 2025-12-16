# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Prompt Bench is an isolated CLI framework for iterative prompt engineering. It generates AI product photos, scores them with vision models, and produces comparison reports.

## Commands

```bash
# Full workflow
bun bench test --template <slug> --batch <file>    # run → evaluate → report

# Individual stages
bun bench run --template <slug> --batch <file>     # Generate images
bun bench evaluate --label <batch-label>           # Score with Claude
bun bench evaluate-collection --label <label>      # Score image collections
bun bench compare --baseline <l1> --candidate <l2> # A/B comparison
bun bench report --label <batch-label>             # HTML report
bun bench open-last-report                         # Open latest report

# Template management
bun bench sync                                     # Local templates → DB
bun bench improve                                  # AI-powered iteration
bun bench improve --continue                       # Resume session
bun bench improve --history                        # View past sessions

# Web UI
bun run prompt-bench/ui/server.ts                  # http://localhost:3001
```

## Architecture

```
prompt-bench/
  cli.ts              # Entry point, env loading, command routing
  core/
    types.ts          # Zod schemas (PromptTemplate, BatchFile, TestCase)
    errors.ts         # Result<T> type (ok/err), ErrorCode enum
    compiler.ts       # Template → prompt (variable substitution)
    evaluator.ts      # Claude vision scoring (6 criteria, weighted)
    collection-evaluator.ts  # Multi-image consistency scoring
    orchestrator.ts   # Pipeline coordination (run → eval → report)
    statistics.ts     # Mean, stddev, confidence intervals
    cost.ts           # Token-based pricing from TOML
  commands/
    run.ts            # Image generation via Gemini
    evaluate.ts       # Single-image evaluation
    evaluate-collection.ts   # Collection evaluation
    compare.ts        # A/B statistical comparison
    report.ts         # HTML report generation
    improve.ts        # AI template improvement loop
    sync.ts           # Template → Supabase sync
  templates/
    registry.ts       # TEMPLATE_REGISTRY map
    *.ts              # Template definitions
  db/
    templates.ts      # Supabase queries
  fixtures/
    *.json            # Batch files (tests array)
    images/           # Source images for testing
  ui/
    server.ts         # Bun HTTP server + React SPA
```

## Key Concepts

**Result Type**: Railway-oriented error handling
```typescript
import { Result, ok, err, createError } from '@bench/core/errors';

const result: Result<Data> = condition
  ? ok(data)
  : err(createError('VALIDATION_ERROR', 'message'));

if (!result.ok) return result; // Propagate errors
const { data } = result;       // Type-safe data access
```

**Template Structure**: Prompt components + variable schema
```typescript
const TEMPLATE: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'my-template',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Photo of {product}',     // Required
    background: 'white background',    // Optional components
    lighting: 'studio lighting',
    camera: '85mm f/8',
    style: 'commercial',
    quality: '4K',
    negative: 'blurry, watermark',
  },
  variablesSchema: {
    product: { type: 'string', required: true },
    color: { type: 'string', required: false, default: '' },
    size: { type: 'enum', required: false, options: ['small', 'medium', 'large'] },
  },
};
```

**Batch File Format**:
```json
{
  "label": "optional-prefix",
  "sourceImage": "./relative/to/batch/image.jpg",
  "tests": [
    { "variables": { "product": "coffee maker" }, "sourceImage": "./override.jpg" },
    { "variables": { "product": "blender" } }
  ]
}
```

## Configuration

Config file: `prompt-bench.toml` (project root)
- `[defaults]`: template, batch_file, evaluation_model
- `[defaults.report]`: insights, show_urls
- `[defaults.improve]`: max_iterations, target_score, auto_approve
- `[pricing.<provider>.<model>]`: input/output costs per 1M tokens

## Adding Templates

1. Create `prompt-bench/templates/<name>.ts`
2. Export from `prompt-bench/templates/index.ts`
3. Add to `TEMPLATE_REGISTRY` in `prompt-bench/templates/registry.ts`
4. Run `bun bench sync`

## Testing

Tests live in `prompt-bench/__tests__/*.test.ts`:
```bash
bun test prompt-bench               # All prompt-bench tests
bun test prompt-bench/compiler      # Specific test file
```

## Gotchas

- **Environment loading**: `.env` then `.env.local` (override) in cli.ts:17-18
- **Source images**: Paths resolved relative to batch file location
- **Idempotency**: Tests keyed by slug+version+variables+sourceHash to prevent duplicates
- **Evaluation images**: Fetched from R2 URLs, not local files
- **Path alias**: `@bench/*` → `./prompt-bench/*`
- **Shared Supabase**: Uses main app's admin client (`@/lib/supabase/admin`)
