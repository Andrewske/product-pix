# Implementation Plan: `bun bench improve` Command

## Overview

Create a new `improve` command that uses a two-stage AI system to automatically improve prompt templates based on test results across diverse products. The command runs baseline tests, gets AI analysis and implementation suggestions, shows you proposed changes for approval/editing, then tests the improved version and tracks score deltas.

## Design Principles

1. **Config-driven**: All defaults in `prompt-bench.toml`, minimal CLI arguments needed
2. **Two-stage AI**: Separate analyzer (what's wrong) and implementer (how to fix)
3. **Human-in-the-loop**: Show proposed changes, allow editing before testing
4. **Track everything**: Template diffs, score deltas, iteration history
5. **Reuse existing**: Leverage orchestrator, evaluator, report generation

## Typical Usage

```bash
# Simple: Just run with config defaults
bun bench improve

# Override specific settings
bun bench improve --template ecommerce-variant --max-iterations 3

# Continue previous session
bun bench improve --continue

# View session history
bun bench improve --history
```

## Configuration (prompt-bench.toml)

```toml
[defaults.improve]
template = "ecommerce-base"
batch_file = "prompt-bench/fixtures/images-batch.json"
max_iterations = 5
target_score = 9.0
auto_approve = false
version_templates = true
ai_model = "claude-sonnet-4-20250514"
```

## Workflow

### Iteration Flow

```
1. Run Baseline Test
   ├─ Load template + batch from config
   ├─ Generate images (1 per product)
   ├─ Evaluate all images
   └─ Calculate baseline scores

2. AI Analysis (Agent 1: Analyzer)
   ├─ Input: template code, evaluations, product info
   ├─ Output: structured analysis + suggestions
   └─ Cost: ~$0.05

3. AI Implementation (Agent 2: Implementer)
   ├─ Input: current template, suggestions
   ├─ Output: modified template code + structured diff
   └─ Cost: ~$0.05

4. Human Approval
   ├─ Show proposed changes with rationale
   ├─ Options: [a]ccept, [e]dit, [d]iff, [r]eject
   ├─ If edit: open template in $EDITOR, wait for save
   └─ Track user modifications

5. Run Improved Test
   ├─ Load improved template
   ├─ Generate images with same batch
   ├─ Evaluate all images
   └─ Calculate improved scores

6. Compare & Record
   ├─ Calculate score deltas per product
   ├─ Save iteration to database
   ├─ Generate comparison report (HTML)
   └─ Update session state

7. Check Stopping Criteria
   ├─ Target score reached?
   ├─ Max iterations reached?
   ├─ User wants to continue?
   └─ If continue: loop to step 2 with improved template as new baseline
```

## Data Structures

### Session State

```typescript
interface ImprovementSession {
  sessionId: string;
  templateSlug: string;
  startedAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'abandoned';

  currentIteration: number;
  maxIterations: number;
  targetScore: number;

  iterations: TemplateIteration[];

  // Cumulative metrics
  initialMeanScore: number;
  currentMeanScore: number;
  totalImprovement: number;
  totalCost: number;
}
```

### Template Iteration

```typescript
interface TemplateIteration {
  iterationNumber: number;
  timestamp: string;

  // Template versions
  baselineTemplate: TemplateCode;
  improvedTemplate: TemplateCode;
  changes: TemplateChange[];
  userModifications?: string;

  // Test identifiers
  baselineBatchLabel: string;
  improvedBatchLabel: string;

  // Results
  baseline: TestResults;
  improved: TestResults;
  delta: ScoreDelta;

  // AI outputs
  analysis: StructuredAnalysis;
  suggestions: Suggestion[];

  // Costs
  costs: IterationCosts;
}

interface TemplateChange {
  path: string;              // e.g., "lighting.style"
  type: 'value_change' | 'logic_change' | 'added' | 'removed';
  before: string;
  after: string;
  lineNumbers: number[];
  reason: string;
  expectedImpact: string;
}

interface TestResults {
  batchLabel: string;
  productCount: number;
  scores: number[];          // Per-product scores
  meanScore: number;
  evaluations: EvaluationSummary[];
}

interface ScoreDelta {
  meanImprovement: number;
  perProductDeltas: number[];
  productsImproved: number;
  productsRegressed: number;
  productsUnchanged: number;
}

interface IterationCosts {
  baselineGeneration: number;
  baselineEvaluation: number;
  aiAnalysis: number;
  aiImplementation: number;
  improvedGeneration: number;
  improvedEvaluation: number;
  total: number;
}
```

### AI Outputs

```typescript
interface StructuredAnalysis {
  overallAssessment: string;
  successPatterns: Pattern[];
  failurePatterns: Pattern[];
  productSegmentAnalysis: SegmentAnalysis[];
}

interface Pattern {
  description: string;
  affectedProducts: string[];
  confidence: number;
}

interface Suggestion {
  field: string;
  currentIssue: string;
  suggestedChange: string;
  expectedImpact: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

interface SegmentAnalysis {
  productType: string;           // e.g., "apparel", "electronics"
  productIndices: number[];
  averageScore: number;
  specificIssues: string[];
}
```

## Database Schema

```sql
-- Sessions table
CREATE TABLE template_improvement_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',

  current_iteration INT NOT NULL DEFAULT 0,
  max_iterations INT NOT NULL,
  target_score DECIMAL(4, 2),

  initial_mean_score DECIMAL(4, 2),
  current_mean_score DECIMAL(4, 2),
  total_improvement DECIMAL(5, 2),
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,

  config JSONB NOT NULL,

  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'abandoned'))
);

-- Iterations table
CREATE TABLE template_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES template_improvement_sessions(session_id) ON DELETE CASCADE,
  iteration_number INT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Template versions
  baseline_template JSONB NOT NULL,
  improved_template JSONB NOT NULL,
  changes JSONB NOT NULL,
  user_modifications TEXT,

  -- Test references
  baseline_batch_label TEXT NOT NULL,
  improved_batch_label TEXT NOT NULL,

  -- Results
  baseline_results JSONB NOT NULL,
  improved_results JSONB NOT NULL,
  delta JSONB NOT NULL,

  -- AI outputs
  analysis JSONB NOT NULL,
  suggestions JSONB NOT NULL,

  -- Costs
  costs JSONB NOT NULL,

  UNIQUE(session_id, iteration_number)
);

-- Indexes
CREATE INDEX idx_sessions_template ON template_improvement_sessions(template_slug);
CREATE INDEX idx_sessions_status ON template_improvement_sessions(status);
CREATE INDEX idx_iterations_session ON template_iterations(session_id);
```

## File Structure

```
prompt-bench/
├── commands/
│   ├── improve.ts              # NEW: Main improve command
│   ├── template-analyzer.ts    # NEW: AI Agent 1 (analyzer)
│   ├── template-implementer.ts # NEW: AI Agent 2 (implementer)
│   └── improvement-session.ts  # NEW: Session state management
├── core/
│   └── template-diff.ts        # NEW: Template diffing utilities
└── templates/
    ├── ecommerce-base.ts       # Original
    ├── ecommerce-base-v2.ts    # After iteration 1 (if version_templates=true)
    └── ecommerce-base-v3.ts    # After iteration 2 (if version_templates=true)
```

## Implementation Phases

### Phase 1: Core Command Structure
**Files**: `commands/improve.ts`, `commands/improvement-session.ts`

1. Parse CLI args and load config
2. Create or load session
3. Implement main iteration loop
4. Add stopping criteria checks
5. Session persistence (save/load)

### Phase 2: AI Analysis
**Files**: `commands/template-analyzer.ts`

1. Define analysis prompt structure
2. Implement Claude API call with structured output
3. Parse and validate analysis response
4. Extract patterns and suggestions
5. Cost tracking

### Phase 3: AI Implementation
**Files**: `commands/template-implementer.ts`, `core/template-diff.ts`

1. Define implementation prompt structure
2. Implement code generation with Claude
3. Parse generated template code
4. Generate structured diff
5. Validate generated code (syntax, schema)
6. Cost tracking

### Phase 4: Approval Flow
**Files**: `commands/improve.ts`

1. Display proposed changes in terminal
2. Interactive prompt for approval
3. Integration with $EDITOR for manual edits
4. Track user modifications
5. Validate user-edited code

### Phase 5: Testing & Comparison
**Files**: `commands/improve.ts` (reuse orchestrator)

1. Run baseline test (reuse `runPipeline`)
2. Generate improved template file
3. Run improved test
4. Fetch and compare results
5. Calculate score deltas

### Phase 6: Reporting & Persistence
**Files**: `commands/improve.ts`, extend `report.ts`

1. Save iteration to database
2. Update session state
3. Generate comparison HTML report
4. Display terminal summary
5. Cost accumulation

### Phase 7: Session Management
**Files**: `commands/improve.ts`, `commands/improvement-session.ts`

1. `--continue` flag to resume sessions
2. `--history` flag to view past iterations
3. List all sessions
4. Archive/delete sessions
5. Export session data

## AI Prompt Design

### Agent 1: Analyzer Prompt

```
You are analyzing prompt template performance across diverse products.

TEMPLATE CODE:
```typescript
{templateCode}
```

EVALUATION RESULTS:
{evaluationResults}

PRODUCT DIVERSITY:
- 5 products tested
- Types: {productTypes}
- Score range: {minScore} - {maxScore}
- Mean: {meanScore}

Analyze the results and provide:

1. SUCCESS PATTERNS: What's working well across products
2. FAILURE PATTERNS: What's causing low scores
3. PRODUCT SEGMENT ANALYSIS: How different product types perform
4. SPECIFIC SUGGESTIONS: Concrete changes to improve scores

Output as JSON matching this schema:
{schema}
```

### Agent 2: Implementer Prompt

```
You are implementing template improvements based on analysis.

CURRENT TEMPLATE:
```typescript
{templateCode}
```

SUGGESTIONS TO IMPLEMENT:
{suggestions}

Generate an improved version of the template that implements these suggestions.

Requirements:
- Maintain the same TypeScript interface
- Add inline comments explaining changes
- Preserve working functionality
- Only change what's necessary

Output:
1. Complete improved template code
2. Structured list of changes with line numbers
3. Brief rationale for each change

Format:
```typescript
// Improved template code here
```

CHANGES:
```json
[
  {
    "path": "lighting.style",
    "before": "harsh studio",
    "after": "soft diffused studio",
    "lineNumbers": [42],
    "reason": "Reduces harsh shadows on soft fabrics"
  }
]
```
```

## Terminal UI Design

### Iteration Progress

```
🔄 Template Improvement: ecommerce-base (Session: a3f9-2c4e)
   Iteration 2/5 | Target: 9.0 | Current: 7.8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 BASELINE TEST (iteration-2-baseline)
   ├─ Generated: 5 images
   ├─ Evaluated: 5 products
   └─ Mean Score: 7.8/10

   Per-product scores:
   • Product 1 (suitcase):      8.2/10 ✓
   • Product 2 (air-purifier):  6.8/10 ⚠
   • Product 3 (headphones):    8.5/10 ✓
   • Product 4 (t-shirt):       5.9/10 ✗
   • Product 5 (mug):           9.0/10 ✓

🤖 AI ANALYSIS
   Identified 2 primary issues:

   1. Harsh lighting causing shadows on soft goods (apparel)
   2. Background gradient creates artifacts with transparent PNGs

   Generated 3 improvement suggestions

🔧 AI IMPLEMENTATION
   Modified 3 template fields:

   [1] lighting.style
       Before: "harsh studio"
       After:  "soft diffused studio with higher key ratio"
       Reason: Reduces harsh shadows on fabrics
       Impact: Should improve apparel scores by ~1.5 points

   [2] lighting.keyToFillRatio
       Before: "2:1"
       After:  "3:1"
       Reason: Softer shadows complement change #1

   [3] background.type
       Before: "gradient white to gray"
       After:  "pure white seamless"
       Reason: Eliminates artifacts with transparent product images
       Impact: Should improve electronics/home goods by ~1.0 point

💾 Improved template generated:
   prompt-bench/templates/ecommerce-base-v3.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?
  [a] Accept changes and test
  [e] Edit template before testing
  [d] Show full diff
  [r] Reject and stop
  [s] Skip testing, continue to next iteration

Choice:
```

### Results Comparison

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ IMPROVED TEST COMPLETE (iteration-2-improved)

📊 SCORE COMPARISON

   Overall:
   Baseline:  7.8/10
   Improved:  8.6/10
   Delta:     +0.8 points ⬆

   Per-product results:
   ┌──────────────────┬──────────┬──────────┬────────┬────────┐
   │ Product          │ Baseline │ Improved │ Delta  │ Status │
   ├──────────────────┼──────────┼──────────┼────────┼────────┤
   │ suitcase         │ 8.2      │ 8.3      │ +0.1   │ ⬆     │
   │ air-purifier     │ 6.8      │ 8.1      │ +1.3   │ ⬆⬆    │
   │ headphones       │ 8.5      │ 9.2      │ +0.7   │ ⬆     │
   │ t-shirt          │ 5.9      │ 8.4      │ +2.5   │ ⬆⬆⬆   │
   │ mug              │ 9.0      │ 8.9      │ -0.1   │ ⬇     │
   └──────────────────┴──────────┴──────────┴────────┴────────┘

   4 products improved
   1 product regressed (minor)
   0 products unchanged

💰 Iteration 2 Costs:
   Generation:  $0.30 (10 images)
   Evaluation:  $0.20 (10 evals)
   AI Analysis: $0.06
   AI Implement: $0.05
   Total:       $0.61

📈 Session Progress:
   Cumulative improvement: +1.4 points (6.4 → 7.8 → 8.6)
   Total cost: $1.23
   Iterations: 2/5
   Target: 9.0 (95% there)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HTML report: reports/improve-a3f9-2c4e-iteration-2.html

Continue improving?
  [y] Continue to iteration 3
  [n] Stop and save session
  [v] View report in browser

Choice:
```

## Error Handling

### Scenarios to Handle

1. **AI generation fails** (API error, timeout)
   - Retry with exponential backoff
   - Log error, allow user to retry or skip
   - Don't lose session state

2. **Generated code is invalid** (syntax error, wrong schema)
   - Show error to user
   - Offer to regenerate or manual edit
   - Validate before testing

3. **Test generation fails** (R2 upload, Gemini API)
   - Save partial results
   - Allow resume from checkpoint
   - Don't charge for failed generations

4. **Score regression** (improved version scores worse)
   - Show comparison prominently
   - Offer to rollback to previous iteration
   - Ask if user wants to continue anyway

5. **Session corruption** (state file damaged)
   - Try to recover from database
   - Warn user of data loss
   - Offer to start new session

## Testing Strategy

### Unit Tests

- `template-diff.ts`: Diff generation accuracy
- `template-analyzer.ts`: Prompt construction, response parsing
- `template-implementer.ts`: Code generation validation
- `improvement-session.ts`: State persistence, session management

### Integration Tests

- Full iteration cycle with mock AI responses
- Session resume after interruption
- Cost calculation accuracy
- Database persistence

### Manual Testing Checklist

- [ ] Create new session with defaults
- [ ] Approve AI changes
- [ ] Edit template manually before testing
- [ ] Reject changes and stop
- [ ] Continue session after closing
- [ ] View session history
- [ ] Handle score regression
- [ ] Reach target score early
- [ ] Hit max iterations
- [ ] Test with different templates
- [ ] Test with different batch files

## Future Enhancements

### Phase 8: Advanced Features (Future)

1. **Multi-objective optimization**: Balance score vs cost vs generation time
2. **A/B testing mode**: Test multiple change strategies in parallel
3. **Rollback capability**: Revert to any previous iteration
4. **Template branching**: Explore different improvement paths
5. **Batch comparison**: Compare sessions across templates
6. **Cost budgets**: Stop if cost exceeds threshold
7. **Confidence scoring**: Track how confident AI is in suggestions
8. **Pattern learning**: Learn which changes work across sessions

## Migration from Current `iterate`

### For Users Currently Using `iterate`

The new `improve` command is designed differently:

**Old `iterate` (evolutionary)**:
- Tests many variations via genetic algorithm
- Expensive (variations × products × generations)
- Black box (don't know why variation won)
- Manual approval each generation

**New `improve` (diagnostic)**:
- Tests one template at a time
- Cheaper (single template × products per iteration)
- Explainable (AI tells you why changes help)
- Learn and apply specific improvements

**Migration path**:
- Keep `iterate` as-is (don't break it)
- Add `improve` as new command
- Users choose which approach fits their workflow

## Summary

The `improve` command provides an efficient, explainable way to iteratively enhance prompt templates:

1. **Config-driven**: Change defaults in `prompt-bench.toml`, run `bun bench improve`
2. **Two-stage AI**: Analyzer identifies issues, Implementer generates fixes
3. **Human-controlled**: Review and edit all changes before testing
4. **Tracked history**: See exactly what changed and impact on scores
5. **Cost-effective**: ~$0.60 per iteration vs $9+ for evolutionary approach

**Next Steps**: Begin Phase 1 implementation with core command structure and session management.
