# Notebook UI Implementation Plan

## Overview

This plan implements a phase-based interactive notebook interface for Prompt Bench, enabling iterative prompt engineering with granular control at each stage.

**Key Features**:
- **Phase-based execution**: Run analysis multiple times → lock best → run generation multiple times → lock best → run evaluation
- **Maximum visibility**: Display thinking output, token counts, raw prompts, API responses for debugging
- **Fixture image management**: Select from pre-uploaded test images via visual grid
- **Run comparison**: Compare multiple attempts within each phase
- **Simple persistence**: SessionStorage with data URLs for active session, database for completed runs

**Architecture**:
- Session ID: `{product}-notebook-{timestamp}-{hash}`
- Three phases: Analysis → Generation → Evaluation
- Each phase can be run multiple times with variable changes
- Parent-child relationships: Generation runs link to specific Analysis run, Evaluation runs link to specific Generation run
- Template editing: JSON text editor with preview

## Task Sequence

Execute tasks in numerical order. Each task builds on the previous.

1. [01-database-migration.md](./01-database-migration.md) - Add notebook columns to `prompt_tests` + create `fixture_images` table
2. [02-backend-api-endpoints.md](./02-backend-api-endpoints.md) - Phase-specific POST endpoints + fixture image sync
3. [03-notebook-ui-components.md](./03-notebook-ui-components.md) - Phase components with fixture image grid selector
4. [04-state-management-and-persistence.md](./04-state-management-and-persistence.md) - SessionStorage with data URL conversion
5. [05-run-comparison-and-history.md](./05-run-comparison-and-history.md) - Within-phase run comparison
6. [06-error-handling-and-edge-cases.md](./06-error-handling-and-edge-cases.md) - Simple error display and validation

## Success Criteria

### Core Functionality
- [ ] Can start new notebook session and select fixture images via grid
- [ ] Can run analysis phase multiple times with different variables
- [ ] Can lock analysis run and use it for generation
- [ ] Can run generation phase multiple times with different template edits
- [ ] Can lock generation run and use it for evaluation
- [ ] Can run evaluation phase multiple times with different criteria
- [ ] Thinking output visible for generation runs
- [ ] Token counts displayed for all API calls
- [ ] State persists on page refresh (SessionStorage + DB)

### Image Management
- [ ] `bun bench sync` uploads fixture images to R2
- [ ] Grid gallery displays all fixture images grouped by product
- [ ] Multi-select works for multi-angle products
- [ ] Selecting images from different products creates separate tests

### Phase Control
- [ ] Analysis phase locked until user selects best run
- [ ] Generation phase locked until analysis selected
- [ ] Evaluation phase locked until generation selected
- [ ] Can compare multiple runs within same phase
- [ ] Clear parent-child relationships visible in UI

### Developer Features
- [ ] Raw prompts displayed in expandable view
- [ ] API response JSON viewable for debugging
- [ ] Token usage breakdown (input/output) shown
- [ ] Template editing via JSON text editor with preview

### Compatibility
- [ ] Existing batch pipeline unaffected
- [ ] Fixture image sync doesn't break existing `bun bench sync`
- [ ] Database migration backwards compatible

## Execution Instructions

### 1. Prerequisites
- Supabase database access configured
- R2 bucket configured for image storage
- Bun installed for development server
- Existing prompt bench CLI working

### 2. Implementation Order

Execute tasks sequentially (01 → 06). Build and dogfood - you'll discover bugs naturally during use.

```bash
# Task 01: Database Migration
npx supabase migration new add_notebook_support
# Edit migration file as specified in 01-database-migration.md
npx supabase db push

# Task 02: Backend + Fixture Sync
# Implement phase endpoints + extend sync command
# Test: bun bench sync (uploads fixtures)
# Test: curl endpoints

# Task 03: UI Components
# Build phase components with fixture grid
# Test: Select images, run phases

# Task 04: State Management
# Add SessionStorage with data URLs
# Test: Refresh page, state restored

# Task 05: Run Comparison
# Add comparison view within phases
# Test: Compare 2-3 analysis runs

# Task 06: Error Handling
# Add validation and error display
# Test: Invalid inputs, API failures
```

### 3. Testing Strategy

Dogfood the tool - build it and use it for actual prompt engineering work. Fix bugs as encountered.

## Dependencies

### External
- **Supabase**: Database for `prompt_tests`, `prompt_evaluations`, `fixture_images`
- **R2 (Cloudflare)**: Image storage (fixture images and generated outputs)
- **Gemini API**: Product analysis and image generation
- **Bun**: Runtime for server and CLI

### Internal (Code Reuse)
- **prompt-bench/core/product-analyzer.ts**: `analyzeProductImages`
- **prompt-bench/core/compiler.ts**: `compileTemplate`
- **prompt-bench/core/evaluator.ts**: `evaluateBatch`
- **src/lib/r2**: Image upload utilities
- **src/lib/supabase/admin**: Admin client for DB operations
- **src/lib/ai/providers/gemini.ts**: Gemini provider

### New Code
- **prompt-bench/core/notebook-orchestrator.ts**: Wrapper functions for phase execution
- **prompt-bench/commands/sync.ts**: Extended to handle fixture images
- **prompt-bench/ui/components/notebook/**: React components for phases

## File Modifications Summary

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/YYYYMMDD_add_notebook_support.sql` | New | Schema changes |
| `prompt-bench/core/notebook-orchestrator.ts` | New | Phase wrappers |
| `prompt-bench/commands/sync.ts` | Modified | Fixture upload |
| `prompt-bench/ui/server.ts` | Modified | API endpoints |
| `prompt-bench/ui/components/notebook/*` | New | React components |

## Architectural Decisions

### Why Phase-Based (Not Pipeline-Based)?

**User requirement**: "Test every stage in the process and make changes to see what happens"

**Phase-based approach**:
- Run analysis 5 times with variable tweaks → compare → lock best
- Run generation 3 times with template tweaks → compare → lock best
- Run evaluation with different criteria

**Benefits**:
- Granular control at each stage
- No wasted API calls re-running unchanged phases
- Easy comparison within phase (all using same inputs)
- Natural workflow for iterative optimization

### Why Simple POST (Not SSE)?

**For dev tool**: Synchronous POST requests with loading spinners are sufficient. Operations complete in 10-30 seconds. No need for streaming complexity.

**Benefits**:
- Simple to implement and debug
- Easy to inspect in browser DevTools
- No reconnection logic needed
- Can pause between phases to inspect results

### Why Fixture Images?

**User workflow**: Same test images used repeatedly across experiments.

**Benefits**:
- Images version controlled in git
- No upload delay in UI (already in R2)
- SessionStorage only stores IDs (not base64 blobs)
- Grid selector with visual recognition

### Why SessionStorage (Not LocalStorage)?

**For dev tool**: Auto-cleanup on tab close prevents stale data buildup.

**Benefits**:
- Persists during active session (refreshes work)
- Clears automatically when done
- Data URLs preserve images across refreshes
- Simpler than localStorage quota management

## Database Schema

### Phase Relationships

```
Analysis Run 1 ────┐
Analysis Run 2     │
Analysis Run 3 ────┼─→ (user selects Run 2)
Analysis Run 4     │
Analysis Run 5 ────┘

                   ↓ parent_run_id

Generation Run 1 ──┐ (all use Analysis Run 2)
Generation Run 2   ├─→ (user selects Run 1)
Generation Run 3 ──┘

                   ↓ parent_run_id

Evaluation Run 1 ──┐ (all use Generation Run 1)
Evaluation Run 2 ──┘
```

### Query Examples

```sql
-- Get all analysis runs for session
SELECT * FROM prompt_tests
WHERE session_id = 'coffee-maker-notebook-20251217-abc123'
  AND phase = 'analysis'
ORDER BY phase_run_number ASC;

-- Get all generation runs using specific analysis
SELECT * FROM prompt_tests
WHERE session_id = ?
  AND phase = 'generation'
  AND parent_run_id = 'analysis-run-2-uuid'
ORDER BY phase_run_number ASC;

-- Get thinking output and tokens for generation run
SELECT
  debug_metadata->>'thinking' as thinking,
  debug_metadata->>'tokens' as tokens,
  debug_metadata->>'raw_prompt' as prompt
FROM prompt_tests
WHERE id = ?;
```

## Quick Reference

**Start new session**: Navigate to `/notebook`

**Resume session**: `/notebook?session={sessionId}`

**Key files**:
- Schema: `supabase/migrations/`
- Backend: `prompt-bench/ui/server.ts`
- Orchestrator: `prompt-bench/core/notebook-orchestrator.ts`
- UI: `prompt-bench/ui/components/notebook/`

**Fixture sync**: `bun bench sync` (uploads `fixtures/images/*`)

**SessionStorage keys**:
- `notebook-session-{sessionId}`: Complete session state
- `notebook-active-session`: Currently active session ID
