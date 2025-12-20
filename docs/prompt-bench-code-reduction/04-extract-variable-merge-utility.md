# Extract Variable Merge Utility

## Files to Modify/Create
- prompt-bench/core/orchestrator.ts (modify)

## Implementation Details

The pattern of merging analysis results into test case variables appears twice in orchestrator.ts (in `runPhase` line 418-422 and `coordinateCollectionGeneration` line 758-762).

**Current duplicated pattern:**
```typescript
// Line 418-422 in runPhase
testCase.variables = {
  ...analysisResult.data.merged,
  ...testCase.variables  // Manual overrides take precedence
};

// Line 758-762 in coordinateCollectionGeneration
testCase.variables = {
  ...analysisResult.data.merged,
  ...testCase.variables
};
```

**Required changes:**

1. Add utility function near the top of orchestrator.ts (after imports, before main functions):

```typescript
/**
 * Merge analysis results into test case variables
 * Manual variable values take precedence over analysis results
 */
const mergeAnalysisIntoVariables = (
  testCase: { variables?: Record<string, unknown> },
  analysisResult: { merged: Record<string, unknown> }
): void => {
  testCase.variables = {
    ...analysisResult.merged,
    ...testCase.variables  // Manual overrides take precedence
  };
};
```

2. Replace first occurrence in `runPhase` (around line 418):
```typescript
// Before:
testCase.variables = {
  ...analysisResult.data.merged,
  ...testCase.variables
};

// After:
mergeAnalysisIntoVariables(testCase, analysisResult.data);
```

3. Replace second occurrence in `coordinateCollectionGeneration` (around line 758):
```typescript
// Before:
testCase.variables = {
  ...analysisResult.data.merged,
  ...testCase.variables
};

// After:
mergeAnalysisIntoVariables(testCase, analysisResult.data);
```

## Acceptance Criteria
- [ ] New `mergeAnalysisIntoVariables` helper function added to orchestrator.ts
- [ ] Both occurrences replaced with function call
- [ ] No TypeScript errors: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test prompt-bench`
- [ ] `bun bench test` and `bun bench run` commands work correctly

## Dependencies
None - internal refactor only.

## Risk Level
Very Low - simple extraction of 5-line pattern.

## Savings
~10 lines removed, improved semantic clarity.

## Notes
This is a low-priority cleanup. Could be skipped if other refactors in this area address it as a side effect.
