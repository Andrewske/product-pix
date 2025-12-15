# Server Setup and Basic Routing

## Files to Create
- `prompt-bench/ui/server.ts` (new)
- `prompt-bench/ui/types.ts` (new)

## Implementation Details

Create the foundational Bun server with basic routing and HTML serving.

### Server Structure (`server.ts`)

**Imports and Setup:**
```typescript
#!/usr/bin/env bun
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });
```

**Basic Routing:**
```typescript
Bun.serve({
  port: 3001,
  fetch(req: Request) {
    const url = new URL(req.url);

    // Route handlers
    if (url.pathname === '/') return serveHTML();
    if (url.pathname === '/results') return serveHTML(); // Same HTML, client-side routing
    if (url.pathname === '/api/batches') return handleBatches(req);
    if (url.pathname === '/api/templates') return handleTemplates(req);
    if (url.pathname === '/api/results') return handleResults(req);
    if (url.pathname === '/api/run' && req.method === 'POST') return handleRun(req);

    return new Response('Not Found', { status: 404 });
  }
});

console.log('🚀 Prompt Bench UI running at http://localhost:3001');
```

**HTML Serving:**
```typescript
const serveHTML = (): Response => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Bench UI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
</head>
<body class="bg-gray-50">
  <div id="root"></div>
  <script type="module">
    const { useState, useEffect } = React;
    const { createRoot } = ReactDOM;

    // Minimal test component
    const App = () => {
      return React.createElement('div', { className: 'p-8' },
        React.createElement('h1', { className: 'text-2xl font-bold text-green-600' },
          'Prompt Bench UI - Server Running'
        )
      );
    };

    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
};
```

**Stub API Handlers (to be implemented later):**
```typescript
const handleBatches = async (req: Request): Promise<Response> => {
  return Response.json({ batches: [] });
};

const handleTemplates = async (req: Request): Promise<Response> => {
  return Response.json({ templates: [] });
};

const handleResults = async (req: Request): Promise<Response> => {
  return Response.json({ results: [] });
};

const handleRun = async (req: Request): Promise<Response> => {
  return Response.json({ error: 'Not implemented yet' }, { status: 501 });
};
```

### Types File (`types.ts`)

```typescript
// Shared types for UI
export interface BatchFileMetadata {
  filename: string;
  label: string;
  description?: string;
  testCount: number;
}

export interface TemplateMetadata {
  slug: string;
  version: number;
  name?: string;
  type: 'single' | 'collection';
}

export interface ProgressEvent {
  phase: 'sync' | 'run' | 'evaluate' | 'report';
  current: number;
  total: number;
  message: string;
  timestamp: number;
}

export interface RunCompletionEvent {
  done: true;
}

export interface RunErrorEvent {
  error: string;
}

export type SSEEvent = ProgressEvent | RunCompletionEvent | RunErrorEvent;
```

## Acceptance Criteria

- [ ] Server starts on port 3001 without errors
- [ ] Visiting http://localhost:3001 shows "Prompt Bench UI - Server Running"
- [ ] React and Tailwind CDN loads successfully
- [ ] GET /api/batches returns empty array
- [ ] GET /api/templates returns empty array
- [ ] GET /api/results returns empty array
- [ ] POST /api/run returns 501 Not Implemented
- [ ] types.ts exports all necessary interfaces

## Dependencies

None - foundational task.

## Testing

```bash
# Start server
bun run prompt-bench/ui/server.ts

# Test in browser
open http://localhost:3001

# Test API endpoints with curl
curl http://localhost:3001/api/batches
curl http://localhost:3001/api/templates
curl http://localhost:3001/api/results
curl -X POST http://localhost:3001/api/run
```
