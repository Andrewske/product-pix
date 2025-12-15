# Polish and Final Testing

## Files to Modify
- `prompt-bench/ui/server.ts` (minor tweaks)
- `prompt-bench/ui/README.md` (new - usage instructions)

## Implementation Details

### 1. Loading States

Add loading indicators throughout:

```javascript
// In ExperimentRunner
const [loadingBatches, setLoadingBatches] = useState(true);
const [loadingTemplates, setLoadingTemplates] = useState(true);

// Update fetch functions to set loading states
const fetchBatches = async () => {
  setLoadingBatches(true);
  try {
    const res = await fetch('/api/batches');
    const data = await res.json();
    setBatches(data.batches || []);
  } finally {
    setLoadingBatches(false);
  }
};

// Add loading text to selects when data is loading
React.createElement(Select, {
  label: 'Batch File',
  value: batchFile,
  onChange: setBatchFile,
  options: loadingBatches
    ? [{ value: '', label: 'Loading batches...' }]
    : [{ value: '', label: '-- Select batch file --' }, ...]
})
```

### 2. Cost Counter During Run

Track and display running cost:

```javascript
// In ExperimentRunner progress section
const [totalCost, setTotalCost] = useState(0);

// Update in SSE handler when receiving progress events
// (Note: Would need backend to emit cost in progress events)

React.createElement('div', { className: 'text-sm text-gray-600 mt-2' },
  `Estimated cost: $${totalCost.toFixed(4)}`
)
```

### 3. Cancel Button

Add ability to cancel running experiments:

```javascript
// In ExperimentRunner
const [reader, setReader] = useState(null);

const handleCancel = () => {
  if (reader) {
    reader.cancel();
    setIsRunning(false);
    setProgress(null);
    setError('Run cancelled by user');
  }
};

// In progress section
React.createElement(Button, {
  variant: 'danger',
  onClick: handleCancel
}, 'Cancel Run')
```

### 4. Empty State Messages

Improve empty state UX:

```javascript
// In ResultsBrowser when no results
React.createElement('div', { className: 'text-center py-12' },
  React.createElement('p', { className: 'text-gray-500 text-lg mb-4' },
    '📊 No experiment results yet'
  ),
  React.createElement('p', { className: 'text-gray-400 mb-6' },
    'Run your first experiment to see results here'
  ),
  React.createElement(Button, {
    onClick: () => {
      window.history.pushState({}, '', '/');
      setView('runner');
    }
  }, 'Go to Experiment Runner')
)
```

### 5. Error Boundaries

Add graceful error handling:

```javascript
// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'p-8' },
        React.createElement(Card, { title: 'Something went wrong' },
          React.createElement('p', { className: 'text-red-600 mb-4' },
            this.state.error.message
          ),
          React.createElement(Button, {
            onClick: () => window.location.reload()
          }, 'Reload Page')
        )
      );
    }
    return this.props.children;
  }
}

// Wrap App in ErrorBoundary
root.render(React.createElement(ErrorBoundary, {},
  React.createElement(App)
));
```

### 6. Responsive Design

Add mobile-friendly breakpoints:

```javascript
// Update grid layouts to be responsive
className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
className: 'grid grid-cols-2 md:grid-cols-5 gap-4'
```

### 7. README.md

Create usage documentation:

```markdown
# Prompt Bench UI

Web UI for running prompt-bench experiments with real-time progress monitoring.

## Quick Start

```bash
# Start the UI server
bun run prompt-bench/ui/server.ts

# Open in browser
open http://localhost:3001
```

## Features

- **Experiment Runner**: Configure and run Stage 1-3 experiments
- **Real-time Progress**: Live SSE updates during generation
- **Results Browser**: View, filter, and compare past experiments
- **Collection Metrics**: Consistency, variety, and plausibility scores
- **Image Gallery**: Side-by-side comparison of generated images

## Usage

### Running an Experiment

1. Select stage (Stage 1, 2, or 3)
2. Choose batch file from fixtures
3. Select template
4. (Optional) Set custom label
5. Click "Run Experiment"
6. Monitor real-time progress
7. View results when complete

### Quick Start Presets

- **Run Stage 1**: Pre-fills form for single vs multi-input comparison
- **Run All Stage 2 Strategies**: Runs category-based, AI-decided, and hybrid templates

### Viewing Results

1. Navigate to "Results Browser"
2. Filter by batch label or minimum score
3. Click any row to expand comparison view
4. View metrics table and image gallery
5. Click images to open full-size in new tab

## Architecture

- **Runtime**: Bun (native server)
- **Frontend**: React 19 (CDN)
- **Styling**: Tailwind CSS (CDN)
- **Real-time**: Server-Sent Events (SSE)
- **Database**: Supabase (via existing admin client)

## Development

The entire UI is in a single file (`server.ts`) for simplicity:
- No build step required
- Edit and refresh to see changes
- React components defined inline with `React.createElement`

## Troubleshooting

**Port already in use:**
```bash
# Change port in server.ts
port: 3002
```

**Batch files not loading:**
- Ensure `prompt-bench/fixtures/*.json` files exist
- Check file format matches BatchFileSchema

**Templates not loading:**
- Run `bun bench sync` to sync templates to database
- Verify Supabase connection

**SSE stream errors:**
- Check that `testCommand` accepts progress callback
- Verify environment variables are loaded (`.env`, `.env.local`)
```

## Acceptance Criteria

- [ ] Loading states show during data fetches
- [ ] Cost counter updates during runs (if backend supports)
- [ ] Cancel button stops running experiments
- [ ] Empty states show helpful messages
- [ ] Error boundary catches and displays errors gracefully
- [ ] UI is responsive on mobile devices
- [ ] README.md documents all features and usage
- [ ] All edge cases handled (no batch files, no templates, network errors)

## Dependencies

- All previous tasks (01-06)

## Final Testing Checklist

### ExperimentRunner
- [ ] Form loads with batches and templates
- [ ] Quick Start buttons work
- [ ] Can select all inputs
- [ ] Run button enables/disables correctly
- [ ] SSE stream shows real-time progress
- [ ] Cancel button works
- [ ] Error messages display
- [ ] Success state shows "View Results" button

### ResultsBrowser
- [ ] Results table loads
- [ ] Filters work (label, min score)
- [ ] Clear filters button works
- [ ] Rows expand to show comparison
- [ ] Metrics calculate correctly
- [ ] Images display in grid
- [ ] Clicking images opens in new tab
- [ ] Empty state shows helpful message

### Navigation
- [ ] Client-side routing works
- [ ] Nav header highlights active view
- [ ] Browser back/forward works
- [ ] Direct URL navigation works (`http://localhost:3001/results`)

### Error Handling
- [ ] Network errors show messages
- [ ] Invalid input shows validation
- [ ] API errors display properly
- [ ] Error boundary catches crashes
- [ ] All fetch calls have try/catch

### Performance
- [ ] Page loads in < 2 seconds
- [ ] SSE updates are smooth
- [ ] No memory leaks during long runs
- [ ] Large image grids render efficiently
