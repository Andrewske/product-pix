# Backend: API Endpoint for Conversation Generation

## Files to Modify/Create
- `prompt-bench/ui/server.ts` (modify)

## Implementation Details

Add new API endpoint `/api/notebook/conversation-generate` that handles conversation-based generation requests from the notebook UI.

### Route Handler Registration

Add route in the main `fetch()` function:
```typescript
if (url.pathname === '/api/notebook/conversation-generate' && req.method === 'POST')
  return handleNotebookConversationGenerate(req);
```

### Handler Implementation

```typescript
const handleNotebookConversationGenerate = async (req: Request): Promise<Response> => {
  const body = await req.json();
  const { sessionId, parentRunId, templateSlug, templateData, variables, model, config, outputCount } = body;

  // Validate required fields
  if (!sessionId || !parentRunId || !templateSlug || !outputCount) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate outputCount range
  if (outputCount < 1 || outputCount > 7) {
    return Response.json({ error: 'outputCount must be between 1 and 7' }, { status: 400 });
  }

  // Call orchestrator
  const result = await runConversationGenerationPhase({
    sessionId,
    parentRunId,
    templateSlug,
    templateData: templateData || {},
    variables: variables || {},
    model,
    config,
    outputCount
  });

  if (!isOk(result)) {
    logger.error('Conversation generation failed', { error: result.error.message });
    return Response.json({ error: result.error.message }, { status: 500 });
  }

  return Response.json(result.data);
};
```

### Request Body Schema
```typescript
{
  sessionId: string;
  parentRunId: string;
  templateSlug: string;
  templateData: Record<string, unknown>;
  variables?: Record<string, unknown>;
  model?: string;  // Optional, defaults to backend configuration (typically gemini-3-pro-image-preview)
  config?: {
    aspectRatio: string;
    resolution: '1k' | '2k' | '4k';
  };
  outputCount: number;  // Must be 1-7
}
```

### Response Schema
```typescript
{
  generationRuns: Array<{
    runId: string;
    phaseRunNumber: number;
    angleIndex: number;
    targetAngle: string;
    imageUrl: string;
    finalPrompt: string;
    tokens: { input: number; output: number };
  }>;
  totalTokens: { input: number; output: number };
  totalCost: number;
}
```

## Acceptance Criteria

- [ ] Route handler registered in `server.ts`
- [ ] Handler validates all required fields
- [ ] Handler returns 400 for missing fields
- [ ] Handler calls `runConversationGenerationPhase()` correctly
- [ ] Handler returns 500 with error message on failure
- [ ] Handler returns 200 with result data on success
- [ ] Logger records errors appropriately

## Dependencies

- **Task 01** - Requires `runConversationGenerationPhase()` function to exist
