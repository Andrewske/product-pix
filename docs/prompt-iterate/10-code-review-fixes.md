# Code Review Fixes for Prompt Iteration System

Tasks from code review of commit `9b3673bd`. Each task is independent and can be completed in any order within its priority level.

---

## Critical Priority (Must Fix)

### Task 1: Fix Duplicate Describe Block in Tests
- [ ] Remove duplicate `describe('iteration-types')` block

**File**: `prompt-bench/__tests__/iteration-types.test.ts`
**Lines**: 9-11

**Problem**:
```typescript
describe('iteration-types', () => {

describe('iteration-types', () => {  // <-- duplicate nested block
```

**Fix**:
Remove line 9 (the outer empty describe). The file should start with a single describe block:
```typescript
import { ... } from '@bench/core/iteration-types';

describe('iteration-types', () => {
  describe('MutationTypeSchema', () => {
    // ...
```

**Why**: Causes confusing test output and is clearly a copy-paste error.

---

### Task 2: Replace `any` Types in Evolution Engine
- [ ] Replace `any` with proper types for `insights` and `config` parameters

**File**: `prompt-bench/core/evolution.ts`
**Lines**: 226-227

**Problem**:
```typescript
export const evolvePopulation = async (
  state: IterationState,
  insights: any, // StructuredInsight
  config: any // IterationConfig
): Promise<Result<PromptVariation[]>> => {
```

**Fix**:
```typescript
import type { StructuredInsight, IterationConfig } from '@bench/core/iteration-types';

export const evolvePopulation = async (
  state: IterationState,
  insights: StructuredInsight,
  config: IterationConfig
): Promise<Result<PromptVariation[]>> => {
```

**Why**: Comments indicate intent to use proper types; `any` defeats TypeScript benefits and violates project standards.

---

### Task 3: Replace `z.any()` with Proper Schema for templateData
- [ ] Create or import proper Zod schema for templateData

**File**: `prompt-bench/core/iteration-types.ts`
**Line**: 50

**Problem**:
```typescript
templateData: z.any(), // TemplateData from types.ts - using any to avoid circular import
```

**Fix Options**:

Option A - Create inline schema:
```typescript
const TemplateDataSchema = z.object({
  subject: z.string(),
  background: z.string(),
  lighting: z.string(),
  camera: z.string(),
  style: z.string(),
  quality: z.string(),
  negative: z.string(),
}).passthrough(); // Allow additional fields

// Then use:
templateData: TemplateDataSchema,
```

Option B - Use z.custom with type guard:
```typescript
import type { TemplateData } from './types';

templateData: z.custom<TemplateData>((val) => {
  return typeof val === 'object' && val !== null && 'subject' in val;
}),
```

**Why**: `z.any()` bypasses all validation, allowing invalid data to pass through.

---

## Important Priority (Should Fix)

### Task 4: Implement TODO Stubs in Iterate Command
- [ ] Implement or throw proper errors for all TODO stubs

**File**: `prompt-bench/commands/iterate.ts`
**Lines**: 141, 296-306, 308-318, 373-380

**Problem**: Multiple unimplemented functions with TODO comments:

1. Line 141: `// TODO: Load initial batch and create first generation`
2. Lines 296-306: `runAndEvaluatePopulation` returns placeholder `true`
3. Lines 308-318: `buildSummary` returns empty placeholder
4. Lines 373-380: `updateStateWithApproved` is empty

**Fix**: For each TODO, either:

A) Implement the functionality:
```typescript
// Example for buildSummary:
const buildSummary = (state: IterationState): BatchSummary => {
  const latestGen = state.generations[state.generations.length - 1];
  const scores = latestGen?.variations.map(v => v.score ?? 0) ?? [];

  return {
    label: `iteration-${state.sessionId}-gen${state.generations.length}`,
    testCount: scores.length,
    stats: summarize(scores), // from @bench/core/statistics
    scoreDistribution: getScoreDistribution(scores),
    topTests: /* extract from variations */,
    bottomTests: /* extract from variations */,
  };
};
```

B) Or throw explicit "not implemented" error:
```typescript
import { createError, err } from '@bench/core/errors';

const runAndEvaluatePopulation = async (...): Promise<boolean> => {
  throw new Error('Population evaluation not yet implemented. Use `bun bench test` separately.');
};
```

**Why**: Users will attempt to use iterate command and get confusing behavior when core functions don't work.

---

### Task 5: Fix Misleading Source Type for Elite Variations
- [ ] Use semantically correct source type for elite variations

**File**: `prompt-bench/core/evolution.ts`
**Line**: 345

**Problem**:
```typescript
elites.push({
  id: variationId,
  parentIds: [],
  source: 'user', // Mark as preserved  <-- misleading!
  templateData: template,
  rationale: 'Elite performer carried over from previous generation',
  confidence: 1.0,
});
```

**Fix Options**:

Option A - Add new source type (preferred):
```typescript
// In iteration-types.ts, update VariationSourceSchema:
export const VariationSourceSchema = z.enum([
  'mutation',
  'crossover',
  'wild',
  'user',
  'elite'  // Add this
]);

// Then in evolution.ts:
source: 'elite',
```

Option B - Keep existing ID to preserve lineage:
```typescript
// Find original variation and copy its source
const original = findVariationById(variationId, state);
elites.push({
  id: randomUUID(), // New ID for new generation
  parentIds: [variationId], // Track lineage
  source: 'mutation', // Or keep original source
  // ...
});
```

**Why**: `source: 'user'` implies human-provided custom prompt, not system-selected elite.

---

### Task 6: Fix Test Directory Mismatch in State Tests
- [ ] Make state tests actually test the production code path

**File**: `prompt-bench/__tests__/state.test.ts`
**Line**: 11

**Problem**:
```typescript
const TEST_SESSIONS_DIR = 'prompt-bench/sessions-test';
// But actual code in state.ts uses:
const SESSIONS_DIR = 'prompt-bench/sessions';
```
Tests pass but don't validate production behavior.

**Fix Options**:

Option A - Mock fs module:
```typescript
import { jest } from '@jest/globals';
import { promises as fs } from 'node:fs';

jest.mock('node:fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    // ...
  }
}));
```

Option B - Use dependency injection (better long-term):
```typescript
// In state.ts, add optional sessionsDir parameter:
export const loadSession = async (
  sessionId: string,
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<IterationState>> => {
  const sessionPath = join(sessionsDir, `${sessionId}.json`);
  // ...
};

// In tests:
const result = await loadSession(session.sessionId, TEST_SESSIONS_DIR);
```

**Why**: Tests that don't exercise production code paths can miss real bugs.

---

### Task 7: Fix Non-UUID ID Generation in Insights
- [ ] Use proper UUID generation for variation IDs

**File**: `prompt-bench/commands/insights.ts`
**Line**: 401

**Problem**:
```typescript
const proposedVariations: PromptVariation[] = parsed.proposedVariations.map((v: any, index: number) => ({
  id: v.id || `var-${Date.now()}-${index}`,  // <-- Not a UUID!
  // ...
}));
```
Schema expects UUID format but fallback creates non-UUID.

**Fix**:
```typescript
import { randomUUID } from 'node:crypto';

const proposedVariations: PromptVariation[] = parsed.proposedVariations.map((v: any, index: number) => ({
  id: v.id || randomUUID(),
  // ...
}));
```

**Why**: Consistency with schema; UUIDs are expected throughout the iteration system.

---

## Suggestions (Future Improvements)

### Task 8: Extract Hardcoded Model Version to Constant
- [ ] Create constant for Claude model version

**File**: `prompt-bench/core/evolution.ts`
**Lines**: 85, 136, 184

**Problem**: Model string repeated 3 times:
```typescript
model: 'claude-sonnet-4-20250514',
```

**Fix**:
```typescript
// At top of file:
const EVOLUTION_MODEL = 'claude-sonnet-4-20250514' as const;

// Then use throughout:
model: EVOLUTION_MODEL,
```

**Why**: DRY principle; easier to update model version in one place.

---

### Task 9: Add Dependency Injection for Anthropic Client
- [ ] Accept Anthropic client as parameter for testability

**File**: `prompt-bench/core/evolution.ts`
**Lines**: 79, 130, 179

**Problem**: New client created in each function:
```typescript
const client = new Anthropic({ apiKey });
```

**Fix**:
```typescript
// Create factory function:
const getAnthropicClient = (() => {
  let client: Anthropic | null = null;
  return () => {
    if (!client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY required');
      client = new Anthropic({ apiKey });
    }
    return client;
  };
})();

// Or accept as parameter:
export const generateMutation = async (
  parent: TemplateData,
  mutationType: MutationType,
  context: EvolutionContext,
  client?: Anthropic  // Optional for testing
): Promise<Result<PromptVariation>> => {
  const anthropic = client ?? getAnthropicClient();
  // ...
};
```

**Why**: Enables mocking in tests; avoids unnecessary object allocation.

---

### Task 10: Extract Rate Limit to Configuration
- [ ] Make rate limiting configurable

**File**: `prompt-bench/core/evolution.ts`
**Lines**: 263, 287, 300

**Problem**: Hardcoded sleep duration:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Fix**:
```typescript
// Add to IterationConfig in iteration-types.ts:
apiRateLimitMs: z.number().int().positive().default(1000),

// Use in evolution.ts:
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In evolvePopulation:
await sleep(config.apiRateLimitMs);
```

**Why**: Flexibility for different rate limits; makes testing faster.

---

### Task 11: Add Error Logging for Failed Variations
- [ ] Log or track when mutation/crossover generation fails

**File**: `prompt-bench/core/evolution.ts`
**Lines**: 250-260

**Problem**: Silent continue on failure:
```typescript
const result = await generateMutation(parentTemplate, mutationType, context);
if (result.ok) {
  result.data.parentIds = parentIds;
  variations.push(result.data);
}
// No else branch - failures silently ignored
```

**Fix**:
```typescript
const result = await generateMutation(parentTemplate, mutationType, context);
if (result.ok) {
  result.data.parentIds = parentIds;
  variations.push(result.data);
} else {
  console.warn(`[evolve] Mutation failed: ${result.error.message}`);
  // Or track in a failures array returned alongside variations
}
```

**Why**: Debugging difficulty when variations fail silently; user has no visibility into issues.

---

### Task 12: Deduplicate Pattern Schemas
- [ ] Merge identical SuccessPatternSchema and FailurePatternSchema

**File**: `prompt-bench/core/iteration-types.ts`
**Lines**: 66-85

**Problem**: Two identical schemas:
```typescript
export const SuccessPatternSchema = z.object({
  pattern: z.string(),
  component: z.string(),
  frequency: z.number().int().min(0),
  avgScore: z.number().min(0).max(10),
});

export const FailurePatternSchema = z.object({
  pattern: z.string(),
  component: z.string(),
  frequency: z.number().int().min(0),
  avgScore: z.number().min(0).max(10),
});
```

**Fix**:
```typescript
export const PatternSchema = z.object({
  pattern: z.string(),
  component: z.string(),
  frequency: z.number().int().min(0),
  avgScore: z.number().min(0).max(10),
});

export type Pattern = z.infer<typeof PatternSchema>;
export type SuccessPattern = Pattern;
export type FailurePattern = Pattern;

// In StructuredInsightSchema:
successPatterns: z.array(PatternSchema),
failurePatterns: z.array(PatternSchema),
```

**Why**: DRY principle; identical code should be unified.

---

### Task 13: Deduplicate Summary Formatters in Insights
- [ ] Refactor duplicate formatSummaryForPrompt functions

**File**: `prompt-bench/commands/insights.ts`
**Lines**: 264-297, 332-365

**Problem**: `formatSummaryForPrompt` and `formatSummaryForStructuredPrompt` are ~80% identical.

**Fix**:
```typescript
const formatSummaryBase = (summary: BatchSummary): string => {
  return `
Label: ${summary.label}
Total Tests: ${summary.testCount}

Statistics:
- Mean Score: ${summary.stats.mean.toFixed(2)}/10
- Std Deviation: ${summary.stats.stdDev.toFixed(2)}
- Range: ${summary.stats.min.toFixed(1)} - ${summary.stats.max.toFixed(1)}
- Median: ${summary.stats.median.toFixed(1)}

Score Distribution:
${Object.entries(summary.scoreDistribution)
  .map(([range, count]) => `- ${range}: ${count} tests`)
  .join('\n')}
`;
};

const formatSummaryForPrompt = (summary: BatchSummary): string => {
  let text = formatSummaryBase(summary);
  text += formatTopBottom(summary, false); // without templateData
  text += formatComparison(summary);
  return text;
};

const formatSummaryForStructuredPrompt = (summary: BatchSummary): string => {
  let text = formatSummaryBase(summary);
  text += formatTopBottom(summary, true); // with templateData
  text += formatComparison(summary);
  return text;
};
```

**Why**: Maintainability; changes need to be made in one place.

---

### Task 14: Add Tests for generateStructuredInsights
- [ ] Create test file for insights.ts structured insights function

**File**: Create `prompt-bench/__tests__/insights.test.ts`

**Problem**: No tests exist for `generateStructuredInsights` despite being a key function.

**Fix**: Create tests that mock Anthropic API:
```typescript
import { generateStructuredInsights } from '@bench/commands/insights';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

describe('insights', () => {
  describe('generateStructuredInsights', () => {
    it('parses valid API response', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: JSON.stringify({
          keyFindings: ['finding1'],
          recommendations: ['rec1'],
          nextSteps: ['step1'],
          proposedVariations: [],
          successPatterns: [],
          failurePatterns: [],
        })}],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: jest.fn().mockResolvedValue(mockResponse) },
      }));

      const result = await generateStructuredInsights(mockSummary);
      expect(result.ok).toBe(true);
    });

    it('handles API errors gracefully', async () => { /* ... */ });
    it('extracts JSON from markdown code blocks', async () => { /* ... */ });
  });
});
```

**Why**: Critical function lacks test coverage; regressions would go undetected.

---

### Task 15: Extract Magic Number for Default Target Score
- [ ] Make default target score configurable

**File**: `prompt-bench/core/convergence.ts`
**Line**: 167

**Problem**:
```typescript
const targetEstimate = estimateGenerationsToTarget(state, 9.5); // Default target
```

**Fix**:
```typescript
// In iteration-types.ts IterationConfigSchema:
defaultTargetScore: z.number().min(0).max(10).default(9.5),

// In convergence.ts:
const targetEstimate = estimateGenerationsToTarget(
  state,
  state.config.defaultTargetScore
);
```

**Why**: Business logic should be configurable, not hardcoded.

---

### Task 16: Reconsider Reports in .gitignore
- [ ] Decide whether HTML reports should be tracked in git

**File**: `.gitignore`
**Line**: 45

**Problem**: `reports/` was uncommented, meaning reports are now tracked:
```diff
-reports/
+# reports/
```

**Options**:
1. Keep tracked if reports are valuable documentation
2. Re-ignore if they cause repo bloat:
```gitignore
reports/
!reports/.gitkeep
```

**Why**: HTML reports can be large and auto-generated; tracking them may bloat repository.
