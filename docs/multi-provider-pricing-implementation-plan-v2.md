# Multi-Provider Pricing System Implementation Plan (v2 - Code Review Fixes Applied)

## Overview
Implement a shared pricing calculation system that supports multiple AI providers (Anthropic Claude, OpenAI, Google Gemini) for both the prompt-bench CLI and main ProductPix app. Pricing will be configured in TOML and consumed via a pure FP utility module.

**Key Changes from v1:**
- Added main ProductPix app cost tracking with `generation_costs` table
- Fixed model ID matching logic (exact → prefix → fallback)
- Fail-fast error handling for config issues (no silent failures)
- Dynamic fallback pricing (MAX * 1.5, not static)
- TOML location specified (project root, committed)
- Unknown models use fallback (removed unsafe Anthropic default)
- Fallback usage visibility in logs and reports
- Explicit validation behavior for edge cases
- Parallelization opportunities documented
- Baseline validation fixtures for repeatable testing

## Architecture Decisions

### Decision 1: Shared Library Location (`src/lib/pricing`)
**Rationale:**
- User requirement: "shared utility for both prompt-bench CLI AND main product-pix app"
- Follows existing pattern (`src/lib/ai`, `src/lib/r2`, `src/lib/supabase`)
- Path aliases already configured (`@/*` → `./src/*`)
- Avoids code duplication
- Single source of truth for pricing logic

### Decision 2: TOML for Configuration
**Rationale:**
- Existing `prompt-bench.toml` already in use
- Human-readable, easy to maintain
- Supports nested objects for provider-specific pricing
- Type-safe parsing with `@iarna/toml`
- **Location:** Project root (`/home/kevin/coding/product-pix/prompt-bench.toml`)
- **Deployment:** Committed to git (pricing changes via PRs)
- **Resolution:** `path.resolve(process.cwd(), 'prompt-bench.toml')`
- **Fallback:** Check `PRICING_CONFIG_PATH` env var for custom location

### Decision 3: Result Type for Error Handling
**Rationale:**
- Consistent with existing `prompt-bench/core/errors.ts` pattern
- Explicit error handling (no exceptions)
- **Changed from v1:** Fail-fast on config errors, not silent degradation
- **Config errors are FATAL:** Missing file, invalid TOML, schema errors → immediate failure
- **Model not in config:** Return Result with fallbackUsed=true, log warning
- **Validation errors:** Return err(VALIDATION_ERROR) for invalid inputs

### Decision 4: Model-First TOML Schema with Smart Matching
**Rationale:**
- Explicit model IDs reduce ambiguity
- Supports model versioning (e.g., `claude-sonnet-4-20250514`)
- **Model ID matching rules (in order):**
  1. Try exact match against config keys
  2. If no match, strip version suffix (e.g., "-20250514") and retry
  3. If still no match, use fallback pricing
  4. Never guess provider for unknown prefixes
- **Example:**
  - Input: `claude-sonnet-4` → tries exact, then fallback
  - Input: `claude-sonnet-4-20250514` → exact match
  - Input: `gpt-5-turbo` → tries exact, then fallback
  - Input: `gpt-claude-hybrid` → fallback (not Anthropic default)

### Decision 5: Dynamic Fallback Pricing with Safety Margin
**Rationale:**
- User requirement: "static configuration"
- **Changed from v1:** Fallback computed as MAX(all prices) * 1.5
- Conservative estimate ensures unknown models don't undercount costs
- Auto-updates when TOML pricing is updated
- Simple, no external API dependencies
- **Removed:** Static fallback values from TOML (computed dynamically)

### Decision 6: Cost Storage in Dedicated Table
**Rationale:**
- User requirement: New `generation_costs` table
- Separation of concerns (costs vs. generation data)
- Enables cost aggregation queries without JOINs
- Flexible schema for future analytics
- Tracks both prompt-bench and production generations

## Implementation Tasks

### Phase 1: Foundation

- [ ] Install TOML parsing dependency
  - Files: `package.json` (modify)
  - Command: `bun add @iarna/toml`
  - Acceptance: Package installed, lockfile updated

- [ ] Create pricing type definitions
  - Files: `src/lib/pricing/types.ts` (new)
  - Tests: `src/lib/pricing/__tests__/types.test.ts` (new)
  - Types to export:
    ```typescript
    export type Provider = 'anthropic' | 'openai' | 'google' | 'unknown';

    export interface ModelPricing {
      input: number;   // USD per 1M tokens
      output: number;  // USD per 1M tokens
    }

    export interface PricingConfig {
      anthropic: Record<string, ModelPricing>;
      openai: Record<string, ModelPricing>;
      google: Record<string, ModelPricing>;
      fallback: ModelPricing;          // Computed from max prices
      fallbackSource: string;          // Which model had max price
    }

    export interface TokenUsage {
      input: number;
      output: number;
    }

    export interface CostResult {
      inputCost: number;
      outputCost: number;
      total: number;
      modelId: string;
      provider: Provider;              // Can be 'unknown'
      fallbackUsed: boolean;
    }
    ```
  - Acceptance: All types exported, no TypeScript errors

- [ ] Add pricing configuration to TOML
  - Files: `prompt-bench.toml` at project root (modify)
  - Sections: `[pricing.anthropic]`, `[pricing.openai]`, `[pricing.google]`
  - **Removed:** `[pricing.fallback]` section (computed dynamically)
  - Models to include:
    - Anthropic: claude-sonnet-4, claude-sonnet-4-20250514, claude-opus-4, claude-opus-4-5, claude-haiku-4
    - OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo
    - Google: gemini-2.5-pro, gemini-3-pro-image-preview, gemini-3-pro-image-preview
  - Example:
    ```toml
    [pricing.anthropic]
    "claude-sonnet-4" = { input = 3.0, output = 15.0 }
    "claude-sonnet-4-20250514" = { input = 3.0, output = 15.0 }
    "claude-opus-4-5" = { input = 15.0, output = 75.0 }

    [pricing.openai]
    "gpt-4o" = { input = 2.5, output = 10.0 }
    "gpt-4-turbo" = { input = 10.0, output = 30.0 }

    [pricing.google]
    "gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
    ```
  - Acceptance: Valid TOML syntax, pricing values are numbers

### Phase 2: Core Pricing Logic

- [ ] Implement TOML config loader with fail-fast error handling
  - Files: `src/lib/pricing/config.ts` (new)
  - Tests: `src/lib/pricing/__tests__/config.test.ts` (new)
  - Functions: `loadPricingConfig()`, `clearPricingCache()`
  - Features:
    - Lazy loading with module-scoped caching
    - **TOML file location:**
      - Path: `path.resolve(process.cwd(), 'prompt-bench.toml')`
      - Fallback: Check `PRICING_CONFIG_PATH` env var
      - Must be committed to git (not gitignored)
    - **Fail-fast error handling:**
      - Missing file: Throw error (don't return Result)
      - Invalid TOML: Throw error with parse details
      - Missing pricing section: Throw error with schema validation
      - Config errors are FATAL (can't proceed without valid config)
    - **Dynamic fallback calculation:**
      - After parsing, compute: `input = MAX(all input prices) * 1.5`
      - After parsing, compute: `output = MAX(all output prices) * 1.5`
      - Store computed fallback in PricingConfig
      - Log computed fallback values on load (for transparency)
      - Track which model had max price (store in fallbackSource)
  - Acceptance:
    - Loads valid TOML correctly
    - Throws clear error for missing file
    - Throws clear error for invalid TOML
    - Throws clear error for missing pricing sections
    - Computes dynamic fallback correctly
    - Cache works correctly (one load per process)
    - Logs fallback values on startup

- [ ] Implement model-to-provider mapping with smart matching
  - Files: `src/lib/pricing/models.ts` (new)
  - Tests: `src/lib/pricing/__tests__/models.test.ts` (new)
  - Functions: `getProviderForModel()`, `getPricingForModel()`
  - **Model ID matching logic:**
    1. Try exact match against config keys
    2. If no match, strip version suffix (e.g., "-20250514") and retry
    3. If still no match, return 'unknown' provider + fallback pricing
    4. **Never default to Anthropic** for unknown prefixes
  - Acceptance:
    - Correctly maps claude-* → anthropic
    - Correctly maps gpt-* → openai
    - Correctly maps gemini-* → google
    - Returns 'unknown' provider for unrecognized prefixes
    - Returns fallback pricing for unknown models
    - Exact match works: `claude-sonnet-4-20250514`
    - Prefix match works: `claude-sonnet-4` (strips date, retries)
    - Unknown model works: `future-model-xyz` → 'unknown' + fallback
    - Cross-provider confusion: `gpt-claude-hybrid` → 'unknown' + fallback
  - Test cases MUST include all scenarios above

- [ ] Implement cost calculator with explicit validation
  - Files: `src/lib/pricing/calculator.ts` (new)
  - Tests: `src/lib/pricing/__tests__/calculator.test.ts` (new)
  - Function: `calculateCost(modelId: string, usage: TokenUsage): Result<CostResult>`
  - **Token validation:**
    - Negative tokens: Return `err(VALIDATION_ERROR, "Token counts cannot be negative")`
    - Zero tokens: Return `ok({ inputCost: 0, outputCost: 0, total: 0, ... })`
    - Large tokens (>10M): Allow (no arbitrary limits)
  - **Error classification:**
    - Model not in config: Return `ok()` with `fallbackUsed=true`, `provider='unknown'`
    - Negative tokens: Return `err(VALIDATION_ERROR)`
    - Zero tokens: Return `ok()` with zero costs (valid case)
  - Acceptance:
    - Calculates costs correctly for known models
    - Uses fallback pricing for unknown models
    - Returns err() for negative tokens with clear message
    - Returns ok() with zero cost for zero tokens
    - Returns proper Result types
    - Sets fallbackUsed flag correctly
    - Sets provider='unknown' for unknown models
  - Test cases MUST include:
    - input=-100, output=500 → err(VALIDATION_ERROR)
    - input=0, output=0 → ok({ total: 0 })
    - input=1_000_000, output=500_000 → ok({ total calculated })

- [ ] Create barrel export file
  - Files: `src/lib/pricing/index.ts` (new)
  - Exports: All public functions and types
  - Acceptance: Clean imports work (`import { calculateCost } from '@/lib/pricing'`)

### Phase 3: Update Prompt-Bench CLI (Parallelizable Tasks)

**Note:** After Phase 2 completes, these 3 tasks can run in parallel.

- [ ] [P1] Update evaluator cost calculation with fallback visibility
  - Files: `prompt-bench/core/evaluator.ts` (modify, lines 77-84, 228)
  - Changes:
    - Remove hardcoded `calculateCost()` function (lines 77-84)
    - Import `calculateCost` from `@/lib/pricing`
    - Update line 228 to use new function with Result handling
    - **Fallback visibility:**
      - When `fallbackUsed === true`, log to stderr: `⚠️  Using fallback pricing for model: {modelId}`
      - Use colored output (yellow for warnings)
      - Track fallback count for final summary
    - Gracefully handle cost calc errors (log warning, continue with cost=0)
  - Tests: `prompt-bench/core/__tests__/evaluator.test.ts` (modify)
  - Acceptance:
    - No hardcoded pricing
    - Cost tracked correctly
    - Fallback usage logged with color
    - Errors don't break evaluation
    - Tests pass

- [ ] [P1] Update insights cost calculation with fallback visibility
  - Files: `prompt-bench/commands/insights.ts` (modify, lines 139-146, 193, 248)
  - Changes:
    - Remove hardcoded `calculateCost()` function (lines 139-146)
    - Import `calculateCost` from `@/lib/pricing`
    - Update line 193 (generateInsights)
    - Update line 248 (generateStructuredInsights)
    - **Fallback visibility:** Same as evaluator (stderr warnings, color)
  - Tests: `prompt-bench/commands/__tests__/insights.test.ts` (create if missing)
  - Acceptance:
    - No hardcoded pricing
    - Cost tracked in both functions
    - Fallback usage logged
    - Tests pass

- [ ] [P1] Update evolution cost calculations with fallback visibility
  - Files: `prompt-bench/core/evolution.ts` (modify, ~lines 91, 143, 193)
  - Changes:
    - Import `calculateCost` from `@/lib/pricing`
    - Update mutation cost calculation (~line 91)
    - Update crossover cost calculation (~line 143)
    - Update wild variation cost calculation (~line 193)
    - **Fallback visibility:** Same as evaluator (stderr warnings, color)
  - Tests: `prompt-bench/core/__tests__/evolution.test.ts` (modify if exists)
  - Acceptance:
    - All 3 locations updated
    - Cost tracked correctly
    - Fallback usage logged
    - Tests pass

### Phase 4: Gemini Cost Tracking (Parallelizable Tasks)

**Note:** After Phase 2 completes, these tasks can run in parallel. Orchestrator depends on all Phase 3 tasks completing.

- [ ] Add usage field to GenerationResponse type
  - Files: `src/lib/ai/types.ts` (modify)
  - Changes:
    - Add optional `usage` field to `GenerationResponse` interface
    - Include: `promptTokens`, `completionTokens`, `totalTokens`
  - Acceptance: Type compiles, no breaking changes

- [ ] [P2] Extract Gemini usage in generateFromText
  - Files: `src/lib/ai/providers/gemini.ts` (modify, ~line 100)
  - Changes:
    - After `generateText()` call, extract usage from `result.usage`
    - Add usage to return object
    - Handle case where usage is undefined
  - Acceptance:
    - Usage extracted when available
    - Gracefully handles missing usage
    - No breaking changes

- [ ] [P2] Extract Gemini usage in generateFromImage
  - Files: `src/lib/ai/providers/gemini.ts` (modify, ~line 180)
  - Changes:
    - After `generateText()` call, extract usage from `result.usage`
    - Add usage to return object
    - Handle case where usage is undefined
  - Acceptance:
    - Usage extracted when available
    - Gracefully handles missing usage
    - No breaking changes

- [ ] Create generation_costs table migration
  - Files: `supabase/migrations/YYYYMMDDHHMMSS_create_generation_costs.sql` (new)
  - Schema:
    ```sql
    CREATE TABLE generation_costs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
      generated_image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
      model_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      input_cost_usd DECIMAL(10, 6) NOT NULL,
      output_cost_usd DECIMAL(10, 6) NOT NULL,
      total_cost_usd DECIMAL(10, 6) NOT NULL,
      fallback_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_generation_costs_job ON generation_costs(job_id);
    CREATE INDEX idx_generation_costs_image ON generation_costs(generated_image_id);
    CREATE INDEX idx_generation_costs_created ON generation_costs(created_at);
    ```
  - Acceptance: Migration runs successfully, tables created

- [ ] Add cost tracking to main app image generation API
  - Files: Identify generation API routes (likely `app/api/generate/route.ts` or similar)
  - Changes:
    - After successful generation, extract usage from GenerationResponse
    - Call `calculateCost(modelId, usage)`
    - Insert record into generation_costs table using Supabase admin client
    - Handle missing usage gracefully (don't fail generation)
    - Log warning if usage data missing
    - **Fallback visibility:** Log when fallbackUsed=true
  - Tests: Mock generation, verify cost inserted
  - Acceptance:
    - All production generations tracked
    - Missing usage doesn't break generation
    - Cost appears in generation_costs table
    - Fallback usage logged

- [ ] Add cost aggregation queries
  - Files: `src/lib/db/cost-queries.ts` (new)
  - Functions:
    - `getTotalCostByJob(jobId)`: Sum costs for a job
    - `getTotalCostByDateRange(start, end)`: Daily cost aggregation
    - `getTotalCostByModel(modelId)`: Cost breakdown by model
    - `getFallbackUsageCount()`: How many times fallback was used
  - Tests: Unit tests with mock data
  - Acceptance: All queries return correct aggregations

- [ ] Track generation costs in orchestrator (depends on Phase 3 + Gemini extraction)
  - Files: `prompt-bench/core/orchestrator.ts` (modify, location TBD)
  - Changes:
    - Import `calculateCost` from `@/lib/pricing`
    - Import `env` from `@/lib/env`
    - After generation, calculate cost using Gemini usage
    - Store cost in iteration state or database
    - **Fallback visibility:** Log when fallbackUsed=true
  - Tests: `prompt-bench/core/__tests__/orchestrator.test.ts` (modify if exists)
  - Acceptance:
    - Generation costs tracked
    - Costs appear in iteration reports
    - Fallback usage logged
    - Tests pass

### Phase 5: Testing & Validation

- [ ] Create pricing validation fixtures
  - Files: `src/lib/pricing/__tests__/fixtures/pricing-validation.json` (new)
  - Contents: Array of test cases with:
    ```json
    [
      {
        "modelId": "claude-sonnet-4-20250514",
        "usage": { "input": 1000000, "output": 500000 },
        "expectedCost": {
          "inputCost": 3.00,
          "outputCost": 7.50,
          "total": 10.50,
          "provider": "anthropic",
          "fallbackUsed": false
        },
        "source": "https://anthropic.com/pricing (verified 2025-12-08)"
      },
      {
        "modelId": "gpt-4o",
        "usage": { "input": 1000000, "output": 500000 },
        "expectedCost": {
          "inputCost": 2.50,
          "outputCost": 5.00,
          "total": 7.50,
          "provider": "openai",
          "fallbackUsed": false
        },
        "source": "https://openai.com/pricing (verified 2025-12-08)"
      },
      {
        "modelId": "unknown-model-xyz",
        "usage": { "input": 1000000, "output": 500000 },
        "expectedCost": {
          "provider": "unknown",
          "fallbackUsed": true
        },
        "source": "Fallback pricing (computed)"
      }
    ]
    ```
  - Test loads fixtures, calls calculateCost, asserts exact match
  - Acceptance: All fixture tests pass with actual TOML config

- [ ] Write comprehensive unit tests for calculator
  - Files: `src/lib/pricing/__tests__/calculator.test.ts` (new)
  - Test cases:
    - Known Anthropic model (claude-sonnet-4-20250514)
    - Known OpenAI model (gpt-4o)
    - Known Google model (gemini-3-pro-image-preview)
    - Unknown model uses fallback (provider='unknown')
    - Zero tokens → ok({ total: 0 })
    - Negative tokens → err(VALIDATION_ERROR)
    - Large token counts (1M+)
    - Model ID prefix match (claude-sonnet-4 without date)
  - Coverage target: ≥80%
  - Acceptance: All tests pass, coverage met

- [ ] Write config loader tests
  - Files: `src/lib/pricing/__tests__/config.test.ts` (new)
  - Test cases:
    - Load valid TOML
    - Missing config file throws error
    - Invalid TOML syntax throws error
    - Missing pricing section throws error
    - Cache behavior (load once per process)
    - Clear cache function
    - Dynamic fallback calculation
    - Fallback logging
  - Coverage target: ≥80%
  - Acceptance: All tests pass, coverage met

- [ ] Write model mapping tests
  - Files: `src/lib/pricing/__tests__/models.test.ts` (new)
  - Test cases:
    - Claude model → anthropic
    - GPT model → openai
    - Gemini model → google
    - Unknown model → 'unknown' provider (not Anthropic)
    - Exact model match
    - Prefix match (strip date suffix)
    - Fallback pricing
    - Cross-provider confusion (gpt-claude-hybrid → 'unknown')
  - Coverage target: ≥80%
  - Acceptance: All tests pass, coverage met

- [ ] Integration test with real config and multi-context scenarios
  - Files: `src/lib/pricing/__tests__/integration.test.ts` (new)
  - Test cases:
    - Load actual prompt-bench.toml
    - Calculate costs for all configured models
    - Verify pricing matches config
    - Verify costs match validation fixtures
    - **Multi-context tests:**
      - Load config from non-root working directory (use `process.chdir()`)
      - Attempt load when file is missing (verify error message)
      - Load, clear cache, load again (verify fresh read)
      - Modify TOML during test (verify cache isn't stale)
  - Acceptance: Tests pass with real config, all fixtures validated

- [ ] Add fallback tracking to reports
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Changes:
    - Count tests where fallbackUsed === true
    - Add HTML banner: `⚠️  {count} tests used fallback pricing`
    - List unique model IDs that triggered fallback
    - Add to console summary output
    - Show fallback source (which model had max price)
  - Acceptance: Fallback usage visible in all output formats

- [ ] Run full prompt-bench test suite
  - Command: `bun bench test --template ecommerce-base --batch prompt-bench/fixtures/images-batch.json`
  - Verification:
    - Check database `prompt_tests` table has `cost_usd` populated
    - Check `generation_costs` table has records
    - Check iteration reports show generation + evaluation costs
    - Verify no cost calculation errors in logs
    - Verify fallback warnings appear if unknown models used
    - Compare costs to validation fixtures
  - Acceptance: All costs tracked correctly, no errors, fallback usage visible

### Phase 6: Documentation & Cleanup

- [ ] Update CLAUDE.md with pricing system
  - Files: `CLAUDE.md` (modify)
  - Sections to update:
    - Add pricing system to Architecture section
    - Document TOML pricing configuration
    - Add to Conventions:
      - **Pricing config**: `prompt-bench.toml` at project root (committed)
      - **Pricing updates**: User manually updates TOML when provider rates change
      - **Fallback pricing**: Computed as MAX(all prices) * 1.5
      - **Model matching**: Exact → prefix → fallback
      - **Unknown models**: Use fallback, never guess provider
  - Acceptance: Documentation accurate and complete

- [ ] Add JSDoc comments to public APIs
  - Files: All files in `src/lib/pricing/`
  - Requirements:
    - Document all exported functions
    - Include parameter descriptions
    - Include return value descriptions
    - Include examples where helpful
    - Document error conditions
  - Acceptance: All public APIs documented

- [ ] Verify no TypeScript errors
  - Command: `bun tsc --noEmit`
  - Acceptance: Zero TypeScript errors

- [ ] Verify all tests pass
  - Command: `bun test`
  - Acceptance: All tests pass, coverage ≥75%

## Acceptance Criteria

### Functional Requirements
- ✅ Multi-provider support (Anthropic, OpenAI, Google, unknown)
- ✅ TOML-based pricing configuration (project root, committed)
- ✅ Shared utility works in both CLI and app
- ✅ Dynamic fallback pricing (MAX * 1.5, not static)
- ✅ Gemini generation costs tracked in production
- ✅ Claude evaluation costs tracked in prompt-bench
- ✅ Existing hardcoded calculations replaced
- ✅ Main app cost tracking via generation_costs table
- ✅ Fallback usage visible in logs and reports

### Technical Requirements
- ✅ All tests pass (`bun test`)
- ✅ No TypeScript errors (`bun tsc --noEmit`)
- ✅ Test coverage ≥75%
- ✅ Follows FP principles (pure functions, immutability)
- ✅ Uses Result type for error handling
- ✅ Strict TypeScript (no `any`, explicit return types)
- ✅ Functions ≤20 lines, ≤3 nesting levels
- ✅ Fail-fast on config errors (not silent degradation)
- ✅ Smart model matching (exact → prefix → fallback)

### Validation Requirements
- ✅ Prompt-bench test completes successfully
- ✅ Database shows accurate costs in generation_costs table
- ✅ Iteration reports include generation + evaluation costs
- ✅ No cost calculation errors in logs
- ✅ Costs match validation fixtures
- ✅ Fallback usage warnings appear when appropriate
- ✅ Unknown models use fallback (not Anthropic default)

### Documentation Requirements
- ✅ CLAUDE.md updated with pricing conventions
- ✅ All public APIs have JSDoc comments
- ✅ TOML pricing config documented
- ✅ Architecture decisions recorded
- ✅ Fallback calculation explained

## Files to Create

### Source Files
1. `src/lib/pricing/index.ts` - Barrel exports
2. `src/lib/pricing/types.ts` - Type definitions
3. `src/lib/pricing/calculator.ts` - Cost calculation function
4. `src/lib/pricing/config.ts` - TOML loading and caching
5. `src/lib/pricing/models.ts` - Model-to-provider mapping
6. `src/lib/db/cost-queries.ts` - Cost aggregation queries

### Test Files
7. `src/lib/pricing/__tests__/calculator.test.ts` - Calculator tests
8. `src/lib/pricing/__tests__/config.test.ts` - Config loader tests
9. `src/lib/pricing/__tests__/models.test.ts` - Model mapping tests
10. `src/lib/pricing/__tests__/integration.test.ts` - Integration tests
11. `src/lib/pricing/__tests__/fixtures/pricing-validation.json` - Validation fixtures

### Database Migrations
12. `supabase/migrations/YYYYMMDDHHMMSS_create_generation_costs.sql` - Cost tracking table

## Files to Modify

### Configuration
1. `package.json` - Add @iarna/toml dependency
2. `prompt-bench.toml` - Add [pricing] sections (remove static fallback)

### Prompt-Bench CLI
3. `prompt-bench/core/evaluator.ts` - Replace hardcoded pricing (lines 77-84, 228)
4. `prompt-bench/commands/insights.ts` - Replace hardcoded pricing (lines 139-146, 193, 248)
5. `prompt-bench/core/evolution.ts` - Replace hardcoded pricing (~lines 91, 143, 193)
6. `prompt-bench/core/orchestrator.ts` - Add generation cost tracking
7. `prompt-bench/commands/report.ts` - Add fallback usage tracking

### Main App
8. `src/lib/ai/types.ts` - Add usage field to GenerationResponse
9. `src/lib/ai/providers/gemini.ts` - Extract usage data (lines ~100, ~180)
10. API route for image generation - Add cost tracking (file path TBD)

### Documentation
11. `CLAUDE.md` - Document pricing system

## Dependencies

### External Dependencies
- **@iarna/toml** (new): Full TOML v1.0 parser
  - Purpose: Parse nested TOML configuration
  - Alternative considered: Custom parser (insufficient for nested objects)
  - Installation: `bun add @iarna/toml`

### Internal Dependencies
- **@bench/core/errors**: Result type, createError, ok, err
- **@/lib/env**: Environment variables (GEMINI_MODEL)
- **Anthropic SDK**: Usage data from API responses
- **Vercel AI SDK**: Gemini usage data

### Task Dependencies

**Sequential dependencies:**
- Phase 1 must complete before Phase 2
- Phase 2 must complete before Phase 3 and Phase 4

**Parallel execution opportunities:**
After Phase 2 completes, these can run concurrently:
- **[P1]** Phase 3: evaluator.ts (independent)
- **[P1]** Phase 3: insights.ts (independent)
- **[P1]** Phase 3: evolution.ts (independent)
- **[P2]** Phase 4: Gemini generateFromText extraction (independent)
- **[P2]** Phase 4: Gemini generateFromImage extraction (independent)
- **[P2]** Phase 4: generation_costs migration (independent)
- **[P2]** Phase 4: cost aggregation queries (independent)

**After P1 and P2 complete:**
- Phase 4: orchestrator cost tracking (depends on all Phase 3 + Gemini extraction)
- Phase 4: API route cost tracking (depends on Gemini extraction + migration)

**After Phase 3 and Phase 4 complete:**
- Phase 5 (all testing tasks can run in parallel)

**After Phase 5 complete:**
- Phase 6 (documentation tasks can run in parallel)

## TOML Pricing Configuration Schema

```toml
# Pricing configuration (USD per 1M tokens)
# Manually maintained by user when provider rates change
# Fallback pricing computed dynamically as MAX(all prices) * 1.5

[pricing.anthropic]
"claude-sonnet-4" = { input = 3.0, output = 15.0 }
"claude-sonnet-4-20250514" = { input = 3.0, output = 15.0 }
"claude-opus-4" = { input = 15.0, output = 75.0 }
"claude-opus-4-5" = { input = 15.0, output = 75.0 }
"claude-haiku-4" = { input = 0.25, output = 1.25 }

[pricing.openai]
"gpt-4o" = { input = 2.5, output = 10.0 }
"gpt-4o-mini" = { input = 0.15, output = 0.6 }
"gpt-4-turbo" = { input = 10.0, output = 30.0 }

[pricing.google]
"gemini-2.5-pro" = { input = 1.25, output = 5.0 }
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }

# NOTE: No [pricing.fallback] section
# Fallback is computed dynamically on config load:
#   input = MAX(all input prices) * 1.5
#   output = MAX(all output prices) * 1.5
# Based on current config: input=22.5, output=112.5 (from claude-opus-4-5)
```

## Implementation Notes

### Error Handling Strategy
- **Config loading errors:** Throw immediately (FATAL)
  - Missing file: Clear error with file path
  - Invalid TOML: Parse error with line number
  - Missing pricing section: Schema validation error
- **Validation errors:** Return Result with VALIDATION_ERROR
  - Negative tokens: Explicit error message
  - Invalid model ID: Return 'unknown' + fallback
- **Cost calculation in CLI:** Log warning to stderr, continue with cost=0
  - Use colored output (yellow) for warnings
  - Track fallback usage count for summaries
- **Missing usage data from Gemini:** Gracefully handle, don't fail generation
  - Log warning with model ID
  - Don't insert cost record if usage missing

### Caching Strategy
- Config loaded once per Node.js process (module-scoped cache)
- Each serverless function instance gets its own cache (acceptable)
- No TTL expiration (config changes require deployment)
- Cache cleared via `clearPricingCache()` (useful for testing)
- **Next.js multi-context behavior:**
  - Server components, API routes, middleware each have separate caches
  - Config updates require full redeployment (all instances restart)
  - Document in CLAUDE.md

### Testing Strategy
- Unit tests: Individual functions in isolation (≥80% coverage each)
- Integration tests: Load real config, verify end-to-end
- Validation fixtures: Known-good test cases with expected costs
- Manual validation: Run prompt-bench test, verify database

### Code Style Requirements
- Strict TypeScript (no `any`, explicit return types)
- Pure functions (no side effects except config loading)
- Immutable data structures
- Functions ≤20 lines
- Nesting ≤3 levels
- Result type for error handling
- Kebab-case for files, camelCase for vars, PascalCase for types

## Risk Mitigation

### Risk: TOML parsing fails in production
**Mitigation:**
- Fail-fast error handling (catch at startup, not runtime)
- Comprehensive error messages with file paths
- Config validation on load
- TOML committed to git (reviewed via PRs)
- Test with real config in CI

### Risk: Usage data missing from AI SDKs
**Mitigation:**
- Optional usage field in types
- Graceful degradation (cost=0 if missing)
- Log warnings for debugging
- Don't fail operations on missing cost data

### Risk: Fallback pricing too low for new models
**Mitigation:**
- Dynamic calculation (MAX * 1.5)
- Auto-updates when TOML is updated
- Log fallback values on startup
- Visible warnings in reports when used

### Risk: Breaking changes to existing cost tracking
**Mitigation:**
- All changes are additive (new table, not modifying existing)
- Existing database schema unchanged
- Result type allows backward compatibility
- Comprehensive tests before deployment

### Risk: Performance impact from config loading
**Mitigation:**
- Lazy loading with caching
- Config loaded once per process
- No repeated file I/O
- Minimal overhead (~1ms per calculation)

### Risk: Silent cost tracking failures
**Mitigation:**
- Fail-fast on config errors (not silent)
- Visible warnings for fallback usage (stderr, colored, reports)
- Track fallback count in summaries
- Log missing usage data
- Comprehensive testing with fixtures
