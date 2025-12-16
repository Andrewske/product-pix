# AI Product Analysis Integration - Implementation Tasks

This directory contains the implementation plan for integrating AI product analysis into prompt-bench. The feature extracts product attributes (product, color, material, shape, features) from source images and automatically populates template variables.

## Overview

**Goal:** Add AI product analysis to prompt-bench that mirrors the `/generate` endpoint functionality while maintaining architectural isolation.

**Key Decisions:**
- Database-stored analysis prompts (mirrors template pattern)
- Manual precedence: user variables override AI analysis
- Fail-fast error handling (no silent failures)
- Multi-image consensus merging (majority vote + union)
- Batch-level caching with combined image hash
- Compiler auto-strips empty variables

## Task Sequence

Execute tasks in order. Each task has clear dependencies and acceptance criteria.

### Phase 1: Foundation (Tasks 1-3)
1. **[Database Migrations](01-database-migrations.md)** - Create tables for analysis prompts and cache
2. **[Analysis Prompt Definition](02-analysis-prompt-definition.md)** - Define product analysis prompt and registry
3. **[Prompt-Bench Sync Infrastructure](03-prompt-bench-sync-infrastructure.md)** - Implement sync mechanism

### Phase 2: Core Logic (Tasks 4-6)
4. **[Consensus and Cache Logic](04-consensus-and-cache-logic.md)** - Majority vote merging and cache management
5. **[Product Analyzer Implementation](05-product-analyzer-implementation.md)** - Main analysis orchestrator
6. **[Compiler Enhancement](06-compiler-empty-variable-stripping.md)** - Strip empty variables from prompts

### Phase 3: Integration (Tasks 7-9)
7. **[Orchestrator Integration](07-orchestrator-integration.md)** - Add analysis to collection generation flow
8. **[Configuration and CLI](08-configuration-and-cli.md)** - Add config options and CLI flags
9. **[Main App DB Integration](09-main-app-db-integration.md)** - Update main app to use DB prompts

### Phase 4: Validation (Task 10)
10. **[Testing and Validation](10-testing-and-validation.md)** - Unit tests, integration tests, validation

## Quick Start

```bash
# 1. Apply database migrations
npx supabase db push

# 2. Sync analysis prompts to database
bun bench sync-analysis

# 3. Test with collection batch
bun bench test --template multi-angle-collection --batch fixtures/multi-image-batch.json

# 4. Verify results
psql -d productpix -c "SELECT * FROM analysis_prompts;"
psql -d productpix -c "SELECT inputs FROM prompt_tests WHERE inputs ? 'analysis' LIMIT 3;"
```

## CLI Commands

```bash
# Sync analysis prompts to database
bun bench sync-analysis

# Run with analysis (default)
bun bench test --template ecommerce-base --batch fixtures/batch.json

# Override analysis model
bun bench test --analysis-model gemini-2.0-flash-exp --batch fixtures/batch.json

# Disable analysis
bun bench test --no-analysis --batch fixtures/batch.json

# Disable cache (force fresh analysis)
bun bench test --no-cache --batch fixtures/batch.json
```

## Configuration

Add to `prompt-bench.toml`:

```toml
[defaults]
analysis_model = "gemini-2.0-flash"

[defaults.analysis]
enabled = true
cache_enabled = true
prompt_slug = "product-analysis"
```

## Key Files Created

**Database:**
- `supabase/migrations/00044_create_analysis_prompts.sql`
- `supabase/migrations/00045_create_analysis_cache.sql`

**Analysis Infrastructure:**
- `src/lib/analysis/prompts/product-analysis.ts`
- `src/lib/analysis/prompts/registry.ts`
- `src/lib/db/analysis-prompts.ts`

**Prompt-Bench Core:**
- `prompt-bench/core/product-analyzer.ts`
- `prompt-bench/core/consensus.ts`
- `prompt-bench/core/analysis-cache.ts`
- `prompt-bench/db/analysis-prompts.ts`
- `prompt-bench/commands/sync-analysis.ts`

**Tests:**
- `prompt-bench/__tests__/consensus.test.ts`
- `prompt-bench/__tests__/analysis-cache.test.ts`
- Updates to `prompt-bench/__tests__/compiler.test.ts`

## Key Files Modified

- `prompt-bench/core/orchestrator.ts` (lines 506-517, 523, 609)
- `prompt-bench/core/compiler.ts` (add stripEmptyVariables)
- `prompt-bench.toml` (add analysis config)
- `prompt-bench/cli.ts` (add sync-analysis command, CLI flags)
- `src/lib/ai/product-analyzer.ts` (fetch prompt from DB)

## Success Criteria

- [ ] Analysis prompts stored in database, synced via `bun bench sync-analysis`
- [ ] Product analysis extracts all 5 fields (product, color, material, shape, features)
- [ ] Multi-image analysis uses consensus merging (majority vote + union)
- [ ] Cache prevents redundant analysis for same image batches
- [ ] Manual variables override AI analysis (manual precedence)
- [ ] Analysis failures fail fast with detailed errors
- [ ] Empty variables stripped from compiled prompts (no ", , " artifacts)
- [ ] Analysis model configurable via config + CLI
- [ ] Existing collection batches work without modification
- [ ] Analysis results stored in `prompt_tests.inputs.analysis` for audit

## Architecture Patterns

This implementation follows existing prompt-bench patterns:

1. **Database-backed configuration** - Like prompt templates
2. **Sync mechanism** - Mirror `bun bench sync` pattern
3. **Result type error handling** - Railway-oriented programming
4. **Idempotent operations** - Safe to run multiple times
5. **Admin client usage** - Bypass RLS for CLI operations
6. **JSONB storage** - Flexible schema for analysis results

## Dependencies

- Supabase database access
- Gemini API access (for analysis)
- Existing prompt-bench infrastructure
- Node.js crypto module (for image hashing)

## Troubleshooting

**Analysis fails with "prompt not found":**
```bash
bun bench sync-analysis  # Sync prompts first
```

**Cache not working:**
```bash
# Check cache table
psql -d productpix -c "SELECT COUNT(*) FROM analysis_cache;"

# Test without cache
bun bench test --no-cache --batch fixtures/batch.json
```

**Manual variables not overriding AI:**
- Check variable merge order in orchestrator.ts line 523
- AI values should come before manual values in spread

**Empty variables creating ", ," in prompts:**
- Verify stripEmptyVariables is applied in compiler.ts line 219
- Check unit tests in compiler.test.ts

## Next Steps

After completing all tasks:

1. Run full test suite: `bun test prompt-bench`
2. Test with real product images
3. Verify analysis quality and accuracy
4. Monitor cache hit rates
5. Update documentation with examples
6. Consider adding analysis quality metrics to reports
