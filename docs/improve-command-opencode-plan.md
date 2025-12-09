# Template Improvement Command Implementation Plan

## Overview

Implement `bun bench improve` command that uses a two-stage AI system to automatically improve prompt templates based on test results. The command tests a baseline, gets AI analysis and implementation suggestions, shows proposed changes for approval/editing, tests the improved version, and tracks score deltas across iterations.

**Key Features**:
- Config-driven (minimal CLI arguments)
- Two-stage AI: Analyzer (diagnose issues) + Implementer (generate fixes)
- Human-in-the-loop approval with manual editing capability
- Complete change tracking with score deltas
- Session resumability
- Cost tracking per iteration

**Typical Usage**:
```bash
bun bench improve                    # Uses config defaults
bun bench improve --continue         # Resume previous session
bun bench improve --history          # View past sessions
```

## Architecture Decisions

### Decision 1: Separate Command (Not Refactor)
**Choice**: Create new `improve` command, keep existing `iterate` intact
**Rationale**:
- No breaking changes for existing users
- Different use cases (diagnostic vs evolutionary)
- Clean implementation without legacy baggage
- Users can choose appropriate tool

### Decision 2: Two-Stage AI System
**Choice**: Split analysis (what's wrong) and implementation (how to fix) into separate AI agents
**Rationale**:
- Clearer separation of concerns
- Better structured outputs per stage
- Easier to debug and iterate on prompts
- Allows human intervention between stages if needed

### Decision 3: Reuse Existing Orchestrator
**Choice**: Use `runPipeline()` from orchestrator instead of custom test logic
**Rationale**:
- Avoid code duplication
- Benefit from existing R2 integration, cost tracking, error handling
- Consistent with other commands
- Less maintenance burden

### Decision 4: Template Versioning Strategy
**Choice**: Configurable via `version_templates` flag - create new files (v2, v3) or modify in-place
**Rationale**:
- Flexibility for different workflows
- Version history if desired
- Easy rollback to previous iterations
- Git can track in-place modifications

### Decision 5: Session Persistence
**Choice**: Database as source of truth + optional session files for debugging
**Rationale**:
- Queryable history across sessions
- Crash resilience
- Shareable across team
- Aligns with existing DB schema patterns

### Decision 6: Config-First Design
**Choice**: All defaults in `prompt-bench.toml`, CLI args only for overrides
**Rationale**:
- Reduces repetitive typing
- Self-documenting configuration
- Easy to version control settings
- Consistent with existing commands

## Database Schema

```sql
-- Migration: 001_template_improvement_sessions.sql
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

CREATE INDEX idx_sessions_template ON template_improvement_sessions(template_slug);
CREATE INDEX idx_sessions_status ON template_improvement_sessions(status);
CREATE INDEX idx_iterations_session ON template_iterations(session_id);
```

## Implementation Tasks

### Phase 1: Database Schema & Types

- [ ] Create database migration for improvement sessions
  - Files: `supabase/migrations/YYYYMMDDHHMMSS_template_improvement_sessions.sql` (new)
  - Tests: Manual verification via `npx supabase db push`
  - Acceptance: Tables created, indexes present, foreign keys valid

- [ ] Define TypeScript types for improvement system
  - Files: `prompt-bench/core/improvement-types.ts` (new)
  - Tests: Type checking passes, no compilation errors
  - Acceptance: All interfaces defined (ImprovementSession, TemplateIteration, TemplateChange, TestResults, ScoreDelta, IterationCosts, StructuredAnalysis, Suggestion, Pattern, SegmentAnalysis)

- [ ] Create type exports in barrel file
  - Files: `prompt-bench/core/index.ts` (modify)
  - Tests: Import works from other modules
  - Acceptance: All improvement types exported

### Phase 2: Session Management

- [ ] Implement session state management
  - Files: `prompt-bench/commands/improvement-session.ts` (new)
  - Tests: `prompt-bench/commands/__tests__/improvement-session.test.ts` (new)
  - Acceptance:
    - `createSession()` creates new session with defaults
    - `loadSession()` retrieves existing session
    - `saveSession()` persists to database
    - `listSessions()` returns all sessions
    - `updateSession()` updates session state
    - Result<T> error handling for all operations

- [ ] Add session configuration loading
  - Files: `prompt-bench/commands/shared.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/shared.test.ts` (modify)
  - Acceptance:
    - Load `defaults.improve` section from TOML
    - Merge with CLI arguments (args override config)
    - Validation of required fields

### Phase 3: Template Diffing & Utilities

- [ ] Implement template diff generation
  - Files: `prompt-bench/core/template-diff.ts` (new)
  - Tests: `prompt-bench/core/__tests__/template-diff.test.ts` (new)
  - Acceptance:
    - `generateDiff()` produces structured TemplateChange[] from two template versions
    - Detects value changes, logic changes, additions, removals
    - Includes line numbers
    - Handles nested object changes

- [ ] Create template file I/O utilities
  - Files: `prompt-bench/core/template-io.ts` (new)
  - Tests: `prompt-bench/core/__tests__/template-io.test.ts` (new)
  - Acceptance:
    - `readTemplateFile()` loads template code
    - `writeTemplateFile()` saves template with proper formatting
    - `generateVersionedFilename()` creates v2, v3 filenames
    - `validateTemplateCode()` checks TypeScript syntax

### Phase 4: AI Agent 1 - Analyzer

- [ ] Define analyzer prompt structure
  - Files: `prompt-bench/commands/template-analyzer.ts` (new)
  - Tests: `prompt-bench/commands/__tests__/template-analyzer.test.ts` (new)
  - Acceptance:
    - `buildAnalyzerPrompt()` constructs prompt with template + evaluations
    - Includes product diversity info
    - Clear output schema defined

- [ ] Implement analyzer AI call with structured output
  - Files: `prompt-bench/commands/template-analyzer.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/template-analyzer.test.ts` (modify)
  - Acceptance:
    - `analyzeTemplate()` calls Claude API
    - Returns Result<StructuredAnalysis>
    - Parses and validates JSON response
    - Handles API errors gracefully
    - Tracks API cost using pricing config

- [ ] Add pattern extraction logic
  - Files: `prompt-bench/commands/template-analyzer.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/template-analyzer.test.ts` (modify)
  - Acceptance:
    - Extracts success/failure patterns
    - Groups by product segments
    - Generates prioritized suggestions
    - Confidence scores assigned

### Phase 5: AI Agent 2 - Implementer

- [ ] Define implementer prompt structure
  - Files: `prompt-bench/commands/template-implementer.ts` (new)
  - Tests: `prompt-bench/commands/__tests__/template-implementer.test.ts` (new)
  - Acceptance:
    - `buildImplementerPrompt()` constructs prompt with template + suggestions
    - Clear output format specified (code + changes JSON)

- [ ] Implement code generation with Claude
  - Files: `prompt-bench/commands/template-implementer.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/template-implementer.test.ts` (modify)
  - Acceptance:
    - `implementSuggestions()` calls Claude API
    - Returns Result<{ code: string; changes: TemplateChange[] }>
    - Extracts code and changes from response
    - Validates TypeScript syntax
    - Tracks API cost

- [ ] Add code validation and safety checks
  - Files: `prompt-bench/commands/template-implementer.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/template-implementer.test.ts` (modify)
  - Acceptance:
    - Generated code passes TypeScript type checking
    - Template interface preserved
    - No dangerous code patterns (eval, exec, etc.)
    - Export structure matches original

### Phase 6: Core Improve Command

- [ ] Implement command entry point and arg parsing
  - Files: `prompt-bench/commands/improve.ts` (new)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (new)
  - Acceptance:
    - `improveCommand()` entry point defined
    - Parses CLI args: --template, --batch, --continue, --history, --max-iterations, --target-score, --auto-approve
    - Loads config from TOML
    - Merges args with config (args win)

- [ ] Implement main iteration loop
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - `runIterationLoop()` orchestrates full cycle
    - Handles session creation/loading
    - Checks stopping criteria (max iterations, target score)
    - Saves state after each iteration
    - Handles interruptions gracefully

- [ ] Integrate baseline test execution
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - Calls `runPipeline()` from orchestrator
    - Generates unique batch label
    - Fetches evaluation results from DB
    - Calculates baseline scores
    - Tracks generation/evaluation costs

- [ ] Integrate improved test execution
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - Writes improved template to file (versioned or in-place)
    - Calls `runPipeline()` with improved template
    - Fetches evaluation results
    - Calculates improved scores
    - Tracks costs

### Phase 7: Comparison & Results

- [ ] Implement score delta calculation
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - `calculateScoreDelta()` computes per-product deltas
    - Counts improved/regressed/unchanged products
    - Calculates mean improvement
    - Returns ScoreDelta structure

- [ ] Create comparison display logic
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Manual testing (terminal output)
  - Acceptance:
    - Displays baseline vs improved scores
    - Shows per-product comparison table
    - Color-codes improvements (green) and regressions (red)
    - Shows cumulative session progress

- [ ] Implement results persistence
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - Saves iteration to `template_iterations` table
    - Updates session state in `template_improvement_sessions`
    - Includes all data: templates, changes, results, costs
    - Atomic transaction for consistency

### Phase 8: Human Approval Interface

- [ ] Implement change display UI
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Manual testing (terminal output)
  - Acceptance:
    - Displays proposed changes with rationale
    - Shows expected impact per change
    - Clear, readable formatting
    - Groups related changes

- [ ] Add interactive approval prompt
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Manual testing (interactive)
  - Acceptance:
    - Prompts user: [a]ccept, [e]dit, [d]iff, [r]eject, [s]kip
    - Validates user input
    - Handles each option appropriately
    - Can be bypassed with --auto-approve flag

- [ ] Integrate editor for manual modifications
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Manual testing (opens editor)
  - Acceptance:
    - Opens improved template in $EDITOR
    - Waits for user to save and close
    - Re-validates modified code
    - Tracks user modifications in session
    - Handles editor failures gracefully

- [ ] Add diff viewer
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Manual testing (terminal output)
  - Acceptance:
    - Shows side-by-side or unified diff
    - Syntax-highlighted if possible
    - Line numbers included
    - Clear before/after sections

### Phase 9: Session Commands

- [ ] Implement --continue flag
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - Loads most recent active session
    - Resumes from last completed iteration
    - Preserves all state (scores, costs, templates)
    - Handles case where no active session exists

- [ ] Implement --history flag
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improve.test.ts` (modify)
  - Acceptance:
    - Lists all sessions for template
    - Shows: session ID, iterations, score progression, total cost
    - Sortable by date, score improvement, cost
    - Option to resume or delete sessions

- [ ] Add session cleanup utilities
  - Files: `prompt-bench/commands/improvement-session.ts` (modify)
  - Tests: `prompt-bench/commands/__tests__/improvement-session.test.ts` (modify)
  - Acceptance:
    - `archiveSession()` marks session as completed
    - `deleteSession()` removes session and iterations (cascade)
    - `cleanupOldSessions()` removes sessions older than N days

### Phase 10: Reporting

- [ ] Generate iteration comparison report
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: Manual testing (HTML output)
  - Acceptance:
    - New report type: improvement-iteration
    - Shows baseline vs improved side-by-side
    - Includes per-product image comparisons
    - Displays change rationale and AI analysis
    - Links to full evaluation details

- [ ] Generate session summary report
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: Manual testing (HTML output)
  - Acceptance:
    - New report type: improvement-session
    - Shows progression across all iterations
    - Score trend graphs
    - Cost breakdown per iteration
    - Template evolution timeline
    - Exportable as PDF or shareable link

### Phase 11: CLI Integration

- [ ] Register improve command in CLI
  - Files: `prompt-bench/cli.ts` (modify)
  - Tests: Manual testing (`bun bench improve --help`)
  - Acceptance:
    - Command shows in help text
    - Proper argument descriptions
    - Examples included
    - Routes to improveCommand()

- [ ] Update CLI help documentation
  - Files: `prompt-bench/cli.ts` (modify)
  - Tests: Manual testing (help output)
  - Acceptance:
    - Clear description of improve command
    - Lists all flags with defaults
    - Shows example usage
    - Mentions config file integration

### Phase 12: Error Handling & Edge Cases

- [ ] Handle AI API failures
  - Files: `prompt-bench/commands/template-analyzer.ts`, `prompt-bench/commands/template-implementer.ts` (modify)
  - Tests: Unit tests with mock API errors
  - Acceptance:
    - Retry with exponential backoff (3 attempts)
    - Clear error messages
    - Session state preserved on failure
    - User can retry or abort

- [ ] Handle invalid generated code
  - Files: `prompt-bench/commands/template-implementer.ts` (modify)
  - Tests: Unit tests with malformed code
  - Acceptance:
    - TypeScript validation catches errors
    - Shows syntax errors to user
    - Offers to regenerate or manual edit
    - Doesn't proceed to testing with invalid code

- [ ] Handle test failures
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Integration tests with mock failures
  - Acceptance:
    - Distinguishes generation vs evaluation failures
    - Saves partial results if possible
    - Allows retry of failed tests
    - Doesn't lose previous iteration data

- [ ] Handle score regressions
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Unit tests with regressing scores
  - Acceptance:
    - Prominently displays regression
    - Asks user if they want to continue or rollback
    - Offers to skip testing and try different suggestions
    - Tracks regression in session metadata

- [ ] Handle session conflicts
  - Files: `prompt-bench/commands/improvement-session.ts` (modify)
  - Tests: Unit tests with concurrent access
  - Acceptance:
    - Detects concurrent modifications
    - Prevents overwriting newer data
    - Clear error message
    - Suggests reload or merge strategies

### Phase 13: Cost Tracking & Budgets

- [ ] Integrate cost calculation per iteration
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Unit tests verifying cost sums
  - Acceptance:
    - Tracks generation costs (baseline + improved)
    - Tracks evaluation costs (baseline + improved)
    - Tracks AI analysis cost
    - Tracks AI implementation cost
    - Sum matches orchestrator costs + AI costs

- [ ] Add cumulative cost tracking
  - Files: `prompt-bench/commands/improvement-session.ts` (modify)
  - Tests: Unit tests verifying accumulation
  - Acceptance:
    - Session maintains total_cost_usd
    - Updates after each iteration
    - Displayed in terminal and reports
    - Queryable from database

- [ ] Display cost warnings
  - Files: `prompt-bench/commands/improve.ts` (modify)
  - Tests: Manual testing with high costs
  - Acceptance:
    - Warns if iteration cost exceeds threshold (configurable)
    - Warns if total session cost exceeds budget
    - User can confirm or abort
    - Budget configurable in TOML (optional)

### Phase 14: Documentation & Polish

- [ ] Add inline code documentation
  - Files: All new/modified files
  - Tests: TypeDoc generation passes
  - Acceptance:
    - All public functions have JSDoc comments
    - Complex logic has explanatory comments
    - Type definitions documented
    - Examples in doc comments where helpful

- [ ] Create user guide
  - Files: `docs/improve-command-guide.md` (new)
  - Tests: Manual review
  - Acceptance:
    - Explains workflow with examples
    - Documents all CLI flags
    - Shows TOML configuration
    - Includes troubleshooting section
    - Links to example sessions

- [ ] Update CLAUDE.md with improve command
  - Files: `CLAUDE.md` (modify)
  - Tests: Manual review
  - Acceptance:
    - Lists improve in commands section
    - Brief description and example
    - Links to full guide
    - Notes differences from iterate

- [ ] Add integration examples
  - Files: `prompt-bench/examples/improve-workflow.md` (new)
  - Tests: Manual testing following examples
  - Acceptance:
    - End-to-end example session
    - Shows typical config setup
    - Demonstrates editing flow
    - Shows how to interpret results

## Acceptance Criteria

### Functional Requirements
- [ ] `bun bench improve` runs full iteration cycle
- [ ] Baseline test generates and evaluates images
- [ ] AI analyzer produces structured analysis
- [ ] AI implementer generates valid template code
- [ ] User can approve, edit, or reject changes
- [ ] Improved test runs with modified template
- [ ] Score comparison calculated and displayed
- [ ] All data persisted to database
- [ ] Session resumable with --continue
- [ ] --history shows past sessions
- [ ] All costs tracked and displayed
- [ ] Error handling prevents data loss

### Code Quality
- [ ] All TypeScript strict mode passes
- [ ] No `any` types except where explicitly justified
- [ ] Test coverage ≥75% for new code
- [ ] All functions have explicit return types
- [ ] Functions ≤20 lines (exceptions documented)
- [ ] Nesting ≤3 levels
- [ ] Result<T> used for error handling consistently
- [ ] No scattered console.logs (use centralized logging)

### Performance
- [ ] Single iteration completes in <5 minutes (typical)
- [ ] Database queries optimized (no N+1)
- [ ] Large evaluations (100+ products) handled efficiently
- [ ] Session loading <1 second
- [ ] Memory usage reasonable (no leaks)

### User Experience
- [ ] Clear progress indicators during long operations
- [ ] Helpful error messages with actionable guidance
- [ ] Terminal output readable and well-formatted
- [ ] Sensible defaults require minimal configuration
- [ ] Examples in help text
- [ ] Confirmation prompts for destructive actions

## Files to Create

```
supabase/migrations/
  YYYYMMDDHHMMSS_template_improvement_sessions.sql

prompt-bench/core/
  improvement-types.ts
  template-diff.ts
  template-io.ts
  __tests__/
    template-diff.test.ts
    template-io.test.ts

prompt-bench/commands/
  improve.ts
  improvement-session.ts
  template-analyzer.ts
  template-implementer.ts
  __tests__/
    improve.test.ts
    improvement-session.test.ts
    template-analyzer.test.ts
    template-implementer.test.ts

docs/
  improve-command-guide.md

prompt-bench/examples/
  improve-workflow.md
```

## Files to Modify

```
prompt-bench.toml
  [defaults.improve] section already added

prompt-bench/core/index.ts
  Export improvement types

prompt-bench/commands/shared.ts
  Load improve config section

prompt-bench/commands/report.ts
  Add improvement report types

prompt-bench/cli.ts
  Register improve command

CLAUDE.md
  Document improve command
```

## Dependencies

### External Dependencies
- `@anthropic-ai/sdk`: For AI analysis and code generation (already in package.json)
- `zod`: For schema validation (already in package.json)
- TypeScript compiler API: For code validation (already available)

### Internal Dependencies
- `prompt-bench/core/orchestrator.ts`: Reuse `runPipeline()` for testing
- `prompt-bench/core/errors.ts`: Use Result<T> error handling
- `prompt-bench/commands/shared.ts`: Config loading utilities
- `lib/supabase/admin.ts`: Database access
- `lib/pricing/`: Cost calculation

### Task Dependencies
- Phase 1 must complete before Phase 2 (types needed)
- Phase 2 must complete before Phase 6 (session management needed)
- Phase 3 must complete before Phase 5 (diff needed for implementer)
- Phase 4 must complete before Phase 6 (analyzer needed in iteration loop)
- Phase 5 must complete before Phase 6 (implementer needed in iteration loop)
- Phase 6 must complete before Phase 7, 8, 9 (core loop needed)
- Phase 10 depends on Phase 7 (results needed for reporting)
- Phase 11 depends on Phase 6 (command must exist)
- Phase 14 can happen in parallel with testing

## Testing Strategy

### Unit Tests
- All new modules in `prompt-bench/core/` have corresponding test files
- All command logic has unit tests with mocked dependencies
- AI prompts tested with mock responses
- Error handling paths tested
- Cost calculation verified

### Integration Tests
- Full iteration cycle with mocked AI and orchestrator
- Session persistence round-trip (save/load)
- Database operations with test data
- Configuration loading with various TOML scenarios

### Manual Testing Checklist
- [ ] Run improve with default config
- [ ] Approve all changes automatically
- [ ] Reject changes and abort
- [ ] Edit template manually before testing
- [ ] Resume session after interruption
- [ ] View session history
- [ ] Handle score regression
- [ ] Reach target score early
- [ ] Hit max iterations
- [ ] Test with different templates
- [ ] Test with different batch sizes (5, 10, 50 products)
- [ ] Verify HTML reports render correctly
- [ ] Check cost calculations against expectations

## Rollout Plan

### Phase 1: Internal Testing (Week 1-2)
- Implement Phases 1-6 (core functionality)
- Test with small batches (5 products)
- Verify AI output quality
- Tune prompts based on results

### Phase 2: Feature Complete (Week 3)
- Implement Phases 7-11 (full features)
- Test with realistic batches (20+ products)
- Validate cost estimates
- Collect feedback on UX

### Phase 3: Polish & Documentation (Week 4)
- Implement Phases 12-14 (error handling, docs)
- Write comprehensive guide
- Create video walkthrough
- Prepare for release

### Phase 4: Release
- Merge to main branch
- Update changelog
- Announce in product updates
- Monitor usage and collect feedback

## Cost Estimation

**Per Iteration**:
- Baseline generation: 5 images × $0.03 = $0.15
- Baseline evaluation: 5 evals × $0.02 = $0.10
- AI analysis: 1 call × ~$0.05 = $0.05
- AI implementation: 1 call × ~$0.05 = $0.05
- Improved generation: 5 images × $0.03 = $0.15
- Improved evaluation: 5 evals × $0.02 = $0.10
- **Total: ~$0.60/iteration**

**Typical Session** (5 iterations to reach 9.0 target):
- 5 iterations × $0.60 = **$3.00 total**

**Comparison to evolutionary `iterate`**:
- Evolutionary: 10 gens × 5 variations × 6 products × $0.03 = $9.00+
- Improvement: 5 iterations × 6 products (baseline + improved) × $0.03 + AI = $3.00
- **Savings: ~67% cost reduction**

## Success Metrics

### Quantitative
- Command completes successfully 95%+ of runs
- Mean score improvement ≥1.0 points per session
- Cost per iteration ≤$0.75
- Iteration cycle time ≤5 minutes
- User adoption >50% of bench users within 1 month

### Qualitative
- Users report clearer understanding of template issues
- AI suggestions are actionable and make sense
- Workflow feels smooth and efficient
- Less manual prompt engineering time required
- Positive feedback on reports and visualizations

## Future Enhancements (Not in MVP)

- [ ] Multi-objective optimization (score vs cost vs speed)
- [ ] A/B testing mode (test multiple strategies in parallel)
- [ ] Automatic rollback on regression
- [ ] Template branching (explore different paths)
- [ ] Pattern learning across sessions
- [ ] Cost budgets with auto-stop
- [ ] Confidence-weighted suggestions
- [ ] Integration with CI/CD for automated testing
- [ ] Slack/Discord notifications for long-running sessions
- [ ] Web dashboard for session monitoring

---

**Plan ready at `docs/improve-command-opencode-plan.md`. Run OpenCode orchestrator to implement.**
