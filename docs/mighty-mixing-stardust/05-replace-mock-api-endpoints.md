# Replace Mock API Endpoints

## Files to Modify
- `prompt-bench/ui/server.ts` (lines 1827-1916)

## Implementation Details

Replace the TODO-marked mock implementations in the notebook API endpoints with real orchestrator function calls.

### Steps

**1. Add imports at top of server.ts**

After line 7, add:

```typescript
import { runAnalysisPhase, runGenerationPhase } from '../core/notebook-orchestrator';
import { isOk } from '../core/errors';
```

**2. Replace handleNotebookAnalyze**

Replace lines 1827-1856 with:

```typescript
const handleNotebookAnalyze = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, fixtureImageIds, variables, model, cacheEnabled } = body;

    if (!sessionId || !fixtureImageIds || fixtureImageIds.length === 0) {
      return Response.json({ error: 'Missing required fields: sessionId, fixtureImageIds' }, { status: 400 });
    }

    // Call real orchestrator function
    const result = await runAnalysisPhase({
      sessionId,
      fixtureImageIds,
      variables: variables || {},
      model: model || 'gemini-2.0-flash',
      cacheEnabled: cacheEnabled ?? true
    });

    if (!isOk(result)) {
      logger.error('Notebook analysis failed', {
        sessionId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    logger.info('Notebook analysis succeeded', {
      sessionId,
      runId: result.data.runId
    });

    return Response.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook analyze endpoint error', { error: message });
    return Response.json({ error: 'Analysis failed: ' + message }, { status: 500 });
  }
};
```

**3. Replace handleNotebookGenerate**

Replace lines 1858-1890 with:

```typescript
const handleNotebookGenerate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, parentRunId, templateSlug, templateData, variables } = body;

    if (!sessionId || !parentRunId || !templateSlug) {
      return Response.json({ error: 'Missing required fields: sessionId, parentRunId, templateSlug' }, { status: 400 });
    }

    // Call real orchestrator function
    const result = await runGenerationPhase({
      sessionId,
      parentRunId,
      templateSlug,
      templateData: templateData || {},
      variables: variables || {}
    });

    if (!isOk(result)) {
      logger.error('Notebook generation failed', {
        sessionId,
        parentRunId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    logger.info('Notebook generation succeeded', {
      sessionId,
      runId: result.data.runId,
      imageUrl: result.data.imageUrl
    });

    return Response.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook generate endpoint error', { error: message });
    return Response.json({ error: 'Generation failed: ' + message }, { status: 500 });
  }
};
```

**4. Replace handleNotebookSession**

Replace lines 1892-1916 with:

```typescript
const handleNotebookSession = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch all runs for this session
    const { data: runs, error } = await supabase
      .from('prompt_tests')
      .select(`
        *,
        prompt_evaluations(*)
      `)
      .eq('session_id', sessionId)
      .order('phase', { ascending: true })
      .order('phase_run_number', { ascending: true });

    if (error) {
      logger.error('Failed to load notebook session', {
        sessionId,
        error: error.message
      });
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by phase
    const phases = {
      analysis: runs?.filter(r => r.phase === 'analysis') || [],
      generation: runs?.filter(r => r.phase === 'generation') || [],
      evaluation: runs?.filter(r => r.phase === 'evaluation') || []
    };

    logger.info('Loaded notebook session', {
      sessionId,
      analysisRuns: phases.analysis.length,
      generationRuns: phases.generation.length,
      evaluationRuns: phases.evaluation.length
    });

    return Response.json({ sessionId, phases });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook session endpoint error', { error: message });
    return Response.json({ error: 'Failed to load session: ' + message }, { status: 500 });
  }
};
```

**5. Test full workflow**

Start the UI server:
```bash
bun prompt-bench/ui/server.ts
```

Open browser to `http://localhost:8181/notebook`

Test workflow:
1. Select fixture images → Creates session
2. Click "Run Analysis" → Should call real API
3. Select analysis run → Unlocks generation
4. Select template and click "Run Generation" → Should generate real image
5. Refresh page → Session should restore from database

Expected: All phases work with real data (no placeholder images)

**6. Commit**

```bash
git add prompt-bench/ui/server.ts
git commit -m "feat: connect notebook UI to real backend orchestrator

- Replace mock analyze endpoint with runAnalysisPhase
- Replace mock generate endpoint with runGenerationPhase
- Replace mock session endpoint with database query
- Add error logging for all notebook endpoints
- Remove all TODO comments from notebook handlers"
```

## Acceptance Criteria

- [ ] Imports added to server.ts
- [ ] handleNotebookAnalyze calls runAnalysisPhase
- [ ] handleNotebookGenerate calls runGenerationPhase
- [ ] handleNotebookSession queries database
- [ ] All TODO comments removed
- [ ] Error handling implemented for all endpoints
- [ ] Logging added for success and failure cases
- [ ] Manual UI testing passes (fixture → analysis → generation)
- [ ] Page refresh restores session from database
- [ ] Changes committed to git

## Dependencies

- Task 03 (analysis orchestrator)
- Task 04 (generation orchestrator)
