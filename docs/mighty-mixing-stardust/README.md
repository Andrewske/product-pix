# Notebook UI Backend Implementation

## Overview

Complete the notebook UI backend by implementing database schema, fixture image sync, orchestrator functions, and real API endpoints. This transforms the existing WIP UI scaffolding (with mock endpoints) into a fully functional notebook interface for iterative prompt engineering.

**What is being built:** Phase-based workflow (Analysis → Generation → Evaluation) where users can run multiple experiments at each phase, compare results, and select the best run to proceed to the next phase. All runs are stored in the database with parent-child relationships and full debug metadata (thinking output, tokens, raw prompts).

**Why:** Enables granular control over the prompt engineering process without wasting API calls on unchanged phases. Users can iterate on analysis prompts, template variations, and evaluation criteria independently.

## Task Sequence

1. [01-database-migration.md](./01-database-migration.md) - Add notebook columns to prompt_tests and create fixture_images table
2. [02-fixture-image-sync.md](./02-fixture-image-sync.md) - Extend bun bench sync to upload fixture images to R2/DB
3. [03-notebook-orchestrator-analysis.md](./03-notebook-orchestrator-analysis.md) - Implement runAnalysisPhase wrapper function
4. [04-notebook-orchestrator-generation.md](./04-notebook-orchestrator-generation.md) - Implement runGenerationPhase wrapper function
5. [05-replace-mock-api-endpoints.md](./05-replace-mock-api-endpoints.md) - Connect UI to real orchestrator (remove TODOs)
6. [06-integration-testing-and-docs.md](./06-integration-testing-and-docs.md) - E2E test + documentation update

## Success Criteria

### Database
- Migration applied successfully
- `fixture_images` table populated with test images
- `prompt_tests` has notebook columns (session_id, phase, phase_run_number, parent_run_id, debug_metadata)
- Proper indexes created for efficient queries

### Fixture Sync
- `bun bench sync` uploads images from `prompt-bench/fixtures/images/` to R2
- Database records created in `fixture_images` table
- Duplicate uploads skipped correctly (checks filepath)
- Product name extracted from folder structure

### Orchestrator
- `runAnalysisPhase` fetches fixtures, downloads from R2, calls `analyzeProductImages`, stores results
- `runGenerationPhase` fetches parent analysis, merges variables, compiles template, generates image
- Parent-child relationships correctly set (generation links to analysis via parent_run_id)
- Debug metadata captured (thinking, tokens, raw prompts) in JSONB column

### API Endpoints
- No more mock data or TODO comments in server.ts
- Real database queries replacing mock implementations
- Proper error handling with HTTP status codes
- Logging integrated for all notebook operations

### UI Integration
- Fixture selector loads images from database
- Analysis phase runs and displays real product analysis
- Generation phase creates actual images (not placeholders)
- Session persistence works (URL param + database)
- Page refresh restores all runs from database

### Testing
- Integration test passes (fixtures → analysis → generation flow)
- Manual UI testing confirms all features work
- Database relationships verified (parent_run_id linkage)

## Execution Instructions

1. Execute tasks in numerical order (01 → 06)
2. Each task file contains:
   - Files to modify/create
   - Step-by-step implementation details with complete code
   - Acceptance criteria checklist
   - Dependencies on previous tasks
3. Verify acceptance criteria before moving to next task
4. Commit after each task completion

**Important:** Tasks 01-02 are foundational (database + sync). Tasks 03-04 implement core logic (orchestrator). Task 05 connects everything (API endpoints). Task 06 validates (testing + docs).

## Dependencies

### External
- **Supabase** - PostgreSQL database for prompt_tests, prompt_evaluations, fixture_images
- **R2 (Cloudflare)** - Image storage for fixture images and generated outputs
- **Gemini API** - Product analysis and image generation
- **Bun** - Runtime for server and CLI commands

### Internal (Existing Code)
- `prompt-bench/core/product-analyzer.ts` - `analyzeProductImages` function
- `prompt-bench/core/compiler.ts` - `compileTemplate` function
- `src/lib/r2` - Image upload/download utilities (`uploadBuffer`, `getPublicUrl`)
- `src/lib/supabase/admin` - Admin client for database operations
- `src/lib/ai/providers/gemini.ts` - Gemini provider factory
- `src/lib/ai/generate-image.ts` - `generateFromImage` function

### Prerequisites
- Database migration from Task 01 must be applied before other tasks
- Fixture sync (Task 02) needed for testing later tasks
- Analysis orchestrator (Task 03) must exist before generation orchestrator (Task 04)
- Both orchestrators must exist before API endpoint replacement (Task 05)

## Architecture

**Database Schema:**
```
prompt_tests (extended)
├── session_id VARCHAR (groups notebook runs)
├── phase VARCHAR ('analysis'|'generation'|'evaluation')
├── phase_run_number INTEGER (1, 2, 3...)
├── parent_run_id UUID (foreign key to prompt_tests)
└── debug_metadata JSONB (thinking, tokens, raw prompts)

fixture_images (new)
├── id UUID (primary key)
├── product VARCHAR (extracted from folder)
├── filename VARCHAR
├── filepath VARCHAR UNIQUE
├── r2_url TEXT (public URL)
└── r2_key TEXT (storage key)
```

**Data Flow:**
```
UI → POST /api/notebook/analyze
     ↓
runAnalysisPhase()
├─ Fetch fixture_images from DB
├─ Download images from R2
├─ analyzeProductImages()
└─ INSERT INTO prompt_tests (session_id, phase='analysis')
     ↓
UI receives analysis data

UI → POST /api/notebook/generate
     ↓
runGenerationPhase()
├─ SELECT parent analysis run
├─ Merge variables (analysis + manual)
├─ compileTemplate()
├─ generateFromImage()
└─ INSERT INTO prompt_tests (phase='generation', parent_run_id=analysis.id)
     ↓
UI receives image + thinking
```

**Key Patterns:**
- All operations use `Result<T>` type for error handling
- Database queries use Supabase admin client (bypasses RLS)
- Images uploaded to R2 with hash-based deduplication
- JSONB columns store complex data (inputs, debug_metadata)
- Phase run numbers increment automatically per session+phase

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Bun
- **Database:** Supabase (PostgreSQL)
- **Storage:** Cloudflare R2
- **AI:** Google Gemini (via AI SDK + Google Gen AI SDK)
- **UI:** React (inline components in server.ts)
- **Error Handling:** Result<T> type (ok/err pattern)

## Current State

**✅ Already Complete:**
- Planning documentation (docs/composed-riding-wand/)
- Product analyzer integration
- UI scaffolding with React components
- Mock API endpoints (return fake data)

**❌ This Plan Implements:**
- Database schema (fixture_images + notebook columns)
- Fixture image sync to R2 and database
- Notebook orchestrator (real analysis + generation logic)
- Real API endpoints (replace mocks, remove TODOs)
- Integration testing
- Documentation updates

## Rollback Plan

If critical issues occur, rollback database migration:

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_notebook_parent;
DROP INDEX IF EXISTS idx_notebook_sessions;

-- Drop fixture_images table
DROP TABLE IF EXISTS public.fixture_images;

-- Remove columns from prompt_tests
ALTER TABLE prompt_tests
  DROP COLUMN IF EXISTS debug_metadata,
  DROP COLUMN IF EXISTS parent_run_id,
  DROP COLUMN IF EXISTS phase_run_number,
  DROP COLUMN IF EXISTS phase,
  DROP COLUMN IF EXISTS session_id;
```

Then revert code commits:
```bash
git revert HEAD~6..HEAD  # Revert all 6 tasks
```

## Next Steps (Future Enhancements)

These are **NOT** part of this implementation plan:

1. **Evaluation Phase** - Implement `runEvaluationPhase` (links to generation runs)
2. **Run Comparison Modal** - Side-by-side comparison UI within each phase
3. **State Management** - SessionStorage with data URLs for offline persistence
4. **Component Extraction** - Move inline React components to separate files
5. **Error Boundaries** - React error boundaries for graceful UI failures

See `docs/composed-riding-wand/` tasks 03-06 for specifications.
