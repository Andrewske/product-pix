# Implementation Plan: testImproved Function

## Overview

The `testImproved` function in `prompt-bench/commands/improve.ts` needs to test AI-generated template improvements by parsing TypeScript code, syncing to database, and running the full test pipeline.

## Current State

**Location**: `prompt-bench/commands/improve.ts:451-472`

**Status**: Stub implementation that returns error

**Dependencies**:
- Called from `runIterationLoop` (improve.ts:280)
- Receives generated TypeScript code from AI
- Must validate, persist, and test the improved template

## Requirements

From the TODO comment (lines 458-463):
1. Parse generated TypeScript code to extract template object
2. Write to file (versioned if `config.versionTemplates` is true)
3. Sync template to database
4. Run pipeline with new template version
5. Fetch and return results

## Implementation Steps

### Phase 1: TypeScript Code Parsing

**Goal**: Extract template object from AI-generated code string

**Approach**:
- Use existing `readTemplateFile` from `@bench/core/template-io` as reference
- Evaluate two options:
  - **Option A**: Runtime evaluation with validation (faster, simpler)
  - **Option B**: AST parsing with TypeScript compiler API (safer, more complex)

**Recommended**: Option A with strict validation

**Tasks**:
1. Create `parseTemplateCode(code: string): Result<PromptTemplate>` helper
   - Use `eval()` or `new Function()` in isolated scope
   - Validate result matches `PromptTemplate` interface
   - Extract `slug`, `version`, `templateData`, `variablesSchema`
   - Handle edge cases (syntax errors, missing fields, invalid types)

2. Add security validation
   - Check for dangerous patterns (require, import, process, etc.)
   - Validate template structure before evaluation
   - Use Result type for error handling

**Files to modify**:
- `prompt-bench/core/template-io.ts` (add parser function)
- `prompt-bench/commands/improve.ts` (use parser in testImproved)

### Phase 2: Template File Writing

**Goal**: Persist improved template to filesystem with versioning support

**Approach**: Leverage existing `writeTemplateFile` and `generateVersionedFilename` from `@bench/core/template-io`

**Tasks**:
1. Determine file path
   - If `session.config.versionTemplates === true`: use versioned filename
   - Else: overwrite existing template file
   - Pattern: `{slug}.ts` or `{slug}-v{version}.ts`

2. Write template file
   - Use `writeTemplateFile(filePath, templateObject)`
   - Ensure proper TypeScript export format
   - Preserve existing imports and formatting where possible

3. Handle file system errors
   - Directory doesn't exist
   - Permission denied
   - Disk full

**Files to modify**:
- `prompt-bench/commands/improve.ts` (implement file writing logic)

**Edge cases**:
- Concurrent writes to same template
- Template file already exists (versioning disabled)
- Invalid characters in slug/version

### Phase 3: Database Synchronization

**Goal**: Sync improved template to database using existing sync infrastructure

**Approach**: Use `syncTemplate` from `@bench/db/templates`

**Tasks**:
1. Call `syncTemplate(templateSlug)`
   - This handles version detection, upserting, and status updates
   - Returns `Result<SyncResult>` with new version info

2. Update session state
   - Increment `session.currentIteration`
   - Store new template version in iteration record
   - Link iteration to new template version

3. Handle sync failures
   - Database connection errors
   - Constraint violations (duplicate slugs)
   - Schema validation failures

**Files to modify**:
- `prompt-bench/commands/improve.ts` (call syncTemplate)
- Potentially `prompt-bench/db/templates.ts` (if sync behavior needs adjustments)

**Database operations**:
- Insert/update `prompt_templates` table
- Record version history
- Update template status

### Phase 4: Pipeline Execution

**Goal**: Run full test pipeline (generate → evaluate → report) with improved template

**Approach**: Use existing `runPipeline` from `@bench/core/orchestrator`

**Tasks**:
1. Generate batch label
   - Format: `{slug}-improved-iter{N}-{date}-{hash}`
   - Use `generateBatchLabel` or custom format
   - Ensure uniqueness across iterations

2. Configure pipeline options
   ```typescript
   const pipelineOptions: PipelineOptions = {
     templateSlug: session.templateSlug,
     templateVersion: newVersion, // From sync result
     batchFile: session.batchFile,
     label: improvedLabel,
     skipSync: true, // Already synced in Phase 3
     skipEval: false,
     skipReport: false,
     dryRun: false,
     evalModel: session.config.evaluationModel || 'claude-sonnet-4-20250514',
   };
   ```

3. Execute pipeline
   - Call `runPipeline(pipelineOptions)`
   - Track progress (optional callback)
   - Handle errors (generation failures, evaluation errors)

4. Validate results
   - Ensure all tests completed
   - Check evaluation scores are present
   - Verify no pipeline phase failed

**Files to modify**:
- `prompt-bench/commands/improve.ts` (pipeline execution)

**Error handling**:
- Generation failures (API errors, rate limits)
- Evaluation failures (model errors, scoring issues)
- Partial results (some tests succeed, some fail)

### Phase 5: Results Fetching and Formatting

**Goal**: Extract test results from database and format for comparison

**Approach**: Use existing `fetchBatchScores` helper

**Tasks**:
1. Fetch completed tests
   - Call `fetchBatchScores(improvedLabel)`
   - Returns array of `{testId, score, prompt, inputs}`
   - Validate non-empty results

2. Calculate statistics
   - Use `summarize(scores)` for mean, stdDev, min, max, median
   - Group by test case if needed
   - Track individual test scores

3. Format return value
   ```typescript
   interface ImprovedTestResult {
     template: {
       slug: string;
       version: number;
       status: string;
       templateData: any;
       variablesSchema: any;
     };
     label: string;
     results: TestResults;
     costs: { generation: number; evaluation: number };
   }
   ```

4. Extract costs from pipeline result
   - Generation costs from `pipelineResult.data.costs.generation`
   - Evaluation costs from `pipelineResult.data.costs.evaluation`

**Files to modify**:
- `prompt-bench/commands/improve.ts` (results formatting)

**Data validation**:
- Handle missing scores
- Verify all expected tests completed
- Check for data consistency

## Function Signature

```typescript
const testImproved = async (
  session: ImprovementSession,
  code: string,           // AI-generated TypeScript code
  iteration: number,      // Current iteration number
  options: ImproveOptions // CLI options
): Promise<Result<ImprovedTestResult>>
```

## Implementation Flow

```
┌─────────────────────────────────────────┐
│ 1. Parse TypeScript code                │
│    - Extract template object            │
│    - Validate structure                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Write to file                        │
│    - Generate filename (versioned?)     │
│    - Write template file                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Sync to database                     │
│    - Call syncTemplate()                │
│    - Get new version number             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Run pipeline                         │
│    - Generate images                    │
│    - Evaluate with LLM                  │
│    - Generate report                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Fetch and return results             │
│    - Get scores from database           │
│    - Calculate statistics               │
│    - Format return value                │
└─────────────────────────────────────────┘
```

## Error Handling Strategy

Each phase must use Result type pattern:

```typescript
const parseResult = await parseTemplateCode(code);
if (!parseResult.ok) {
  return err(createError('PARSE_ERROR', `Failed to parse template: ${parseResult.error.message}`));
}
const template = parseResult.data;
```

**Error types to handle**:
- `PARSE_ERROR`: TypeScript code parsing failures
- `STORAGE_ERROR`: File system write failures
- `DATABASE_ERROR`: Sync or query failures
- `PIPELINE_ERROR`: Generation/evaluation failures
- `NO_DATA_ERROR`: Missing results

## Testing Strategy

**Unit tests** (`prompt-bench/__tests__/improve.test.ts`):
1. Test TypeScript code parsing
   - Valid template code → success
   - Invalid syntax → error
   - Missing required fields → error
   - Security violations → error

2. Test file writing
   - Versioned filename generation
   - File content validation
   - Overwrite behavior

3. Test result formatting
   - Convert pipeline results to ImprovedTestResult
   - Handle missing data gracefully

**Integration tests**:
1. End-to-end flow with real database
2. Test with actual AI-generated code samples
3. Verify idempotency (re-running same improvement)

## Dependencies

**Existing code to reuse**:
- `readTemplateFile` - template file parsing
- `writeTemplateFile` - template file writing
- `generateVersionedFilename` - version naming
- `syncTemplate` - database sync
- `runPipeline` - test execution
- `fetchBatchScores` - result retrieval
- `summarize` - statistics calculation

**New code needed**:
- `parseTemplateCode` - runtime code evaluation
- Integration logic in `testImproved`

## Configuration

Check `session.config` for:
- `versionTemplates: boolean` - whether to create versioned files
- `evaluationModel: string` - which model to use for evaluation

Check `options` for:
- `quiet: boolean` - suppress progress output
- `json: boolean` - JSON output format

## Validation Checklist

Before returning success:
- ✅ Template parsed successfully
- ✅ File written to correct location
- ✅ Database sync completed
- ✅ All pipeline phases succeeded
- ✅ Results fetched from database
- ✅ Statistics calculated
- ✅ Costs tracked

## Rollback Strategy

If any phase fails after database sync:
1. Mark template version as 'draft' or 'failed'
2. Do NOT increment iteration counter
3. Preserve error details for debugging
4. Allow retry with same iteration number

## Performance Considerations

- **Parsing**: Fast (milliseconds)
- **File I/O**: Fast (milliseconds)
- **Database sync**: Fast (< 1 second)
- **Pipeline execution**: Slow (seconds to minutes)
  - Generation: 5-30 seconds per test
  - Evaluation: 2-10 seconds per test
  - For 6 tests: ~1-4 minutes total

**Progress tracking**: Use pipeline's progress callback to show status

## Security Considerations

**Code execution safety**:
- Never use `eval()` directly on untrusted input
- Validate code structure before evaluation
- Use `new Function()` with limited scope
- Check for dangerous patterns (filesystem access, network, etc.)

**File system safety**:
- Validate file paths (no directory traversal)
- Ensure write permissions
- Limit file size

## Success Criteria

The `testImproved` function is complete when:
1. ✅ Parses valid AI-generated template code
2. ✅ Writes template to correct file location
3. ✅ Syncs template to database with versioning
4. ✅ Runs full pipeline (generate + evaluate + report)
5. ✅ Returns formatted results with costs
6. ✅ Handles all error cases gracefully
7. ✅ Has unit test coverage
8. ✅ Integration tested with real improve workflow

## Estimated Effort

- Phase 1 (Parsing): 2-3 hours
- Phase 2 (File writing): 1-2 hours
- Phase 3 (Database sync): 1 hour
- Phase 4 (Pipeline execution): 1-2 hours
- Phase 5 (Results formatting): 1 hour
- Testing: 2-3 hours
- **Total**: 8-12 hours

## Next Steps

1. Review this plan for accuracy
2. Confirm approach (especially parsing strategy)
3. Implement Phase 1 (parsing) with tests
4. Implement remaining phases sequentially
5. Integration test with full improve workflow
6. Update documentation
