# Entry Point and Build System

## Files to Create
- `prompt-bench/ui/review.tsx` (new)

## Files to Modify
- `prompt-bench/ui/build.ts` (modify)
- `prompt-bench/ui/server.ts` (modify - add HTML route)

## Implementation Details

### 1. Entry Point (`review.tsx`)

Create React entry point following existing patterns from `notebook.tsx` and `experiment.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import { ReviewView } from './components/review';

export function mount(): void {
  const container = document.getElementById('root');
  if (container) createRoot(container).render(<ReviewView />);
}
```

### 2. Build System (`build.ts`)

Add new build function for the review bundle:

```typescript
async function buildReviewBundle(production = false): Promise<void> {
  const entrypoint = join(UI_DIR, 'review.tsx');

  const result = await build({
    entrypoints: [entrypoint],
    outdir: DIST_DIR,
    target: 'browser',
    format: 'iife',
    globalName: 'ReviewApp',
    minify: production,
    sourcemap: production ? 'none' : 'inline',
    define: {
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    },
  });

  // ... error handling matching existing pattern
}
```

Update `buildAll()` to include the review bundle:

```typescript
async function buildAll(production = false): Promise<void> {
  ensureDistDir();
  await Promise.all([
    buildCSS(production),
    buildExperimentBundle(production),
    buildNotebookBundle(production),
    buildReviewBundle(production),  // Add this
  ]);
}
```

### 3. HTML Route (`server.ts`)

Add the HTML serving route for `/review`:

```typescript
// Add helper function (or modify existing serveApp pattern)
const serveReviewHTML = (): Response =>
  serveApp('review.js', 'Prompt Bench - Human Review', 'ReviewApp.mount();');

// Add route (near other page routes like /notebook)
if (url.pathname === '/review') return serveReviewHTML();
```

The `serveApp` function should generate HTML that:
- Loads the CSS from `/styles.css`
- Loads the JS bundle from `/review.js`
- Calls `ReviewApp.mount()` on load
- Has a `<div id="app">` container

## Acceptance Criteria
- [ ] `bun prompt-bench/ui/build.ts` successfully builds review.js
- [ ] review.js is output to prompt-bench/ui/dist/
- [ ] Server serves HTML at /review route
- [ ] HTML loads review.js and calls ReviewApp.mount()
- [ ] Page renders ReviewView component

## Verification Steps

1. Build the bundles:
   ```bash
   bun prompt-bench/ui/build.ts all
   ```

2. Verify review.js exists:
   ```bash
   ls -la prompt-bench/ui/dist/review.js
   ```

3. Start the server:
   ```bash
   bun run prompt-bench/ui/server.ts
   ```

4. Navigate to `http://localhost:8181/review`

5. Verify the page loads without JavaScript errors

## Dependencies
- Task 01: Types and Interfaces
- Task 02: API Endpoints
- Task 03: UI Components (ReviewView must exist)
