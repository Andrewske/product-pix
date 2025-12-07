# Phase 3: Move Files

## Overview
Move all prompt testing framework files from their current locations to the new `prompt-bench/` directory structure.

## Tasks

### 3.1 Move Core Framework Files

Move from `src/lib/prompts/` to `prompt-bench/core/`:

| Source | Destination |
|--------|-------------|
| `src/lib/prompts/types.ts` | `prompt-bench/core/types.ts` |
| `src/lib/prompts/errors.ts` | `prompt-bench/core/errors.ts` |
| `src/lib/prompts/compiler.ts` | `prompt-bench/core/compiler.ts` |
| `src/lib/prompts/evaluator.ts` | `prompt-bench/core/evaluator.ts` |
| `src/lib/prompts/statistics.ts` | `prompt-bench/core/statistics.ts` |
| `src/lib/prompts/orchestrator.ts` | `prompt-bench/core/orchestrator.ts` |
| `src/lib/prompts/source-image.ts` | `prompt-bench/core/source-image.ts` |

Commands:
```bash
mv src/lib/prompts/types.ts prompt-bench/core/
mv src/lib/prompts/errors.ts prompt-bench/core/
mv src/lib/prompts/compiler.ts prompt-bench/core/
mv src/lib/prompts/evaluator.ts prompt-bench/core/
mv src/lib/prompts/statistics.ts prompt-bench/core/
mv src/lib/prompts/orchestrator.ts prompt-bench/core/
mv src/lib/prompts/source-image.ts prompt-bench/core/
```

### 3.2 Move Template Files

Move from `src/lib/prompts/` to `prompt-bench/templates/`:

| Source | Destination |
|--------|-------------|
| `src/lib/prompts/registry.ts` | `prompt-bench/templates/registry.ts` |
| `src/lib/prompts/templates/ecommerce-base.ts` | `prompt-bench/templates/ecommerce-base.ts` |
| `src/lib/prompts/templates/lifestyle-product.ts` | `prompt-bench/templates/lifestyle-product.ts` |
| `src/lib/prompts/templates/index.ts` | `prompt-bench/templates/index.ts` |

Commands:
```bash
mv src/lib/prompts/registry.ts prompt-bench/templates/
mv src/lib/prompts/templates/ecommerce-base.ts prompt-bench/templates/
mv src/lib/prompts/templates/lifestyle-product.ts prompt-bench/templates/
mv src/lib/prompts/templates/index.ts prompt-bench/templates/
```

### 3.3 Move Database Operations

| Source | Destination |
|--------|-------------|
| `src/lib/prompts/db/templates.ts` | `prompt-bench/db/templates.ts` |

Commands:
```bash
mv src/lib/prompts/db/templates.ts prompt-bench/db/
```

### 3.4 Move CLI Entry Point and Commands

| Source | Destination |
|--------|-------------|
| `scripts/prompt-bench.ts` | `prompt-bench/cli.ts` |
| `scripts/commands/run.ts` | `prompt-bench/commands/run.ts` |
| `scripts/commands/evaluate.ts` | `prompt-bench/commands/evaluate.ts` |
| `scripts/commands/compare.ts` | `prompt-bench/commands/compare.ts` |
| `scripts/commands/report.ts` | `prompt-bench/commands/report.ts` |
| `scripts/commands/sync.ts` | `prompt-bench/commands/sync.ts` |
| `scripts/commands/test.ts` | `prompt-bench/commands/test.ts` |
| `scripts/commands/progress.ts` | `prompt-bench/commands/progress.ts` |
| `scripts/commands/insights.ts` | `prompt-bench/commands/insights.ts` |
| `scripts/commands/shared.ts` | `prompt-bench/commands/shared.ts` |

Commands:
```bash
mv scripts/prompt-bench.ts prompt-bench/cli.ts
mv scripts/commands/run.ts prompt-bench/commands/
mv scripts/commands/evaluate.ts prompt-bench/commands/
mv scripts/commands/compare.ts prompt-bench/commands/
mv scripts/commands/report.ts prompt-bench/commands/
mv scripts/commands/sync.ts prompt-bench/commands/
mv scripts/commands/test.ts prompt-bench/commands/
mv scripts/commands/progress.ts prompt-bench/commands/
mv scripts/commands/insights.ts prompt-bench/commands/
mv scripts/commands/shared.ts prompt-bench/commands/
```

### 3.5 Move Test Files

| Source | Destination |
|--------|-------------|
| `src/lib/prompts/__tests__/compiler.test.ts` | `prompt-bench/__tests__/compiler.test.ts` |
| `src/lib/prompts/__tests__/errors.test.ts` | `prompt-bench/__tests__/errors.test.ts` |
| `src/lib/prompts/__tests__/statistics.test.ts` | `prompt-bench/__tests__/statistics.test.ts` |
| `src/lib/prompts/__tests__/source-image.test.ts` | `prompt-bench/__tests__/source-image.test.ts` |
| `src/lib/prompts/__tests__/types.test.ts` | `prompt-bench/__tests__/types.test.ts` |

Commands:
```bash
mv src/lib/prompts/__tests__/compiler.test.ts prompt-bench/__tests__/
mv src/lib/prompts/__tests__/errors.test.ts prompt-bench/__tests__/
mv src/lib/prompts/__tests__/statistics.test.ts prompt-bench/__tests__/
mv src/lib/prompts/__tests__/source-image.test.ts prompt-bench/__tests__/
mv src/lib/prompts/__tests__/types.test.ts prompt-bench/__tests__/
```

### 3.6 Move Test Fixtures

| Source | Destination |
|--------|-------------|
| `tests/fixtures/products-mix.json` | `prompt-bench/fixtures/products-mix.json` |
| `tests/fixtures/images-batch.json` | `prompt-bench/fixtures/images-batch.json` |
| `tests/fixtures/images/*` | `prompt-bench/fixtures/images/` |

Commands:
```bash
mv tests/fixtures/products-mix.json prompt-bench/fixtures/
mv tests/fixtures/images-batch.json prompt-bench/fixtures/
mv tests/fixtures/images/* prompt-bench/fixtures/images/
```

## Final Structure

After this phase:

```
prompt-bench/
├── cli.ts
├── commands/
│   ├── run.ts
│   ├── evaluate.ts
│   ├── compare.ts
│   ├── report.ts
│   ├── sync.ts
│   ├── test.ts
│   ├── progress.ts
│   ├── insights.ts
│   └── shared.ts
├── core/
│   ├── types.ts
│   ├── errors.ts
│   ├── compiler.ts
│   ├── evaluator.ts
│   ├── statistics.ts
│   ├── orchestrator.ts
│   └── source-image.ts
├── templates/
│   ├── registry.ts
│   ├── ecommerce-base.ts
│   ├── lifestyle-product.ts
│   └── index.ts
├── db/
│   └── templates.ts
├── __tests__/
│   ├── compiler.test.ts
│   ├── errors.test.ts
│   ├── statistics.test.ts
│   ├── source-image.test.ts
│   └── types.test.ts
└── fixtures/
    ├── products-mix.json
    ├── images-batch.json
    └── images/
        └── tester-1-suitcase.jpg
```

## Verification
```bash
find prompt-bench -type f -name "*.ts" | wc -l
# Should show ~20+ TypeScript files
```

## Dependencies
- Phase 2 (Directory Structure) must be complete

## Next Phase
Phase 4: Update Import Statements
