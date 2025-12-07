# CLAUDE.md

ProductPix: AI product photo generator (Next.js 16, Supabase, Cloudflare R2, Gemini)

## Commands

```bash
bun dev/build/lint/test     # Standard commands
bun bench run --template <slug> --batch <file> [--label <name>]
bun bench test --template <slug> --batch <file>  # Full pipeline
bun bench evaluate/compare/report/sync/progress  # See --help
```

**Supabase**: `npx supabase db push | gen types ts | migration new`

## Architecture

```
src/lib/ai/          # Gemini provider (rawPrompt + image-to-image)
src/lib/db/          # Database queries
src/lib/supabase/    # client (browser), server (SSR), admin (bypass RLS)
src/lib/r2/          # Presigned URLs, uploads
prompt-bench/        # CLI testing framework (isolated)
  core/              # types, errors (Result type), compiler, evaluator, statistics
  commands/          # run, evaluate, compare, report, test, sync
  templates/         # registry + template definitions
```

**Key tables**: users, uploads, jobs, generated_images, credit_transactions, prompt_templates, prompt_tests, prompt_evaluations

**RPC**: `create_generation_job`, `add_credits`, `consume_credits`, `refund_credits`, `update_prompt_test_status`

## Conventions

- **Package manager**: `bun` only (not npm/yarn/pnpm)
- **Path aliases**: `@/*` → `./src/*`, `@bench/*` → `./prompt-bench/*`
- **Error handling**: Result type (`ok`/`err`) in prompt-bench
- **Barrel exports**: All lib modules via index.ts
- **API validation**: Zod schemas

## Gotchas

- **R2 uploads**: Browser → presigned URL → R2 → confirm (not through server)
- **Source images**: Resolved relative to batch file, hash-deduplicated in R2
- **Idempotency**: Tests use keys to prevent duplicates on re-runs
