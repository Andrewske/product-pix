# Iterate Cost Tracking Implementation Plan

## Overview

Add per-action cost tracking (Generation, Evaluation, Insights) to the `bench iterate` command with:
- Per-generation cost display during iteration
- Total costs summary at completion
- Persistence to both CSV files and database

## Architecture Decisions

- **Cost granularity**: Track three separate cost types (Generation, Evaluation, Insights) rather than a single total, enabling analysis of which phase is most expensive
- **Actual costs**: All costs must be real API costs, not estimates. This requires fixing the orchestrator's evaluation cost calculation.
- **Database as source of truth**: Database is primary persistence; CSV is a derived export for convenience
- **Incremental persistence**: Persist costs after each generation to prevent data loss on crash/interrupt
- **CSV location**: Store in `sessions/` folder alongside session JSON files for co-location
- **Database design**: Single `iteration_costs` table with JSONB for per-generation details (avoids needing a separate detail table)
- **Backward compatibility**: Use Zod defaults so existing sessions work without migration
- **Decimal precision**: Standardize on 4 decimal places ($.0001) across all outputs for consistency

## Implementation Tasks

### Phase 0: Fix Actual Evaluation Costs in Orchestrator

**Problem**: The orchestrator currently uses a hardcoded estimate for evaluation costs (`$0.001 per evaluation`) instead of actual API costs. The evaluate command already tracks real costs in `prompt_evaluations.cost_usd`, but the orchestrator doesn't aggregate them.

- [ ] Modify EvalPhaseResult to include totalCost
  - Files: `prompt-bench/core/orchestrator.ts` (modify, line 73-76)
  - Acceptance: `EvalPhaseResult` includes `totalCost: number`

**Change EvalPhaseResult interface:**
```typescript
interface EvalPhaseResult {
  completed: number;
  failed: number;
  totalCost: number;  // Add this field
}
```

- [ ] Aggregate actual evaluation costs after evaluations complete
  - Files: `prompt-bench/core/orchestrator.ts` (modify, evaluatePhase function)
  - Acceptance: Returns actual costs from `prompt_evaluations.cost_usd`

**Add cost aggregation at end of evaluatePhase (before return):**
```typescript
// Aggregate actual evaluation costs from database
const { data: evalCosts, error: costError } = await supabase
  .from('prompt_evaluations')
  .select('cost_usd')
  .eq('batch_label', batchLabel);

const totalCost = costError
  ? 0
  : (evalCosts ?? []).reduce((sum, e) => sum + (e.cost_usd ?? 0), 0);

return ok({ completed, failed, totalCost });
```

- [ ] Update orchestrator to use actual evaluation costs
  - Files: `prompt-bench/core/orchestrator.ts` (modify, line 141)
  - Acceptance: `evaluationCost` uses `evalResult.data.totalCost` instead of estimate

**Change line 141 from:**
```typescript
evaluationCost = evalResult.data.completed * 0.001; // Rough estimate: $0.001 per evaluation
```

**To:**
```typescript
evaluationCost = evalResult.data.totalCost;
```

### Phase 1: Type Definitions and Imports

- [ ] Add required imports to iterate.ts (do this first to avoid TypeScript errors in later phases)
  - Files: `prompt-bench/commands/iterate.ts` (modify, top of file)
  - Add after existing imports:

```typescript
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CostRecord, GenerationCostEntry } from '@bench/core/iteration-types';
```

- [ ] Add cost tracking schemas to iteration-types.ts
  - Files: `prompt-bench/core/iteration-types.ts` (modify)
  - Tests: Zod schema validation is self-testing
  - Acceptance:
    - `CostRecordSchema` validates objects with `generation`, `evaluation`, `insights` number fields
    - `GenerationCostEntrySchema` validates objects with `generation`, `timestamp`, `costs`, `total` fields
    - `IterationStateSchema` includes `costHistory` and `totalCosts` with defaults
    - Types exported: `CostRecord`, `GenerationCostEntry`

**Code to add:**
```typescript
// After ScoreHistoryEntrySchema (around line 175)

// =============================================================================
// Cost Tracking Schema
// =============================================================================

export const CostRecordSchema = z.object({
  generation: z.number().min(0),
  evaluation: z.number().min(0),
  insights: z.number().min(0),
});

export type CostRecord = z.infer<typeof CostRecordSchema>;

export const GenerationCostEntrySchema = z.object({
  generation: z.number().int().min(0),
  timestamp: z.string().datetime(),
  costs: CostRecordSchema,
  total: z.number().min(0),
});

export type GenerationCostEntry = z.infer<typeof GenerationCostEntrySchema>;
```

**Modify IterationStateSchema to include:**
```typescript
costHistory: z.array(GenerationCostEntrySchema).default([]),
totalCosts: CostRecordSchema.default({ generation: 0, evaluation: 0, insights: 0 }),
```

### Phase 2: Database Migration

- [ ] Create iteration_costs table migration
  - Files: `supabase/migrations/00015_create_iteration_costs.sql` (new)
  - Tests: Manual verification via `npx supabase db push`
  - Acceptance:
    - Table created with all columns
    - Indexes on `session_id`, `template_slug`, `created_at`
    - RLS policies allow service role full access, authenticated read

**Full migration SQL:**
```sql
-- Migration: Create iteration_costs table
-- Tracks costs for evolutionary iteration sessions

CREATE TABLE public.iteration_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  template_slug TEXT NOT NULL,
  generation_count INTEGER NOT NULL DEFAULT 0,
  generation_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  evaluation_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  insights_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  cost_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iteration_costs_session ON iteration_costs(session_id);
CREATE INDEX idx_iteration_costs_template ON iteration_costs(template_slug);
CREATE INDEX idx_iteration_costs_created ON iteration_costs(created_at DESC);

ALTER TABLE public.iteration_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all iteration costs"
  ON public.iteration_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read iteration costs"
  ON public.iteration_costs
  FOR SELECT
  TO authenticated
  USING (true);
```

### Phase 3: Core Logic - Cost Capture

- [ ] Modify runAndEvaluatePopulation to return costs
  - Files: `prompt-bench/commands/iterate.ts` (modify, lines 414-480)
  - Tests: `prompt-bench/__tests__/iterate.test.ts` (if exists, add cost assertions)
  - Acceptance:
    - Function returns `{ evaluated: boolean; costs: { generation: number; evaluation: number } }`
    - Costs extracted from `pipelineResult.data.costs`

**Changes required:**
```typescript
// Add interface near top of file (after IterateOptions, around line 45)
interface EvaluationResult {
  evaluated: boolean;
  costs: { generation: number; evaluation: number };
}

// Default costs for error cases
const DEFAULT_COSTS = { generation: 0, evaluation: 0 };

// Modify function signature and return
const runAndEvaluatePopulation = async (
  state: IterationState,
  _options: IterateOptions
): Promise<EvaluationResult> => {
  // ... existing code ...

  // Change ALL error returns (lines ~426, ~448, ~457, ~469) from:
  // return false;
  // to:
  // return { evaluated: false, costs: DEFAULT_COSTS };

  // Change success return at line ~464 from:
  // return true;
  // to (with null safety):
  // return { evaluated: true, costs: pipelineResult.data.costs ?? DEFAULT_COSTS };
};
```

### Phase 4: Core Logic - Cost Tracking in Loop

- [ ] Add cost tracking to runIterationLoop
  - Files: `prompt-bench/commands/iterate.ts` (modify, lines 335-402)
  - Tests: Manual integration test with `bun bench iterate`
  - Acceptance:
    - Costs captured from evaluation phase
    - Costs captured from insights generation
    - State updated with cost history after each generation
    - **Costs persisted incrementally after each generation** (crash resilience)

**Precise changes to runIterationLoop (matching actual code structure):**

The actual loop structure (lines 347-398) is:
1. needsEvaluation check → runAndEvaluatePopulation
2. checkConvergence → break if converged
3. generateStructuredInsights
4. evolvePopulation
5. promptForApproval
6. updateStateWithApproved
7. saveSession
8. displayGenerationSummary

**Insert cost tracking as follows:**

```typescript
const runIterationLoop = async (
  state: IterationState,
  options: IterateOptions
): Promise<void> => {
  // Fetch template schema once at the start (existing code, line 340-345)
  const schemaResult = await fetchTemplateSchema(state.templateSlug, state.templateVersion);
  if (!schemaResult.ok) {
    console.error(`Failed to fetch template schema: ${schemaResult.error.message}`);
    return;
  }
  const variablesSchema = schemaResult.data;

  while (true) {
    // === NEW: Initialize per-generation costs ===
    const genCosts: CostRecord = { generation: 0, evaluation: 0, insights: 0 };

    // 1. Run current population tests if not evaluated (existing, line 349-352)
    if (needsEvaluation(state)) {
      const evalResult = await runAndEvaluatePopulation(state, options);
      if (!evalResult.evaluated) {
        // === NEW: Persist partial costs before breaking ===
        await persistCosts(state);
        break;
      }
      // === NEW: Capture generation/evaluation costs ===
      genCosts.generation = evalResult.costs.generation;
      genCosts.evaluation = evalResult.costs.evaluation;
    }

    // 2. Check convergence (existing, line 354-359)
    const convergence = checkConvergence(state, options.target);
    if (convergence.converged) {
      displayConvergenceMessage(convergence, options);
      break;  // Costs persisted after loop
    }

    // 3. Generate structured insights (existing, line 361-368)
    console.log('🤖 Generating AI insights...');
    const insights = await generateStructuredInsights(buildSummary(state));
    if (!insights.ok) {
      console.error('Failed to generate insights:', insights.error.message);
      // === NEW: Persist partial costs before breaking ===
      updateStateCosts(state, genCosts);
      await persistCosts(state);
      break;
    }
    console.log('✓ Insights generated');
    // === NEW: Capture insights cost (with fallback for optional field) ===
    genCosts.insights = insights.data.costUsd ?? 0;

    // === NEW: Update state and display costs ===
    updateStateCosts(state, genCosts);
    displayGenerationCosts(state.generations.length, genCosts, options);

    // === NEW: Persist costs incrementally (crash resilience) ===
    await persistCosts(state);

    // 4-8. Existing evolution, approval, and save logic (lines 370-397)
    // ... evolvePopulation ...
    // ... promptForApproval ...
    // ... updateStateWithApproved ...
    // ... saveSession ...
    // ... displayGenerationSummary ...
  }

  // Final summary (costs already persisted incrementally)
  displayFinalSummary(state, options);
};
```

**Key changes from original plan:**
1. Cost tracking inserted at correct positions relative to existing code
2. Incremental `persistCosts(state)` after each generation for crash resilience
3. Partial cost persistence on early breaks (evaluation failure, insights failure)
4. Fallback `?? 0` for optional `insights.data.costUsd`
5. Removed final `persistCosts` call (now done incrementally)

### Phase 5: Display Functions

- [ ] Add cost display helper functions
  - Files: `prompt-bench/commands/iterate.ts` (modify, add after line 922)
  - Tests: Visual verification in console output
  - Acceptance:
    - Per-generation costs displayed with emoji prefix
    - All three cost types shown with proper formatting
    - Quiet mode respected

**New functions to add:**
```typescript
const displayGenerationCosts = (
  generation: number,
  costs: CostRecord,
  options: IterateOptions
): void => {
  if (options.quiet) return;

  const total = costs.generation + costs.evaluation + costs.insights;
  console.log(`\n💰 Generation ${generation} Costs:`);
  console.log(`   Generation: $${costs.generation.toFixed(4)}`);
  console.log(`   Evaluation: $${costs.evaluation.toFixed(4)}`);
  console.log(`   Insights:   $${costs.insights.toFixed(4)}`);
  console.log(`   Total:      $${total.toFixed(4)}`);
};

const updateStateCosts = (state: IterationState, costs: CostRecord): void => {
  const entry: GenerationCostEntry = {
    generation: state.generations.length,
    timestamp: new Date().toISOString(),
    costs,
    total: costs.generation + costs.evaluation + costs.insights,
  };

  state.costHistory.push(entry);
  state.totalCosts.generation += costs.generation;
  state.totalCosts.evaluation += costs.evaluation;
  state.totalCosts.insights += costs.insights;
};
```

- [ ] Modify displayFinalSummary to show total costs
  - Files: `prompt-bench/commands/iterate.ts` (modify, lines 924-939)
  - Acceptance: Total costs breakdown shown at end of iteration

**Modify displayFinalSummary:**
```typescript
const displayFinalSummary = (
  state: IterationState,
  options: IterateOptions
): void => {
  if (options.quiet) return;

  console.log(`\n🏁 Iteration Complete!`);
  console.log(`Session: ${state.sessionId}`);
  console.log(`Generations: ${state.generations.length}`);
  console.log(`Template: ${state.templateSlug}`);

  if (state.scoreHistory.length > 0) {
    const final = state.scoreHistory[state.scoreHistory.length - 1];
    console.log(`Final Best Score: ${final.best.toFixed(2)}/10`);
  }

  // Display total costs
  const total = state.totalCosts;
  const grandTotal = total.generation + total.evaluation + total.insights;
  console.log(`\n--- Total Costs ---`);
  console.log(`Generation: $${total.generation.toFixed(4)}`);
  console.log(`Evaluation: $${total.evaluation.toFixed(4)}`);
  console.log(`Insights:   $${total.insights.toFixed(4)}`);
  console.log(`Grand Total: $${grandTotal.toFixed(4)}`);
};
```

### Phase 6: Persistence Functions

- [ ] Add CSV persistence function
  - Files: `prompt-bench/commands/iterate.ts` (modify, add new function)
  - Tests: Verify CSV file created in sessions/ folder
  - Acceptance:
    - CSV written to `sessions/{session-id}-costs.csv`
    - Headers included
    - TOTAL row at end
    - File path logged to console

**New function:**
```typescript
// Note: imports added in Phase 1:
// import { writeFile, mkdir } from 'node:fs/promises';
// import { dirname } from 'node:path';
// import { fileURLToPath } from 'node:url';

// Use module-relative path (not process.cwd() which is fragile)
const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = join(__dirname, '..', 'sessions');

const writeCostsToCsv = async (state: IterationState): Promise<Result<void>> => {
  const csvPath = join(SESSIONS_DIR, `${state.sessionId}-costs.csv`);

  const headers = 'generation,timestamp,generation_cost,evaluation_cost,insights_cost,total\n';
  const rows = state.costHistory.map(entry =>
    `${entry.generation},${entry.timestamp},${entry.costs.generation.toFixed(4)},${entry.costs.evaluation.toFixed(4)},${entry.costs.insights.toFixed(4)},${entry.total.toFixed(4)}`
  ).join('\n');

  const total = state.totalCosts;
  const grandTotal = total.generation + total.evaluation + total.insights;
  const summary = `\nTOTAL,,${total.generation.toFixed(4)},${total.evaluation.toFixed(4)},${total.insights.toFixed(4)},${grandTotal.toFixed(4)}`;

  try {
    // Ensure sessions directory exists (handles fresh clones, gitignored dirs)
    await mkdir(SESSIONS_DIR, { recursive: true });
    await writeFile(csvPath, headers + rows + summary, 'utf-8');
    console.log(`📄 Cost report saved: ${csvPath}`);
    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to write CSV: ${message}`));
  }
};
```

- [ ] Add database persistence function
  - Files: `prompt-bench/commands/iterate.ts` (modify, add new function)
  - Tests: Verify row created/updated in `iteration_costs` table
  - Acceptance:
    - Upserts on session_id
    - All cost fields populated
    - cost_details contains full history

**New function:**
```typescript
const writeCostsToDatabase = async (state: IterationState): Promise<Result<void>> => {
  const supabase = createAdminClient();

  const total = state.totalCosts;
  const grandTotal = total.generation + total.evaluation + total.insights;

  const { error } = await supabase
    .from('iteration_costs')
    .upsert({
      session_id: state.sessionId,
      template_slug: state.templateSlug,
      generation_count: state.generations.length,
      generation_cost: total.generation,
      evaluation_cost: total.evaluation,
      insights_cost: total.insights,
      total_cost: grandTotal,
      cost_details: state.costHistory,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id' });

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to save costs: ${error.message}`));
  }

  return ok(undefined);
};

const persistCosts = async (state: IterationState): Promise<void> => {
  if (state.costHistory.length === 0) return;

  // Database is source of truth - persist there first
  const dbResult = await writeCostsToDatabase(state);
  if (!dbResult.ok) {
    console.warn(`⚠️ Database save failed: ${dbResult.error.message}`);
  }

  // CSV is a derived export for convenience
  const csvResult = await writeCostsToCsv(state);
  if (!csvResult.ok) {
    console.warn(`⚠️ CSV save failed: ${csvResult.error.message}`);
  }
};
```

### Phase 7: Integration & Testing

- [ ] Run database migration
  - Command: `npx supabase db push`
  - Acceptance: Migration applies without errors

- [ ] Integration test with actual iteration
  - Command: `bun bench iterate --template ecommerce-base --batch prompt-bench/fixtures/images-batch.json`
  - Acceptance:
    - Per-generation costs displayed (actual costs, not estimates)
    - Final total displayed
    - CSV file created in sessions/
    - Database row created/updated after each generation
    - Costs persist even if process is interrupted mid-iteration

## Acceptance Criteria

- [ ] All TypeScript compiles without errors (`bun tsc --noEmit`)
- [ ] Per-generation costs (Generation, Evaluation, Insights) displayed during iteration
- [ ] **All costs are actual API costs** (no hardcoded estimates)
- [ ] Total costs displayed at end of iteration
- [ ] CSV file created at `sessions/{session-id}-costs.csv`
- [ ] Database row created in `iteration_costs` table
- [ ] **Costs persisted incrementally** (no data loss on crash/interrupt)
- [ ] Existing sessions without cost data still load correctly (backward compatible)
- [ ] Quiet mode suppresses cost output
- [ ] **Consistent decimal precision** (4 places) across all outputs

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `prompt-bench/core/orchestrator.ts` | Modify | Fix evaluation cost to use actual costs instead of estimate |
| `prompt-bench/core/iteration-types.ts` | Modify | Add CostRecord, GenerationCostEntry schemas |
| `prompt-bench/commands/iterate.ts` | Modify | Add cost tracking, display, persistence |
| `supabase/migrations/00015_create_iteration_costs.sql` | Create | New table for cost persistence |

## Dependencies

- **Internal**: `@bench/core/errors` (Result type), `@/lib/supabase/admin` (database client)
- **External**: None new - uses existing `zod`, `node:fs/promises`, `node:url`
- **Runtime**: Requires database migration before persistence works
