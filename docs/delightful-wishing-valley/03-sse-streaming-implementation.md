# SSE Streaming Implementation

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - implement handleRun)

## Implementation Details

Implement POST /api/run with Server-Sent Events streaming for real-time progress updates.

### SSE Handler

```typescript
import { testCommand } from '@bench/commands/test';
import type { ProgressCallback } from '@bench/core/orchestrator';

const handleRun = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { template, batchFile, label } = body;

    // Validate required fields
    if (!template || !batchFile) {
      return Response.json(
        { error: 'Missing required fields: template, batchFile' },
        { status: 400 }
      );
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        // Progress callback that writes to SSE stream
        const onProgress: ProgressCallback = (
          phase: string,
          current: number,
          total: number,
          message: string
        ) => {
          const data = JSON.stringify({
            phase,
            current,
            total,
            message,
            timestamp: Date.now(),
          });
          controller.enqueue(`data: ${data}\n\n`);
        };

        try {
          // Build CLI args
          const args = [
            '--template', template,
            '--batch', batchFile,
          ];

          if (label) {
            args.push('--label', label);
          }

          // Execute test command with progress callback
          await testCommand(args, onProgress);

          // Send completion event
          controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(`data: ${JSON.stringify({ error: message })}\n\n`);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to start run: ${message}` }, { status: 500 });
  }
};
```

### testCommand Integration

The `testCommand` from `@bench/commands/test` already accepts an optional `onProgress` callback:

```typescript
// From @bench/commands/test.ts (reference, no changes needed)
export const testCommand = async (
  args: string[],
  onProgress?: ProgressCallback
): Promise<void> => {
  // ... existing implementation
  await runPipeline(options, onProgress);
};
```

The progress callback receives events from the orchestrator:
- **Phase**: 'sync' | 'run' | 'evaluate' | 'report'
- **Current**: Current progress number
- **Total**: Total items to process
- **Message**: Human-readable status message

## Acceptance Criteria

- [ ] POST /api/run with valid body starts SSE stream
- [ ] Progress events emit in SSE format: `data: {...}\n\n`
- [ ] Events include phase, current, total, message, timestamp
- [ ] Completion event emits: `{ done: true }`
- [ ] Error events emit: `{ error: "message" }`
- [ ] Stream closes after completion or error
- [ ] Missing template/batchFile returns 400 error
- [ ] Invalid JSON body returns proper error

## Dependencies

- Task 01 (Server Setup)
- Task 02 (API Layer) - uses same imports

## Testing

Test SSE stream with curl:

```bash
# Start a test run (will stream progress)
curl -X POST http://localhost:3001/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "template": "ecommerce-base",
    "batchFile": "prompt-bench/fixtures/stage1-batch.json",
    "label": "test-run"
  }'

# Should output streaming events:
# data: {"phase":"sync","current":0,"total":1,"message":"Checking template...","timestamp":...}
# data: {"phase":"run","current":1,"total":12,"message":"Processing test 1/12...","timestamp":...}
# ...
# data: {"done":true}
```

Test with browser console:

```javascript
const response = await fetch('/api/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'ecommerce-base',
    batchFile: 'prompt-bench/fixtures/stage1-batch.json'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```
