# ExperimentRunner Component

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add ExperimentRunner component)

## Implementation Details

Build the main ExperimentRunner component that configures and runs experiments with real-time progress.

### Component Implementation

Add after UI primitives in the `<script type="module">` section:

```javascript
// ============================================================================
// ExperimentRunner Component
// ============================================================================

const ExperimentRunner = () => {
  // Form state
  const [stage, setStage] = useState('stage1');
  const [batchFile, setBatchFile] = useState('');
  const [template, setTemplate] = useState('');
  const [label, setLabel] = useState('');

  // Data state
  const [batches, setBatches] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Run state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [recentImages, setRecentImages] = useState([]);

  // Fetch batches and templates on mount
  useEffect(() => {
    fetchBatches();
    fetchTemplates();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleRun = async () => {
    if (!template || !batchFile) {
      setError('Please select both template and batch file');
      return;
    }

    setIsRunning(true);
    setError(null);
    setProgress(null);
    setRecentImages([]);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, batchFile, label })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.done) {
              setIsRunning(false);
              setProgress({ phase: 'complete', current: 100, total: 100, message: 'Run completed successfully!' });
            } else if (data.error) {
              setError(data.error);
              setIsRunning(false);
            } else {
              setProgress(data);
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setIsRunning(false);
    }
  };

  const handleQuickStart = (preset) => {
    if (preset === 'stage1') {
      setStage('stage1');
      setBatchFile('prompt-bench/fixtures/stage1-batch.json');
      setTemplate('ecommerce-base');
    } else if (preset === 'stage2-all') {
      setStage('stage2');
      // Note: Would need to run 3 separate runs for each strategy
      alert('Run all Stage 2 strategies sequentially (to be implemented)');
    }
  };

  // Render
  return React.createElement('div', { className: 'max-w-6xl mx-auto p-8 space-y-6' },
    // Header
    React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 'Experiment Runner'),

    // Quick Start Section
    React.createElement(Card, { title: 'Quick Start' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement(Button, {
          variant: 'secondary',
          onClick: () => handleQuickStart('stage1')
        }, 'Run Stage 1'),
        React.createElement(Button, {
          variant: 'secondary',
          onClick: () => handleQuickStart('stage2-all')
        }, 'Run All Stage 2 Strategies')
      )
    ),

    // Configuration Section
    React.createElement(Card, { title: 'Configure Experiment' },
      React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
        React.createElement(Select, {
          label: 'Stage',
          value: stage,
          onChange: setStage,
          options: [
            { value: 'stage1', label: 'Stage 1 - Single vs Multi Input' },
            { value: 'stage2', label: 'Stage 2 - Strategy Comparison' },
            { value: 'stage3', label: 'Stage 3 - Context Strategy' }
          ]
        }),
        React.createElement(Select, {
          label: 'Batch File',
          value: batchFile,
          onChange: setBatchFile,
          options: [
            { value: '', label: '-- Select batch file --' },
            ...batches.map(b => ({ value: b.filename, label: `${b.label} (${b.testCount} tests)` }))
          ]
        }),
        React.createElement(Select, {
          label: 'Template',
          value: template,
          onChange: setTemplate,
          options: [
            { value: '', label: '-- Select template --' },
            ...templates.map(t => ({ value: t.slug, label: t.slug }))
          ]
        }),
        React.createElement(Input, {
          label: 'Label (optional)',
          value: label,
          onChange: (e) => setLabel(e.target.value),
          placeholder: 'Auto-generated if empty'
        })
      ),
      React.createElement('div', { className: 'mt-4' },
        React.createElement(Button, {
          onClick: handleRun,
          disabled: isRunning || !template || !batchFile
        }, isRunning ? 'Running...' : 'Run Experiment')
      )
    ),

    // Progress Section
    isRunning && progress && React.createElement(Card, { title: 'Progress' },
      React.createElement(ProgressBar, {
        current: progress.current,
        total: progress.total,
        label: progress.message
      }),
      React.createElement('div', { className: 'mt-4 text-sm text-gray-600' },
        `Phase: ${progress.phase} | ${progress.current}/${progress.total}`
      )
    ),

    // Error Section
    error && React.createElement(Card, {},
      React.createElement('div', { className: 'text-red-600' },
        React.createElement('strong', {}, 'Error: '),
        error
      )
    ),

    // Success Section
    !isRunning && progress?.phase === 'complete' && React.createElement(Card, { title: 'Run Complete' },
      React.createElement('p', { className: 'text-green-600 mb-4' }, '✓ Experiment completed successfully!'),
      React.createElement(Button, {
        onClick: () => window.location.href = '/results'
      }, 'View Results')
    )
  );
};
```

## Acceptance Criteria

- [ ] Form renders with all 4 inputs (stage, batch, template, label)
- [ ] Batch files populate from /api/batches
- [ ] Templates populate from /api/templates
- [ ] "Run" button is disabled when missing required fields
- [ ] Quick Start buttons pre-fill form values
- [ ] SSE stream connects on "Run" click
- [ ] Progress bar updates in real-time
- [ ] Error messages display when runs fail
- [ ] Success message shows with "View Results" button
- [ ] Can navigate to /results after completion

## Dependencies

- Task 03 (SSE Streaming) - run endpoint must work
- Task 04 (UI Primitives) - components must be defined

## Testing

1. Start server: `bun run prompt-bench/ui/server.ts`
2. Visit http://localhost:3001
3. Select batch file and template
4. Click "Run Experiment"
5. Verify progress updates in real-time
6. Wait for completion
7. Click "View Results" button
