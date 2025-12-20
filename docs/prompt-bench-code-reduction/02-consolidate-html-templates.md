# Consolidate HTML Templates in UI Server

## Files to Modify/Create
- prompt-bench/ui/server.ts (modify)

## Implementation Details

Two HTML rendering functions (`serveHTML` and `serveNotebookHTML`, lines 69-139) share 95% identical code. They only differ in bundle filename, title, and mount call.

**Current duplicated pattern:**
```typescript
const serveHTML = (): Response => {
  const experimentBundle = loadBundle('experiment.js')
    .replace(/<\/script>/gi, '<\\/script>');
  const builtCSS = loadBuiltCSS();
  const html = `<!DOCTYPE html>...ExperimentApp.mount()...`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};

const serveNotebookHTML = (): Response => {
  const notebookBundle = loadBundle('notebook.js')
    .replace(/<\/script>/gi, '<\\/script>');
  const builtCSS = loadBuiltCSS();
  const html = `<!DOCTYPE html>...NotebookApp.mount()...`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};
```

**Required changes:**

1. Create a parameterized helper function after `loadBuiltCSS` (around line 38):

```typescript
const serveApp = (bundleName: string, title: string, mountCall: string): Response => {
  const bundle = loadBundle(bundleName)
    .replace(/<\/script>/gi, '<\\/script>');
  const builtCSS = loadBuiltCSS();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        ${builtCSS}
      </style>
    </head>
    <body class="dark bg-background text-foreground antialiased">
      <div id="root"></div>
      <script>
        ${bundle}

        // Mount app using bundled React
        ${mountCall}
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
```

2. Replace the two duplicate functions with simple wrappers:

```typescript
const serveHTML = (): Response =>
  serveApp('experiment.js', 'Prompt Bench - Experiment Runner', 'ExperimentApp.mount();');

const serveNotebookHTML = (): Response =>
  serveApp('notebook.js', 'Prompt Bench - Notebook', 'NotebookApp.mount();');
```

## Acceptance Criteria
- [ ] New `serveApp` helper function created
- [ ] `serveHTML` and `serveNotebookHTML` use the helper
- [ ] Both routes work correctly:
  - `http://localhost:8181/` renders experiment UI
  - `http://localhost:8181/notebook` renders notebook UI
- [ ] CSS and JS bundles load correctly in browser
- [ ] No TypeScript errors: `bunx tsc --noEmit`

## Dependencies
None - this is an independent quick win.

## Risk Level
Very Low - simple template consolidation with visual verification.

## Savings
~60 lines removed, single source of truth for HTML template.
