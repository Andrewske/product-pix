# CLAUDE.md

ProductPix: AI product photo generator (Next.js 16, Supabase, Cloudflare R2, Gemini)

## Commands

```bash
# Development
bun dev/build/lint/test

# Prompt Bench CLI
bun bench test --template <slug> --batch <file>    # Full pipeline
bun bench run --template <slug> --batch <file>     # Generate only
bun bench evaluate --label <batch-label>           # Score images
bun bench compare --baseline <l1> --candidate <l2> # A/B testing
bun bench report --label <batch-label>             # HTML report
bun bench open-last-report                         # Open latest report
bun bench sync                                     # Sync templates to DB
bun bench improve                                  # AI-powered template improvement

# Supabase
npx supabase db push | gen types ts | migration new
```

## Architecture

```
src/lib/
  ai/           # Gemini provider (rawPrompt + image-to-image)
  db/           # Database queries (jobs, credits, generated_images, etc.)
  supabase/     # client (browser), server (SSR), admin (bypass RLS)
  r2/           # Presigned URLs, uploads (direct browser → R2)
  auth/         # Hooks, utils
  rate-limit/   # Request throttling
  images/       # Validation
  pricing/      # Multi-provider cost calculation (Anthropic, OpenAI, Google)

prompt-bench/   # Isolated CLI testing framework
  core/         # types, errors (Result<T>), compiler, evaluator, statistics
  commands/     # run, evaluate, compare, report, test, sync, improve, insights
  templates/    # registry + template definitions
  __tests__/    # Unit tests
```

**Key tables**: users, uploads, jobs, generated_images, credit_transactions, prompt_templates, prompt_tests, prompt_evaluations

**RPC**: `create_generation_job`, `add_credits`, `consume_credits`, `refund_credits`, `update_prompt_test_status`
## Architecture Decision: prompt-bench Integration

**Decision**: Keep prompt-bench as monorepo directory with build exclusion

**Rationale**: prompt-bench is ProductPix-specific dev tooling with tight coupling to:

- Supabase schema (prompt_templates, prompt_tests, generated_images tables)

- R2 storage infrastructure

- Gemini AI provider configuration

- Application pricing logic

**Implementation**: Dual TypeScript configs

- `tsconfig.json`: Root config for CLI and tests (includes prompt-bench/)
- **Next.js build uses tsconfig.build.json (excludes prompt-bench/)**, CLI uses root tsconfig.json

- `tsconfig.build.json`: Build config for Next.js (excludes prompt-bench/)

- Next.js uses `typescript.tsconfigPath: './tsconfig.build.json'`

**Benefits**:

- Clean separation without synchronization overhead

- Full functionality preserved for development/testing

- No Vercel deployment issues

- One-way dependency flow maintained (prompt-bench → src/)

**Future**: Migration to separate repo/package possible if coupling decreases

## Conventions

- **Package manager**: `bun` only (not npm/yarn/pnpm)
- **Path aliases**: `@/*` → `./src/*`, `@bench/*` → `./prompt-bench/*`
- **Error handling**: Result type (`ok`/`err`) in prompt-bench, try/catch in app
- **Barrel exports**: All lib modules via index.ts
- **API validation**: Zod schemas
- **Testing**: Jest for unit tests, 70-80% coverage target
- **TypeScript**: Strict mode, no `any`, explicit return types
- **Functions**: ≤20 lines, ≤3 nesting levels
- **Pricing config**: `prompt-bench.toml` at project root (committed)
- **Pricing updates**: User manually updates TOML when provider rates change
- **Fallback pricing**: Computed as MAX(all prices) * 1.5
- **Model matching**: Exact → prefix → fallback
- **Unknown models**: Use fallback, never guess provider

## Gotchas

- **R2 uploads**: Browser → presigned URL → R2 → confirm (NOT through server)
- **Source images**: Resolved relative to batch file, hash-deduplicated in R2
- **Idempotency**: Tests use keys to prevent duplicates on re-runs
- **Environment**: Load `.env` before `.env.local` (see `prompt-bench/cli.ts:17-18`)
- **R2 evaluation**: Evaluator fetches images directly from R2 URLs (not local files)

## Prompt Bench Framework

The `prompt-bench/` directory is a self-contained testing framework for iterative prompt engineering.

### Configuration

Default settings in `prompt-bench.toml`:
```toml
[defaults]
template = "ecommerce-base"                             # Default template for run/test/improve
batch_file = "prompt-bench/fixtures/images-batch.json"  # Default batch file path
label_prefix = "batch"                                  # Default label prefix
evaluation_model = "claude-sonnet-4-20250514"           # Default evaluation model

[defaults.report]
insights = true                                         # Generate AI insights by default
show_urls = false                                       # Show image URLs in reports
```

### Core Concepts

1. **Templates**: Prompt templates with variables (e.g., `ecommerce-base`)
2. **Batch files**: JSON test cases with variable values
3. **Pipeline**: run → evaluate → report (or `bun bench test` for all)
4. **Result type**: Explicit error handling (no exceptions)
5. **Idempotency**: Tests tracked by hash keys to prevent duplicate evaluations

### Test Workflow

```bash
# 1. Sync templates to database
bun bench sync

# 2. Run full pipeline
bun bench test --template ecommerce-base --batch tests/fixtures/products-mix.json

# 3. View results
bun bench open-last-report

# 4. Compare variants
bun bench test --template ecommerce-variant --batch tests/fixtures/products-mix.json --label variant-1
bun bench compare --baseline ecommerce-base-baseline --candidate variant-1
```

## Recent Updates (2025-12-07)

### New Features
- **Template improvement system**: AI-powered diagnostic approach for iterative template refinement
- **Config file support**: `prompt-bench.toml` for default settings

### Improvements
- **Enhanced reporting**: HTML reports with score distributions, baseline comparisons, AI insights
- **R2 integration**: Direct evaluation from R2 URLs instead of local files
- **Test orchestrator**: Unified pipeline with progress tracking
- **Source image support**: Image-to-image generation with deduplication
- **Directory reorganization**: `prompt-bench/` as isolated module with barrel exports

### Bug Fixes
- Fixed profile fetching errors in auth hooks
- Improved database migrations with proper ordering
- Added dependency injection for testable state management
- Fixed UUID generation for variation IDs
- Added proper source types for elite variations

### Documentation
- Template improvement system documentation

## Development Notes

### Adding New Templates

1. Create template file in `prompt-bench/templates/<name>.ts`
2. Export from `prompt-bench/templates/index.ts`
3. Register in `prompt-bench/templates/registry.ts`
4. Run `bun bench sync` to push to database

### Running Tests

```bash
# Unit tests
bun test

# Specific test file
bun test prompt-bench/__tests__/compiler.test.ts

# With coverage
bun test --coverage
```

### Known Issues

- Template data schema uses `z.any()` to avoid circular imports
