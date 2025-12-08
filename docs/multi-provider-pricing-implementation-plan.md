# Multi-Provider Pricing System Implementation Plan

## Overview
Implement a shared pricing calculation system that supports multiple AI providers (Anthropic Claude, OpenAI, Google Gemini) for both the prompt-bench CLI and main ProductPix app. Pricing will be configured in TOML and consumed via a pure FP utility module.

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

### Decision 3: Result Type for Error Handling
**Rationale:**
- Consistent with existing `prompt-bench/core/errors.ts` pattern
- Explicit error handling (no exceptions)
- Cost calculation errors shouldn't crash evaluations
- Graceful degradation (cost = 0 on error)

### Decision 4: Model-First TOML Schema
**Rationale:**
- Explicit model IDs reduce ambiguity
- Supports model versioning (e.g., `claude-sonnet-4-20250514`)
- No complex pattern matching logic
- Clear, predictable lookups

### Decision 5: Static Configuration with Fallback Pricing
**Rationale:**
- User requirement: "static configuration"
- Conservative fallback ensures unknown models don't crash
- Simple, no external API dependencies
- Pricing changes infrequently

## Implementation Tasks

### Phase 1: Foundation

- [ ] Install TOML parsing dependency
  - Files: `package.json` (modify)
  - Command: `bun add @iarna/toml`
  - Acceptance: Package installed, lockfile updated

- [ ] Create pricing type definitions
  - Files: `src/lib/pricing/types.ts` (new)
  - Tests: `src/lib/pricing/__tests__/types.test.ts` (new)
  - Exports: `Provider`, `ModelPricing`, `PricingConfig`, `TokenUsage`, `CostResult`
  - Acceptance: All types exported, no TypeScript errors

- [ ] Add pricing configuration to TOML
  - Files: `prompt-bench.toml` (modify)
  - Sections: `[pricing.anthropic]`, `[pricing.openai]`, `[pricing.google]`, `[pricing.fallback]`
  - Models to include:
    - Anthropic: claude-sonnet-4, claude-sonnet-4-20250514, claude-opus-4, claude-opus-4-5, claude-haiku-4
    - OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo
    - Google: gemini-2.5-pro, gemini-3-pro-image-preview, gemini-3-pro-image-preview
  - Acceptance: Valid TOML syntax, pricing values are numbers

### Phase 2: Core Pricing Logic

- [ ] Implement TOML config loader
  - Files: `src/lib/pricing/config.ts` (new)
  - Tests: `src/lib/pricing/__tests__/config.test.ts` (new)
  - Functions: `loadPricingConfig()`, `clearPricingCache()`
  - Features:
    - Lazy loading with caching
    - Result type error handling
    - Validation of config structure
  - Acceptance:
    - Loads valid TOML correctly
    - Returns error for missing file
    - Returns error for invalid TOML
    - Cache works correctly

- [ ] Implement model-to-provider mapping
  - Files: `src/lib/pricing/models.ts` (new)
  - Tests: `src/lib/pricing/__tests__/models.test.ts` (new)
  - Functions: `getProviderForModel()`, `getPricingForModel()`
  - Acceptance:
    - Correctly maps claude-* → anthropic
    - Correctly maps gpt-* → openai
    - Correctly maps gemini-* → google
    - Returns fallback for unknown models
    - Defaults to anthropic for unrecognized prefixes

- [ ] Implement cost calculator
  - Files: `src/lib/pricing/calculator.ts` (new)
  - Tests: `src/lib/pricing/__tests__/calculator.test.ts` (new)
  - Function: `calculateCost(modelId: string, usage: TokenUsage): Result<CostResult>`
  - Acceptance:
    - Calculates costs correctly for known models
    - Uses fallback pricing for unknown models
    - Validates negative token counts
    - Handles zero tokens correctly
    - Returns proper Result types
    - Sets fallbackUsed flag correctly

- [ ] Create barrel export file
  - Files: `src/lib/pricing/index.ts` (new)
  - Exports: All public functions and types
  - Acceptance: Clean imports work (`import { calculateCost } from '@/lib/pricing'`)

### Phase 3: Update Prompt-Bench CLI

- [ ] Update evaluator cost calculation
  - Files: `prompt-bench/core/evaluator.ts` (modify, lines 77-84, 228)
  - Changes:
    - Remove hardcoded `calculateCost()` function (lines 77-84)
    - Import `calculateCost` from `@/lib/pricing`
    - Update line 228 to use new function with Result handling
    - Gracefully handle cost calc errors (log warning, continue with cost=0)
  - Tests: `prompt-bench/core/__tests__/evaluator.test.ts` (modify)
  - Acceptance:
    - No hardcoded pricing
    - Cost tracked correctly
    - Errors don't break evaluation
    - Tests pass

- [ ] Update insights cost calculation
  - Files: `prompt-bench/commands/insights.ts` (modify, lines 139-146, 193, 248)
  - Changes:
    - Remove hardcoded `calculateCost()` function (lines 139-146)
    - Import `calculateCost` from `@/lib/pricing`
    - Update line 193 (generateInsights)
    - Update line 248 (generateStructuredInsights)
  - Tests: `prompt-bench/commands/__tests__/insights.test.ts` (create if missing)
  - Acceptance:
    - No hardcoded pricing
    - Cost tracked in both functions
    - Tests pass

- [ ] Update evolution cost calculations
  - Files: `prompt-bench/core/evolution.ts` (modify, ~lines 91, 143, 193)
  - Changes:
    - Import `calculateCost` from `@/lib/pricing`
    - Update mutation cost calculation (~line 91)
    - Update crossover cost calculation (~line 143)
    - Update wild variation cost calculation (~line 193)
  - Tests: `prompt-bench/core/__tests__/evolution.test.ts` (modify if exists)
  - Acceptance:
    - All 3 locations updated
    - Cost tracked correctly
    - Tests pass

### Phase 4: Gemini Cost Tracking

- [ ] Add usage field to GenerationResponse type
  - Files: `src/lib/ai/types.ts` (modify)
  - Changes:
    - Add optional `usage` field to `GenerationResponse` interface
    - Include: `promptTokens`, `completionTokens`, `totalTokens`
  - Acceptance: Type compiles, no breaking changes

- [ ] Extract Gemini usage in generateFromText
  - Files: `src/lib/ai/providers/gemini.ts` (modify, ~line 100)
  - Changes:
    - After `generateText()` call, extract usage from `result.usage`
    - Add usage to return object
    - Handle case where usage is undefined
  - Acceptance:
    - Usage extracted when available
    - Gracefully handles missing usage
    - No breaking changes

- [ ] Extract Gemini usage in generateFromImage
  - Files: `src/lib/ai/providers/gemini.ts` (modify, ~line 180)
  - Changes:
    - After `generateText()` call, extract usage from `result.usage`
    - Add usage to return object
    - Handle case where usage is undefined
  - Acceptance:
    - Usage extracted when available
    - Gracefully handles missing usage
    - No breaking changes

- [ ] Track generation costs in orchestrator
  - Files: `prompt-bench/core/orchestrator.ts` (modify, location TBD)
  - Changes:
    - Import `calculateCost` from `@/lib/pricing`
    - Import `env` from `@/lib/env`
    - After generation, calculate cost using Gemini usage
    - Store cost in iteration state or database
  - Tests: `prompt-bench/core/__tests__/orchestrator.test.ts` (modify if exists)
  - Acceptance:
    - Generation costs tracked
    - Costs appear in iteration reports
    - Tests pass

### Phase 5: Testing & Validation

- [ ] Write comprehensive unit tests for calculator
  - Files: `src/lib/pricing/__tests__/calculator.test.ts` (new)
  - Test cases:
    - Known Anthropic model (claude-sonnet-4-20250514)
    - Known OpenAI model (gpt-4o)
    - Known Google model (gemini-3-pro-image-preview)
    - Unknown model uses fallback
    - Zero tokens
    - Negative tokens validation
    - Large token counts
    - Model ID aliases
  - Coverage target: ≥80%
  - Acceptance: All tests pass, coverage met

- [ ] Write config loader tests
  - Files: `src/lib/pricing/__tests__/config.test.ts` (new)
  - Test cases:
    - Load valid TOML
    - Missing config file error
    - Invalid TOML syntax error
    - Missing pricing section error
    - Cache behavior
    - Clear cache function
  - Coverage target: ≥80%
  - Acceptance: All tests pass, coverage met

- [ ] Write model mapping tests
  - Files: `src/lib/pricing/__tests__/models.test.ts` (new)
  - Test cases:
    - Claude model → anthropic
    - GPT model → openai
    - Gemini model → google
    - Unknown model → anthropic (safe default)
    - Exact model match
    - Fallback pricing
  - Coverage target: ≥80%
  - Acceptance: All tests pass, coverage met

- [ ] Integration test with real config
  - Files: `src/lib/pricing/__tests__/integration.test.ts` (new)
  - Test cases:
    - Load actual prompt-bench.toml
    - Calculate costs for all configured models
    - Verify pricing matches config
  - Acceptance: Tests pass with real config

- [ ] Run full prompt-bench test suite
  - Command: `bun bench test --template ecommerce-base --batch prompt-bench/fixtures/images-batch.json`
  - Verification:
    - Check database `prompt_tests` table has `cost_usd` populated
    - Check iteration reports show generation + evaluation costs
    - Verify no cost calculation errors in logs
    - Compare costs to manual calculations
  - Acceptance: All costs tracked correctly, no errors

### Phase 6: Documentation & Cleanup

- [ ] Update CLAUDE.md with pricing system
  - Files: `CLAUDE.md` (modify)
  - Sections to update:
    - Add pricing system to Architecture section
    - Document TOML pricing configuration
    - Update conventions if needed
  - Acceptance: Documentation accurate and complete

- [ ] Add JSDoc comments to public APIs
  - Files: All files in `src/lib/pricing/`
  - Requirements:
    - Document all exported functions
    - Include parameter descriptions
    - Include return value descriptions
    - Include examples where helpful
  - Acceptance: All public APIs documented

- [ ] Verify no TypeScript errors
  - Command: `bun tsc --noEmit`
  - Acceptance: Zero TypeScript errors

- [ ] Verify all tests pass
  - Command: `bun test`
  - Acceptance: All tests pass, coverage ≥75%

## Acceptance Criteria

### Functional Requirements
- ✅ Multi-provider support (Anthropic, OpenAI, Google)
- ✅ TOML-based pricing configuration
- ✅ Shared utility works in both CLI and app
- ✅ Static pricing with fallback for unknown models
- ✅ Gemini generation costs tracked
- ✅ Claude evaluation costs tracked
- ✅ Existing hardcoded calculations replaced

### Technical Requirements
- ✅ All tests pass (`bun test`)
- ✅ No TypeScript errors (`bun tsc --noEmit`)
- ✅ Test coverage ≥75%
- ✅ Follows FP principles (pure functions, immutability)
- ✅ Uses Result type for error handling
- ✅ Strict TypeScript (no `any`, explicit return types)
- ✅ Functions ≤20 lines, ≤3 nesting levels

### Validation Requirements
- ✅ Prompt-bench test completes successfully
- ✅ Database shows accurate costs
- ✅ Iteration reports include generation + evaluation costs
- ✅ No cost calculation errors in logs
- ✅ Costs match manual calculations

### Documentation Requirements
- ✅ CLAUDE.md updated
- ✅ All public APIs have JSDoc comments
- ✅ TOML pricing config documented
- ✅ Architecture decisions recorded

## Files to Create

### Source Files
1. `src/lib/pricing/index.ts` - Barrel exports
2. `src/lib/pricing/types.ts` - Type definitions
3. `src/lib/pricing/calculator.ts` - Cost calculation function
4. `src/lib/pricing/config.ts` - TOML loading and caching
5. `src/lib/pricing/models.ts` - Model-to-provider mapping

### Test Files
6. `src/lib/pricing/__tests__/calculator.test.ts` - Calculator tests
7. `src/lib/pricing/__tests__/config.test.ts` - Config loader tests
8. `src/lib/pricing/__tests__/models.test.ts` - Model mapping tests
9. `src/lib/pricing/__tests__/integration.test.ts` - Integration tests

## Files to Modify

### Configuration
1. `package.json` - Add @iarna/toml dependency
2. `prompt-bench.toml` - Add [pricing] section

### Prompt-Bench CLI
3. `prompt-bench/core/evaluator.ts` - Replace hardcoded pricing (lines 77-84, 228)
4. `prompt-bench/commands/insights.ts` - Replace hardcoded pricing (lines 139-146, 193, 248)
5. `prompt-bench/core/evolution.ts` - Replace hardcoded pricing (~lines 91, 143, 193)
6. `prompt-bench/core/orchestrator.ts` - Add generation cost tracking

### Main App
7. `src/lib/ai/types.ts` - Add usage field to GenerationResponse
8. `src/lib/ai/providers/gemini.ts` - Extract usage data (lines ~100, ~180)

### Documentation
9. `CLAUDE.md` - Document pricing system

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
- Phase 1 must complete before Phase 2
- Phase 2 must complete before Phase 3 and Phase 4
- Phase 3 and Phase 4 can run in parallel
- Phase 5 requires Phase 3 and Phase 4 complete
- Phase 6 requires all previous phases complete

## TOML Pricing Configuration Schema

```toml
# Pricing configuration (USD per 1M tokens, manually maintained)

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

# Fallback pricing for unknown models (conservative estimate)
[pricing.fallback]
input = 10.0
output = 30.0
```

## Type Definitions Reference

```typescript
export type Provider = 'anthropic' | 'openai' | 'google';

export interface ModelPricing {
  input: number;   // USD per 1M tokens
  output: number;  // USD per 1M tokens
}

export interface PricingConfig {
  anthropic: Record<string, ModelPricing>;
  openai: Record<string, ModelPricing>;
  google: Record<string, ModelPricing>;
  fallback: ModelPricing;
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
  provider: Provider;
  fallbackUsed: boolean;
}
```

## Implementation Notes

### Error Handling Strategy
- Config loading errors: Return Result with CONFIG_ERROR
- Validation errors: Return Result with VALIDATION_ERROR
- Cost calculation errors in evaluator/insights: Log warning, continue with cost=0
- Missing usage data from Gemini: Gracefully handle, don't fail generation

### Caching Strategy
- Config loaded once and cached in memory
- Cache cleared via `clearPricingCache()` (useful for testing)
- No TTL expiration (config changes require restart)

### Testing Strategy
- Unit tests: Individual functions in isolation
- Integration tests: Load real config, verify end-to-end
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
- Comprehensive error handling
- Fallback pricing always available
- Config validation on load
- Clear error messages

### Risk: Usage data missing from AI SDKs
**Mitigation:**
- Optional usage field in types
- Graceful degradation (cost=0 if missing)
- Log warnings for debugging
- Don't fail operations on missing cost data

### Risk: Breaking changes to existing cost tracking
**Mitigation:**
- All changes are additive
- Existing database schema unchanged
- Result type allows backward compatibility
- Comprehensive tests before deployment

### Risk: Performance impact from config loading
**Mitigation:**
- Lazy loading with caching
- Config loaded once per process
- No repeated file I/O
- Minimal overhead (~1ms per calculation)
