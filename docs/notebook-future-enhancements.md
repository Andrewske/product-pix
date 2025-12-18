# Notebook UI Future Enhancements

**Status:** Planning document for future development
**Current State:** Backend implementation complete (database, orchestrator, API endpoints)
**Related Docs:** `docs/composed-riding-wand/` (original detailed specs), `docs/mighty-mixing-stardust/` (completed implementation)

---

## Overview

This document outlines planned enhancements to the notebook UI that were intentionally deferred from the initial implementation. Each enhancement builds on the existing foundation (analysis + generation phases) to improve user experience, debugging capabilities, and workflow efficiency.

**Current Capabilities:**
- ✅ Database schema with notebook columns and fixture_images table
- ✅ Fixture image sync to R2 and database
- ✅ Analysis phase (product analysis with multiple runs)
- ✅ Generation phase (image generation linked to analysis)
- ✅ Session persistence via URL parameters
- ✅ Parent-child run relationships in database
- ✅ Debug metadata capture (thinking, tokens, raw prompts)

**What's Missing:**
- Evaluation phase for scoring generations
- Visual comparison tools for within-phase runs
- Offline state persistence (SessionStorage)
- Component architecture improvements
- Advanced error handling UI

---

## Enhancement 1: Evaluation Phase

### What It Is
Complete the three-phase workflow by implementing evaluation capabilities. Users can score generated images using multiple criteria (adherence to prompt, visual quality, brand consistency) and iterate on evaluation prompts just like analysis and generation.

### Why It Matters
**Current Pain Point:** Users must manually assess generation quality by eyeballing images. No systematic way to compare generations across different template variations or track which generation best meets requirements.

**Value Proposition:**
- Quantitative comparison of generations (scored 0-100)
- Iterate on evaluation criteria without re-generating
- Track which combinations (analysis → template → evaluation) produce best results
- Build historical quality baselines

### Technical Details

**Database:**
- Uses existing `prompt_evaluations` table
- Links evaluations to generation runs via `parent_run_id`
- Stores multiple evaluation runs per generation (test different scoring criteria)

**Orchestrator Function:**
```typescript
interface EvaluationRequest {
  sessionId: string;
  parentRunId: string; // Generation run ID
  evaluationCriteria: string; // Custom prompt for scoring
  model?: string;
}

interface EvaluationResult {
  runId: string;
  phaseRunNumber: number;
  scores: {
    overall: number;
    adherence: number;
    quality: number;
    brand: number;
  };
  reasoning: string;
}
```

**Implementation Approach:**
- Create `runEvaluationPhase()` in `notebook-orchestrator.ts`
- Fetch parent generation run and its image URL
- Call evaluation API with image + custom criteria
- Store results in `prompt_evaluations` table
- Link to generation via foreign key

**UI Components:**
- Evaluation criteria editor (textarea for custom prompt)
- Evaluation runs list with score breakdowns
- Score comparison chart (multiple evaluations side-by-side)
- Best run indicator based on overall score

### Dependencies
- Requires generation phase to be complete
- Needs evaluation API endpoint (may require new Gemini API integration)
- `prompt_evaluations` table already exists (just needs integration)

### Reference Documentation
See `docs/composed-riding-wand/02-backend-api-endpoints.md` for original evaluation phase spec.

---

## Enhancement 2: SessionStorage Persistence

### What It Is
Offline-first state management that preserves notebook session data in browser SessionStorage, including data URLs for images. This allows users to work without network interruption and provides instant session restoration on page refresh.

### Why It Matters
**Current Pain Point:** Page refresh triggers database query for session data. If network is slow or database is down, user loses context. Generated images require R2 availability to view.

**Value Proposition:**
- Instant page refresh (no loading spinner)
- Work offline after initial load
- Reduced database/R2 load
- Better developer experience (faster iteration)
- Auto-cleanup on tab close (SessionStorage clears automatically)

### Technical Details

**Storage Strategy:**
```typescript
interface NotebookSessionState {
  sessionId: string;
  selectedFixtureIds: string[];
  analysisRuns: AnalysisRunWithDataURL[];
  selectedAnalysisId: string | null;
  generationRuns: GenerationRunWithDataURL[];
  selectedGenerationId: string | null;
  evaluationRuns: EvaluationRun[];
}

interface GenerationRunWithDataURL {
  ...GenerationRun;
  imageDataURL: string; // Base64 data URL for offline viewing
}
```

**Storage Keys:**
- `notebook-session-${sessionId}`: Complete session state
- `notebook-active-session`: Currently active session ID

**Sync Strategy:**
1. On run completion: Store in SessionStorage immediately
2. On page load: Check SessionStorage first, fallback to database
3. On image load: Convert to data URL, cache in SessionStorage
4. On tab close: SessionStorage auto-clears (no manual cleanup needed)

**Size Management:**
- SessionStorage limit: ~5-10MB per origin
- One 1024x1024 image as data URL: ~1-2MB
- Limit cached images to 3-5 most recent per session
- Fall back to R2 URLs for older images

### Implementation Approach
- Create `useNotebookSession()` React hook
- Implement data URL conversion utilities
- Add sync middleware (writes to both state and SessionStorage)
- Graceful degradation if quota exceeded

### Dependencies
- No backend changes required
- Pure client-side enhancement
- Works with existing API endpoints

### Reference Documentation
See `docs/composed-riding-wand/04-state-management-and-persistence.md` for detailed implementation.

---

## Enhancement 3: Component Extraction and Refactoring

### What It Is
Extract the 1915-line `server.ts` file's inline React components into separate, properly-typed modules. Move from template literal string containing React code to actual `.tsx` files with TypeScript checking and IDE support.

### Why It Matters
**Current Pain Point:** All React code lives in a template literal string within `server.ts`. This means:
- No TypeScript type checking for React components
- No syntax highlighting or autocomplete
- No ESLint/Prettier formatting
- Difficult to test components
- Hard to collaborate (merge conflicts in massive file)

**Value Proposition:**
- Type-safe component development
- Better IDE support (autocomplete, refactoring)
- Testable components (can import and test individually)
- Easier collaboration (smaller files)
- Proper separation of concerns (UI vs server logic)

### Technical Details

**Current Structure:**
```
prompt-bench/ui/
├── server.ts (1915 lines)
│   ├── Bun.serve fetch handler
│   ├── API route handlers
│   └── serveHTML() with 757 lines of React in template literal
```

**Proposed Structure:**
```
prompt-bench/ui/
├── server.ts (200 lines - just server + routes)
├── components/
│   ├── notebook/
│   │   ├── NotebookView.tsx
│   │   ├── SessionHeader.tsx
│   │   ├── FixtureImageSelector.tsx
│   │   ├── AnalysisPhase.tsx
│   │   ├── GenerationPhase.tsx
│   │   └── EvaluationPhase.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Select.tsx
│       ├── Input.tsx
│       └── Card.tsx
├── hooks/
│   └── useNotebookSession.ts
└── build.ts (bundles components for inline serving)
```

**Build Strategy:**
Since this is a single-file server, we need to bundle components back into `server.ts` for deployment:

```typescript
// build.ts
import { build } from 'bun';

const result = await build({
  entrypoints: ['./components/notebook/NotebookView.tsx'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  minify: true
});

// Inject bundled code into server.ts template
```

**Alternative Approach:**
Keep inline serving but use proper TypeScript files during development:

```typescript
// server.ts
import { renderToString } from 'react-dom/server';
import { NotebookView } from './components/notebook/NotebookView';

const serveNotebookHTML = () => {
  const html = `
    <!DOCTYPE html>
    ...
    <script type="module">
      ${Bun.file('./dist/notebook-bundle.js').text()}
    </script>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};
```

### Implementation Approach
1. Extract primitives first (Button, Select, Input)
2. Extract phase components (Analysis, Generation, Evaluation)
3. Create build script to bundle for production
4. Update development workflow (watch mode for rebuilds)
5. Add tests for extracted components

### Dependencies
- Bun build API (already available)
- No backend logic changes
- Could be done incrementally (extract one component at a time)

### Benefits Beyond Code Quality
- **Testing:** Can unit test components with Bun test
- **Reusability:** Shared components between batch UI and notebook UI
- **Performance:** Minified bundles smaller than raw template strings
- **Documentation:** JSDoc comments work properly in `.tsx` files

---



## Related Documentation

- **Original Planning:** `docs/composed-riding-wand/` (Tasks 03-06 cover future enhancements)
- **Completed Implementation:** `docs/mighty-mixing-stardust/` (Backend implementation reference)
- **Current Codebase:**
  - Database: `supabase/migrations/*_add_notebook_support.sql`
  - Orchestrator: `prompt-bench/core/notebook-orchestrator.ts`
  - API: `prompt-bench/ui/server.ts` (handlers at lines 1797-1935)
  - UI: `prompt-bench/ui/server.ts` (components at lines 777-1534)