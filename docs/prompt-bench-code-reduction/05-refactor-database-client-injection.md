# Refactor Database Client Injection

## Files to Modify/Create
- prompt-bench/core/orchestrator.ts (modify)

## Implementation Details

The `createAdminClient()` function is called 52 times across 22 files, creating multiple Supabase client instances. Within orchestrator.ts alone, there are 4 separate calls, each creating a new client instance.

**Current problematic pattern:**
```typescript
const runPhase = async (...) => {
  const supabase = createAdminClient();  // New client every call
  // ... use supabase
};

const evaluatePhase = async (...) => {
  const supabase = createAdminClient();  // Another new client
  // ... use supabase
};

const reportPhase = async (...) => {
  const supabase = createAdminClient();  // Yet another
  // ... use supabase
};
```

**Required changes:**

### Step 1: Define dependencies interface

Add near the top of orchestrator.ts (after imports):

```typescript
/**
 * Pipeline dependencies for dependency injection
 * Allows single client creation at entry point
 */
export interface PipelineDependencies {
  supabase: ReturnType<typeof createAdminClient>;
  gemini: ReturnType<typeof createGeminiProvider>;
}
```

### Step 2: Update phase function signatures

Update `syncPhase` (if it uses supabase):
```typescript
const syncPhase = async (
  templateSlug: string,
  deps: PipelineDependencies,
  onProgress?: ProgressCallback
): Promise<Result<{ synced: boolean }>> => {
  // Use deps.supabase instead of createAdminClient()
};
```

Update `runPhase`:
```typescript
const runPhase = async (
  template: PromptTemplate,
  batch: BatchFile,
  batchLabel: string,
  dryRun: boolean,
  batchFilePath: string,
  analysisEnabled: boolean | undefined,
  analysisModel: string | undefined,
  analysisCacheEnabled: boolean | undefined,
  deps: PipelineDependencies,
  onProgress?: ProgressCallback
): Promise<Result<RunPhaseResult>> => {
  const { supabase, gemini } = deps;
  // Remove: const supabase = createAdminClient();
  // Remove: const gemini = createGeminiProvider();
  // ... rest of function
};
```

Update `runCollectionPhase`:
```typescript
const runCollectionPhase = async (
  template: CollectionTemplate,
  batch: BatchFile,
  batchLabel: string,
  dryRun: boolean,
  batchFilePath: string,
  analysisEnabled: boolean | undefined,
  analysisModel: string | undefined,
  analysisCacheEnabled: boolean | undefined,
  deps: PipelineDependencies,
  onProgress?: ProgressCallback
): Promise<Result<RunPhaseResult>> => {
  // Remove: const supabase = createAdminClient();
  // Remove: const gemini = createGeminiProvider();
  // Pass deps to coordinateCollectionGeneration
};
```

Update `evaluatePhase`:
```typescript
const evaluatePhase = async (
  batchLabel: string,
  evalModel: string,
  deps: PipelineDependencies,
  onProgress?: ProgressCallback
): Promise<Result<EvalPhaseResult>> => {
  const { supabase } = deps;
  // Remove: const supabase = createAdminClient();
  // ... rest of function
};
```

Update `reportPhase`:
```typescript
const reportPhase = async (
  batchLabel: string,
  deps: PipelineDependencies,
  onProgress?: ProgressCallback
): Promise<Result<BatchReport>> => {
  const { supabase } = deps;
  // Remove: const supabase = createAdminClient();
  // ... rest of function
};
```

### Step 3: Update main pipeline function

Update `runPipeline` to create dependencies once:

```typescript
export const runPipeline = async (
  options: PipelineOptions,
  onProgress?: ProgressCallback
): Promise<Result<PipelineResult>> => {
  const startTime = Date.now();

  // Create dependencies once at entry point
  const deps: PipelineDependencies = {
    supabase: createAdminClient(),
    gemini: createGeminiProvider()
  };

  // ... rest of function, passing deps to all phase functions

  const runResult = await runPhase(
    template,
    batch,
    batchLabel,
    options.dryRun,
    options.batchFile,
    options.analysisEnabled,
    options.analysisModel,
    options.analysisCacheEnabled,
    deps,  // Pass deps
    onProgress
  );

  // ... continue with evaluatePhase(batchLabel, options.evalModel, deps, onProgress)
  // ... continue with reportPhase(batchLabel, deps, onProgress)
};
```

### Step 4: Update coordinateCollectionGeneration

The function already accepts a `dependencies` parameter - ensure it's used consistently and remove any internal `createAdminClient()` calls.

## Acceptance Criteria
- [ ] `PipelineDependencies` interface exported from orchestrator.ts
- [ ] All phase functions accept deps parameter
- [ ] Single `createAdminClient()` call in `runPipeline`
- [ ] Single `createGeminiProvider()` call in `runPipeline`
- [ ] No TypeScript errors: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test prompt-bench`
- [ ] Full pipeline works: `bun bench test --template ecommerce-base --batch prompt-bench/fixtures/mini-batch.json`

## Dependencies
Complete tasks 01-04 first (simpler refactors provide safety net).

## Risk Level
Medium - internal API change affecting multiple functions.

## Savings
~200 lines conceptually (eliminates repeated client creation), improved testability.

## Notes
- This is an architectural improvement, not pure line reduction
- Main benefit: easier mocking for unit tests, single point of client configuration
- Consider: may want to keep command files (run.ts, evaluate.ts) unchanged if they need standalone execution
- Break into multiple commits: one per phase function refactored
