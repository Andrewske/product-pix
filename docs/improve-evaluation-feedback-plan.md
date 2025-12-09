# Improve Command Evaluation Feedback Enhancement

## Overview

Enhance the `bun bench improve` command to pass full evaluation details (sub-scores, reasoning, suggestions) to the AI analyzer, enabling data-driven prompt improvements instead of blind guessing from overall scores.

## Problem Statement

Currently, the improve process generates many template changes but scores don't improve because:
1. The analyzer only receives overall scores (e.g., 6.8), not dimension breakdowns
2. Evaluator reasoning and suggestions are discarded before reaching the analyzer
3. No minimum batch size validation allows statistically meaningless tests
4. No iteration history tracking leads to repeated similar suggestions

## Architecture Decisions

- **Extend existing types**: Add optional fields to `TestResults` and `ProductScore` for backward compatibility
- **Fetch from existing table**: Use `prompt_evaluations.details` JSONB column (already stores full breakdown)
- **Aggregate dimensions**: Calculate averages across all products for quick diagnosis
- **Prompt enhancement**: Add structured sections to analyzer prompt for dimension analysis
- **Validation approach**: Soft validation with `--force` override for testing

## Implementation Tasks

### Phase 1: Type Extensions

- [ ] Extend TestResults interface with evaluation breakdown
  - Files: `prompt-bench/core/improvement-types.ts` (modify)
  - Changes:
    - Add `EvaluationBreakdown` interface with 6 dimension scores
    - Add optional `breakdown`, `reasoning`, `suggestions` to `ProductScore`
    - Add optional `dimensionAverages` to `TestResults`
  - Tests: `prompt-bench/__tests__/improvement-types.test.ts` (new)
  - Acceptance: Types compile, no breaking changes to existing code

### Phase 2: Data Fetching

- [ ] Create fetchBatchEvaluations function
  - Files: `prompt-bench/commands/shared.ts` (modify)
  - Changes:
    - Add `fetchBatchEvaluations()` that fetches full evaluation details
    - Join `prompt_tests` with `prompt_evaluations` to get `details` JSONB
    - Return array with testId, score, and full details object
  - Tests: `prompt-bench/__tests__/shared.test.ts` (modify)
  - Acceptance: Function returns evaluation details including all 6 sub-scores

- [ ] Add dimension averages calculation helper
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Changes:
    - Add `calculateDimensionAverages()` function
    - Calculate mean of each dimension across all evaluations
    - Handle missing details gracefully (return undefined)
  - Tests: `prompt-bench/__tests__/improve.test.ts` (modify if exists, else skip)
  - Acceptance: Correctly averages dimension scores, handles edge cases

### Phase 3: Update Test Functions

- [ ] Update testBaseline to include evaluation details
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Changes:
    - Replace `fetchBatchScores()` call with `fetchBatchEvaluations()`
    - Build `productScores` array with breakdown, reasoning, suggestions
    - Calculate and include `dimensionAverages`
  - Acceptance: Baseline results include full evaluation breakdown

- [ ] Update testImproved to include evaluation details
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Changes:
    - Same changes as testBaseline for consistency
  - Acceptance: Improved results include full evaluation breakdown

### Phase 4: Enhance Analyzer Prompt

- [ ] Add dimension analysis formatting helpers
  - Files: `prompt-bench/commands/template-analyzer.ts` (modify)
  - Changes:
    - Add `formatDimensionAnalysis()` - formats dimensions sorted worst-first
    - Add `formatProductFeedback()` - formats per-product breakdown and reasoning
    - Add `findWeakestDimension()` - identifies worst dimension for quick diagnosis
  - Acceptance: Functions produce clear, actionable output

- [ ] Update buildAnalyzerPrompt with dimension sections
  - Files: `prompt-bench/commands/template-analyzer.ts` (modify)
  - Changes:
    - Add "Dimension Analysis" section showing all 6 dimensions with scores
    - Add warning indicators for dimensions below 7.0
    - Add "Per-Product Detailed Feedback" section with breakdowns
    - Include evaluator reasoning and suggestions for each product
  - Acceptance: Analyzer receives actionable dimension-level feedback

### Phase 5: Batch Size Validation

- [ ] Add batch size validation function
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Changes:
    - Add `validateBatchSize()` function requiring minimum 5 images
    - Return error Result if below minimum without --force
    - Log warning if --force used with small batch
  - Tests: `prompt-bench/__tests__/improve-validation.test.ts` (new)
  - Acceptance: Rejects batches < 5 images, allows with --force

- [ ] Add --force flag to improve command
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Changes:
    - Add `force` option to parseImproveOptions
    - Call validateBatchSize before session creation
  - Acceptance: `bun bench improve --force` overrides minimum

### Phase 6: Iteration History Tracking

- [ ] Add fetchPreviousIterations function
  - Files: `prompt-bench/commands/improvement-session.ts` (modify)
  - Changes:
    - Add function to fetch all iterations for a session
    - Order by iteration_number ascending
    - Return TemplateIteration array
  - Acceptance: Returns previous iterations with changes and deltas

- [ ] Pass iteration history to analyzer
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Changes:
    - Fetch previous iterations before calling analyzeTemplate
    - Pass as additional parameter
  - Acceptance: Analyzer receives iteration history on iteration > 0

- [ ] Update analyzer prompt with history section
  - Files: `prompt-bench/commands/template-analyzer.ts` (modify)
  - Changes:
    - Add optional `previousIterations` parameter to buildAnalyzerPrompt
    - Add "Previous Improvement Attempts" section listing what was tried
    - Include score delta for each attempt
    - Add instruction to avoid repeating failed approaches
  - Acceptance: Prompt includes history when available, empty section when first iteration

## Acceptance Criteria

- [ ] All TypeScript compiles without errors
- [ ] Existing tests pass (no regressions)
- [ ] New validation tests pass
- [ ] Running `bun bench improve` with 1 image shows error
- [ ] Running `bun bench improve --force` with 1 image shows warning but proceeds
- [ ] Running `bun bench improve` with 6 images shows dimension analysis in logs
- [ ] Analyzer prompt includes dimension breakdown and evaluator suggestions
- [ ] Iteration 2+ shows "Previous Attempts" in analyzer prompt

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `prompt-bench/core/improvement-types.ts` | Modify | Add EvaluationBreakdown, extend TestResults |
| `prompt-bench/commands/shared.ts` | Modify | Add fetchBatchEvaluations() |
| `prompt-bench/commands/improve.ts` | Modify | Batch validation, dimension calc, history |
| `prompt-bench/commands/template-analyzer.ts` | Modify | Enhanced prompt with dimensions and history |
| `prompt-bench/commands/improvement-session.ts` | Modify | Add fetchPreviousIterations() |
| `prompt-bench/__tests__/improvement-types.test.ts` | Create | Type tests |
| `prompt-bench/__tests__/improve-validation.test.ts` | Create | Validation tests |

## Dependencies

- Existing `prompt_evaluations` table with `details` JSONB column
- Existing `template_iterations` table for history
- `@anthropic-ai/sdk` for Claude API calls
- `@supabase/supabase-js` for database queries

## Type Definitions Reference

```typescript
// New types to add to improvement-types.ts

export interface EvaluationBreakdown {
  composition: number;
  lighting: number;
  productVisibility: number;
  backgroundQuality: number;
  professionalQuality: number;
  promptAdherence: number;
}

export interface ProductScore {
  productId: string;
  score: number;
  breakdown?: EvaluationBreakdown;
  reasoning?: string;
  suggestions?: string[];
}

export interface TestResults {
  scores: number[];
  meanScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  productScores: ProductScore[];
  dimensionAverages?: EvaluationBreakdown;
}
```

## Analyzer Prompt Enhancement Reference

```typescript
// New sections to add to analyzer prompt

### Dimension Analysis (identify weak areas):
- Product Visibility (25%): 5.8 ⚠️ NEEDS IMPROVEMENT
- Lighting (20%): 7.2 ✓
- Composition (15%): 6.5 ⚠️ NEEDS IMPROVEMENT
- Background Quality (15%): 8.1 ✓
- Professional Quality (15%): 6.9 ⚠️ NEEDS IMPROVEMENT
- Prompt Adherence (10%): 7.5 ✓

### Per-Product Detailed Feedback:
- product-0: 6.20
  Weakest area: productVisibility (5.0)
  Issue: The monitor screen shows significant glare and reflections...
  Suggestion: Add anti-glare positioning guidance

## Previous Improvement Attempts (DO NOT REPEAT THESE)
### Iteration 1:
- Changes attempted: Added anti-glare language to lighting section
- Result: Score did not improve (-0.10)
```

## Notes

- The `EvaluationDetails` type already exists in `prompt-bench/core/types.ts` and matches the database schema
- Dimension weights are: Composition 15%, Lighting 20%, Product Visibility 25%, Background 15%, Professional 15%, Prompt Adherence 10%
- The existing `prompt_evaluations.details` column stores the full breakdown as JSONB
