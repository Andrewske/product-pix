# Task 2: Create Orchestrator Module

## Objective
Create a pipeline orchestrator that coordinates sync → run → evaluate → report phases with progress callbacks.

## File to Create
`src/lib/prompts/orchestrator.ts`

## Dependencies
- `@/lib/prompts/errors` - Result type, error handling
- `@/lib/prompts/compiler` - compileTemplate, generateIdempotencyKey
- `@/lib/prompts/db/templates` - fetchTemplate, syncTemplate
- `@/lib/prompts/evaluator` - evaluateImage
- `@/lib/prompts/statistics` - summarize, formatReport
- `@/lib/ai/providers/gemini` - createGeminiProvider
- `@/lib/r2` - uploadBuffer, getPublicUrl
- `@/lib/supabase/admin` - createAdminClient

## Types

### Input Options
```typescript
interface PipelineOptions {
  templateSlug: string;
  templateVersion: number | 'latest';
  batchFile: string;
  label?: string;
  skipSync: boolean;
  skipEval: boolean;
  skipReport: boolean;
  dryRun: boolean;
  evalModel: string;
}
```

### Progress Callback
```typescript
type ProgressCallback = (
  phase: 'sync' | 'run' | 'evaluate' | 'report',
  current: number,
  total: number,
  message: string
) => void;
```

### Result
```typescript
interface PipelineResult {
  label: string;
  phases: {
    sync?: { synced: boolean };
    run: { completed: number; failed: number; skipped: number };
    evaluate?: { completed: number; failed: number };
    report?: BatchReport;
  };
  totalDuration: number;
  costs: { generation: number; evaluation: number };
}
```

## Implementation

### Main Function
```typescript
const runPipeline = async (
  options: PipelineOptions,
  onProgress?: ProgressCallback
): Promise<Result<PipelineResult>>
```

### Phase 1: Sync
```typescript
const syncPhase = async (
  templateSlug: string,
  onProgress?: ProgressCallback
): Promise<Result<{ synced: boolean }>> => {
  onProgress?.('sync', 0, 1, 'Checking template...');

  const result = await syncTemplate(templateSlug);
  if (!isOk(result)) return result;

  onProgress?.('sync', 1, 1, 'Template synced');
  return ok({ synced: true });
};
```

### Phase 2: Run (Fail Fast)
```typescript
const runPhase = async (
  template: PromptTemplate,
  batch: BatchFile,
  batchLabel: string,
  dryRun: boolean,
  onProgress?: ProgressCallback
): Promise<Result<RunPhaseResult>> => {
  // For each test:
  // 1. Compile template
  // 2. Check idempotency (skip if exists and not failed)
  // 3. Generate image via Gemini
  // 4. Upload to R2
  // 5. Save to database
  //
  // FAIL FAST: If ANY generation fails, return error immediately
  // Do not continue to next test
};
```

### Phase 3: Evaluate
```typescript
const evaluatePhase = async (
  batchLabel: string,
  evalModel: string,
  onProgress?: ProgressCallback
): Promise<Result<EvalPhaseResult>> => {
  // Fetch all tests with status='evaluating' for this batch
  // For each: call evaluateImage, save result, update status
  // Continue on evaluation failures (log warning)
};
```

### Phase 4: Report
```typescript
const reportPhase = async (
  batchLabel: string,
  onProgress?: ProgressCallback
): Promise<Result<BatchReport>> => {
  // Fetch all completed tests + evaluations
  // Calculate statistics
  // Return report object
};
```

## Error Handling

**Critical: Fail Fast on Generation**
- If any image generation fails, stop the pipeline immediately
- Return the error with context about which test failed
- Do NOT proceed to evaluation phase
- The user explicitly requested this behavior

```typescript
// In runPhase:
if (!generationResult.success) {
  return err(createError(
    'GENERATION_ERROR',
    `Test ${i + 1}/${total} failed: ${generationResult.error}`,
    { testIndex: i, prompt: compiled.prompt }
  ));
}
```

## Batch File Loading
Reuse the same logic from `scripts/commands/run.ts`:
```typescript
const loadBatchFile = (filePath: string): Result<BatchFile>
```

## Label Generation
```typescript
const generateBatchLabel = (templateSlug: string): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = Math.random().toString(36).slice(2, 8);
  return `${templateSlug}-${date}-${hash}`;
};
```

## Exports
Add to `src/lib/prompts/index.ts`:
```typescript
export { runPipeline, generateBatchLabel } from './orchestrator';
export type { PipelineOptions, PipelineResult, ProgressCallback } from './orchestrator';
```

## Acceptance Criteria
- [ ] runPipeline coordinates all 4 phases
- [ ] Progress callback fires at each step
- [ ] Sync phase can be skipped with skipSync option
- [ ] Run phase fails fast on generation error
- [ ] Evaluate phase only runs if run phase succeeds
- [ ] Report phase only runs if evaluate phase succeeds (or skipped)
- [ ] Total duration and costs tracked accurately
- [ ] Module exported from index.ts
