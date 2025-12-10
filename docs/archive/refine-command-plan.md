# `bun bench refine` Command Implementation Plan

## Overview

Create a new `bun bench refine` command for expert-guided prompt template refinement. Unlike the existing `iterate` command (evolutionary algorithm for variable optimization), `refine` uses batch AI analysis to improve the actual template structure, prompt text, and schema.

**Key Differences from `iterate`:**
| Aspect | iterate | refine |
|--------|---------|--------|
| Goal | Optimize variable values | Improve template structure |
| Approach | Genetic algorithm | Expert AI analysis |
| Analysis | Per-variation stats | Batch (all images at once) |
| Output | Population of variations | Single refined template |

**Workflow:**
1. Generate 6 images with current template
2. Analyze ALL images in ONE AI call (batch analysis)
3. Get per-image + cross-image insights
4. AI proposes modifications to template text, values, and schema
5. Generate HTML report with images, analysis, diffs
6. Auto-resume last session if no `--session` specified
7. User reviews report, runs again to apply changes

## Architecture Decisions

- **Batch Analysis over Per-Image**: Single AI call for all 6 images (~$0.08 vs ~$0.48). Enables cross-image pattern detection.
- **Session-Only Versioning**: Template evolution tracked in session state, not DB. Final version synced manually via `bun bench sync`.
- **Offline Review Workflow**: Generate report → user reviews → run again to apply. Supports `--auto-apply` flag for automation.
- **Auto-Resume**: Running without `--session` loads latest session automatically.
- **Separate Command**: New `refine` command coexists with `iterate` (different purposes, both valuable).

## Implementation Tasks

### Phase 1: Core Type Definitions

- [ ] Create refinement type definitions
  - Files: `prompt-bench/core/refinement-types.ts` (new)
  - Tests: `prompt-bench/__tests__/refinement-types.test.ts` (new)
  - Acceptance:
    - `RefinementState` schema with Zod validation
    - `RefinementRecord` for iteration tracking
    - `RefinementAnalysis` for batch analysis output
    - `TemplateModification` for proposed changes
    - `RefinementConfig` with defaults
    - `QualityHistoryEntry` for trend tracking
    - All types exported from barrel file

- [ ] Define Zod schemas for all refinement types
  - Files: `prompt-bench/core/refinement-types.ts` (modify)
  - Tests: `prompt-bench/__tests__/refinement-types.test.ts` (modify)
  - Acceptance:
    - `RefinementStateSchema` validates full session state
    - `RefinementAnalysisSchema` validates AI response
    - `TemplateModificationSchema` validates proposed changes
    - Schema parsing tests pass with valid/invalid data
  - Dependencies: RefinementState types

### Phase 2: Session Management

- [ ] Add refinement session functions to state.ts
  - Files: `prompt-bench/core/state.ts` (modify)
  - Tests: `prompt-bench/__tests__/state.test.ts` (modify)
  - Acceptance:
    - `createRefinementSession(templateSlug, templateVersion, config)` creates new session
    - `saveRefinementSession(state, sessionsDir?)` persists to disk atomically
    - `loadRefinementSession(sessionId, sessionsDir?)` loads by ID
    - `getLatestRefinementSession(templateSlug?, sessionsDir?)` returns most recent session
    - `listRefinementSessions(sessionsDir?)` returns all sessions
    - Session storage in `prompt-bench/sessions/refinement/`
  - Dependencies: refinement-types.ts

- [ ] Implement auto-resume logic
  - Files: `prompt-bench/core/state.ts` (modify)
  - Tests: `prompt-bench/__tests__/state.test.ts` (modify)
  - Acceptance:
    - If no `--session` flag, load latest session for template
    - If no session exists, require `--template` and `--batch`
    - Return clear error message if cannot resolve session
  - Dependencies: session functions

### Phase 3: Batch Analysis System

- [ ] Create batch image analysis function
  - Files: `prompt-bench/commands/refine-analysis.ts` (new)
  - Tests: `prompt-bench/__tests__/refine-analysis.test.ts` (new)
  - Acceptance:
    - `analyzeRefinementBatch(images, currentTemplate, focusAreas)` returns `Result<RefinementAnalysis>`
    - Single Claude API call for all 6 images
    - Returns per-image analysis with strengths/weaknesses/issues
    - Identifies cross-image patterns (commonIssues)
    - Identifies success patterns
    - Tracks token usage and cost
    - Parses structured JSON response
  - Dependencies: refinement-types.ts

- [ ] Build analysis prompt template
  - Files: `prompt-bench/commands/refine-analysis.ts` (modify)
  - Tests: `prompt-bench/__tests__/refine-analysis.test.ts` (modify)
  - Acceptance:
    - Prompt shows all images with R2 URLs
    - Includes current template data for context
    - Specifies focus areas (realism, lighting, composition)
    - Requests structured JSON output
    - Handles multimodal input (image URLs)
  - Dependencies: analyzeRefinementBatch function

- [ ] Add analysis response parsing and validation
  - Files: `prompt-bench/commands/refine-analysis.ts` (modify)
  - Tests: `prompt-bench/__tests__/refine-analysis.test.ts` (modify)
  - Acceptance:
    - Parses JSON from Claude response
    - Validates against RefinementAnalysisSchema
    - Handles malformed responses gracefully
    - Retries with simplified prompt on failure
  - Dependencies: analysis prompt

### Phase 4: Template Modification Engine

- [ ] Create template modification generator
  - Files: `prompt-bench/core/refinement-engine.ts` (new)
  - Tests: `prompt-bench/__tests__/refinement-engine.test.ts` (new)
  - Acceptance:
    - `generateTemplateModifications(template, schema, analysis, focusAreas)` returns `Result<TemplateModification>`
    - Proposes changes to template text fields
    - Suggests new variables to add to schema
    - Suggests modifications to existing variables
    - Provides rationale for each change
    - Returns confidence score (0-1)
  - Dependencies: refinement-types.ts, refine-analysis.ts

- [ ] Build modification prompt template
  - Files: `prompt-bench/core/refinement-engine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refinement-engine.test.ts` (modify)
  - Acceptance:
    - Includes current template and schema
    - Includes full analysis results
    - Specifies focus areas
    - Requests structured JSON output with rationale
    - Examples of valid modifications in prompt
  - Dependencies: generateTemplateModifications function

- [ ] Implement modification validation
  - Files: `prompt-bench/core/refinement-engine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refinement-engine.test.ts` (modify)
  - Acceptance:
    - Validates field references exist in template
    - Checks removed variables aren't still referenced
    - Validates new variable definitions are valid VariableDefs
    - Rejects invalid modifications with clear error
  - Dependencies: modification generator

- [ ] Create template modification application logic
  - Files: `prompt-bench/core/refinement-engine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refinement-engine.test.ts` (modify)
  - Acceptance:
    - `applyTemplateModifications(template, schema, modifications)` returns new template + schema
    - Applies text changes to templateData fields
    - Adds new variables to schema
    - Removes specified variables
    - Modifies existing variable definitions
    - Returns immutable copies (doesn't mutate input)
  - Dependencies: modification validation

### Phase 5: Convergence Detection

- [ ] Create refinement convergence module
  - Files: `prompt-bench/core/refinement-convergence.ts` (new)
  - Tests: `prompt-bench/__tests__/refinement-convergence.test.ts` (new)
  - Acceptance:
    - `checkRefinementConvergence(state)` returns convergence status
    - Detects max iterations reached
    - Detects target quality achieved (configurable threshold)
    - Detects plateau (< 0.1 improvement for 2 iterations)
    - Returns convergence reason if converged
    - `estimateIterationsToTarget(state)` returns estimate
  - Dependencies: refinement-types.ts

### Phase 6: Report Generation

- [ ] Add refinement report type to report.ts
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: `prompt-bench/__tests__/report.test.ts` (modify)
  - Acceptance:
    - `generateRefinementReport(state, iteration)` returns file path
    - Report includes iteration header (session ID, N of M)
    - Generates to `reports/refinement-{sessionId}-iteration-{n}.html`
    - Auto-opens in browser by default
  - Dependencies: refinement-types.ts

- [ ] Build image gallery section with analysis
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: `prompt-bench/__tests__/report.test.ts` (modify)
  - Acceptance:
    - Shows each product image with score
    - Side-by-side: source image | generated image
    - Lists strengths, weaknesses, specific issues per image
    - Expandable sections for detailed analysis
  - Dependencies: refinement report type

- [ ] Build common issues panel
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: `prompt-bench/__tests__/report.test.ts` (modify)
  - Acceptance:
    - Shows critical issues (severity-based colors)
    - Lists affected image indices
    - Grouped by severity (critical, major, minor)
    - Highlighted at top of report
  - Dependencies: image gallery section

- [ ] Build template diff viewer
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: `prompt-bench/__tests__/report.test.ts` (modify)
  - Acceptance:
    - Shows changes between iterations (iteration N-1 → N)
    - Diff format: `-` for removed, `+` for added
    - Lists new variables with definitions and rationale
    - Lists modified variables with before/after
    - CSS styling for diff visualization
  - Dependencies: common issues panel

- [ ] Build quality trend section
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: `prompt-bench/__tests__/report.test.ts` (modify)
  - Acceptance:
    - Shows score progression: `Iteration N: X.X (+0.X) - Summary`
    - Shows target score
    - Estimates iterations to target
    - Simple ASCII or SVG trend graph
  - Dependencies: template diff viewer

- [ ] Build proposed changes preview section
  - Files: `prompt-bench/commands/report.ts` (modify)
  - Tests: `prompt-bench/__tests__/report.test.ts` (modify)
  - Acceptance:
    - Shows what will change in next iteration
    - Displays confidence level
    - Summary of template text changes count
    - Summary of schema changes count
    - Expandable full details
  - Dependencies: quality trend section

### Phase 7: Main Command Implementation

- [ ] Create refine.ts command skeleton
  - Files: `prompt-bench/commands/refine.ts` (new)
  - Tests: `prompt-bench/__tests__/refine.test.ts` (new)
  - Acceptance:
    - CLI argument parsing with parseArgs
    - Supports: `--template`, `--batch`, `--session`, `--list`, `--status`, `--auto-apply`, `--focus`
    - Exports `refineCommand(args: string[]): Promise<void>`
    - Handles list mode (`--list`)
    - Handles status mode (`--session X --status`)
  - Dependencies: refinement-types.ts, state.ts

- [ ] Implement session resolution logic
  - Files: `prompt-bench/commands/refine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refine.test.ts` (modify)
  - Acceptance:
    - Uses `--session` if provided
    - Otherwise loads latest session via `getLatestRefinementSession`
    - Creates new session if none exists (requires `--template` and `--batch`)
    - Clear error messages for invalid combinations
  - Dependencies: command skeleton

- [ ] Implement main refinement loop
  - Files: `prompt-bench/commands/refine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refine.test.ts` (modify)
  - Acceptance:
    - Calls `getCurrentTemplate(state)` to get/apply template
    - Generates images via orchestrator
    - Fetches evaluation scores from DB
    - Calls `analyzeRefinementBatch()`
    - Calls `generateTemplateModifications()`
    - Updates state with new refinement record
    - Saves session after each iteration
    - Checks convergence and exits if converged
    - Shows next iteration preview
  - Dependencies: session resolution, all analysis/engine modules

- [ ] Implement batch generation function
  - Files: `prompt-bench/commands/refine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refine.test.ts` (modify)
  - Acceptance:
    - Creates batch file from productTests + current template
    - Uses orchestrator.runPipeline()
    - Labels batch: `refinement-{sessionId}-iteration-{n}`
    - Cleans up temp batch file after
    - Returns batch label for evaluation lookup
  - Dependencies: main loop, orchestrator.ts

- [ ] Implement evaluation score fetching
  - Files: `prompt-bench/commands/refine.ts` (modify)
  - Tests: `prompt-bench/__tests__/refine.test.ts` (modify)
  - Acceptance:
    - Queries prompt_tests + prompt_evaluations by batch_label
    - Returns array of {productIndex, productName, imageUrl, score, sourceImageUrl}
    - Handles missing evaluations gracefully
    - Includes R2 URLs for generated images
  - Dependencies: batch generation

- [ ] Register refine command in CLI
  - Files: `prompt-bench/cli.ts` (modify)
  - Tests: None (integration tested)
  - Acceptance:
    - `bun bench refine` invokes refineCommand
    - All subcommands work: `--list`, `--status`, regular invocation
    - Help text included
  - Dependencies: refine.ts complete

### Phase 8: Testing & Polish

- [ ] Write unit tests for refinement-types.ts
  - Files: `prompt-bench/__tests__/refinement-types.test.ts` (new)
  - Acceptance:
    - Schema validation tests (valid/invalid data)
    - Type inference tests
    - Default value tests
    - 80%+ coverage

- [ ] Write unit tests for refine-analysis.ts
  - Files: `prompt-bench/__tests__/refine-analysis.test.ts` (new)
  - Acceptance:
    - Mock Claude API responses
    - Test successful analysis parsing
    - Test error handling (malformed JSON, API errors)
    - Test retry logic
    - 80%+ coverage

- [ ] Write unit tests for refinement-engine.ts
  - Files: `prompt-bench/__tests__/refinement-engine.test.ts` (new)
  - Acceptance:
    - Test modification generation
    - Test validation logic
    - Test application logic
    - Test edge cases (empty changes, invalid references)
    - 80%+ coverage

- [ ] Write unit tests for refinement-convergence.ts
  - Files: `prompt-bench/__tests__/refinement-convergence.test.ts` (new)
  - Acceptance:
    - Test max iterations detection
    - Test target quality detection
    - Test plateau detection
    - Test estimation logic
    - 80%+ coverage

- [ ] Write integration tests for refine command
  - Files: `prompt-bench/__tests__/refine.test.ts` (new)
  - Acceptance:
    - Test full workflow (mock API calls)
    - Test session creation/resume
    - Test auto-resume logic
    - Test report generation
    - 70%+ coverage

- [ ] Add cost tracking
  - Files: `prompt-bench/commands/refine.ts` (modify)
  - Acceptance:
    - Track cumulative cost across iterations
    - Display cost in report
    - Support `--max-cost` flag to abort if exceeded
    - Log cost per iteration

- [ ] Add error handling and edge cases
  - Files: `prompt-bench/commands/refine.ts` (modify), `prompt-bench/core/refinement-engine.ts` (modify)
  - Acceptance:
    - Graceful handling of API failures
    - Retry with exponential backoff
    - Clear error messages with suggestions
    - Partial result recovery where possible

- [ ] Update CLAUDE.md documentation
  - Files: `CLAUDE.md` (modify)
  - Acceptance:
    - Add `bun bench refine` to Commands section
    - Document CLI options
    - Document workflow
    - Add to Recent Updates

- [ ] Export from barrel files
  - Files: `prompt-bench/core/index.ts` (modify), `prompt-bench/commands/index.ts` (modify)
  - Acceptance:
    - All new types exported from core/index.ts
    - refineCommand exported from commands/index.ts

## Acceptance Criteria

- All tests pass: `bun test prompt-bench`
- No TypeScript errors: `bun tsc --noEmit`
- Test coverage: ≥75% for new files
- `bun bench refine --template ecommerce-base --batch prompt-bench/fixtures/images-batch.json` works end-to-end
- Auto-resume works: `bun bench refine` resumes latest session
- HTML report generates with all sections (images, analysis, diff, trends)
- CLI help shows refine command: `bun bench --help`

## Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `prompt-bench/core/refinement-types.ts` | Type definitions + Zod schemas | 200 |
| `prompt-bench/core/refinement-engine.ts` | Modification generation + application | 400 |
| `prompt-bench/core/refinement-convergence.ts` | Convergence detection | 150 |
| `prompt-bench/commands/refine.ts` | Main command | 700 |
| `prompt-bench/commands/refine-analysis.ts` | Batch analysis | 300 |
| `prompt-bench/__tests__/refinement-types.test.ts` | Type tests | 100 |
| `prompt-bench/__tests__/refinement-engine.test.ts` | Engine tests | 200 |
| `prompt-bench/__tests__/refinement-convergence.test.ts` | Convergence tests | 100 |
| `prompt-bench/__tests__/refine-analysis.test.ts` | Analysis tests | 150 |
| `prompt-bench/__tests__/refine.test.ts` | Command tests | 200 |

## Files to Modify

| File | Changes | Est. Lines Added |
|------|---------|------------------|
| `prompt-bench/core/state.ts` | Add refinement session functions | +100 |
| `prompt-bench/commands/report.ts` | Add refinement report type | +300 |
| `prompt-bench/cli.ts` | Register refine command | +5 |
| `prompt-bench/core/index.ts` | Export new modules | +5 |
| `prompt-bench/commands/index.ts` | Export refineCommand | +2 |
| `CLAUDE.md` | Documentation | +20 |

## Dependencies

### External Dependencies (already installed)
- `zod` - Schema validation
- `@anthropic-ai/sdk` - Claude API
- `node:fs/promises` - File operations
- `node:util` - parseArgs

### Internal Dependencies
- `@bench/core/errors` - Result type
- `@bench/core/types` - TemplateData, VariablesSchema, BatchFile
- `@bench/core/orchestrator` - runPipeline
- `@bench/core/compiler` - Template compilation
- `@bench/core/statistics` - Score calculations
- `@/lib/supabase/admin` - Database queries

### Task Dependencies (order matters)
1. refinement-types.ts (foundation for all other tasks)
2. state.ts extensions (session management)
3. refine-analysis.ts (depends on types)
4. refinement-engine.ts (depends on types, analysis)
5. refinement-convergence.ts (depends on types)
6. report.ts extensions (depends on types)
7. refine.ts (depends on all above)
8. cli.ts registration (depends on refine.ts)
9. Tests (after each module)
10. Polish & docs (after all modules)
