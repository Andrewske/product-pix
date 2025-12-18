# Notebook UI Components

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add React components)

## Implementation Details

Build the notebook interface with three phase components and a fixture image grid selector.

### Component Hierarchy

```
NotebookView (main container)
├─ SessionHeader
├─ FixtureImageSelector (modal)
├─ AnalysisPhase
│   ├─ RunButton
│   ├─ VariablesEditor
│   ├─ AnalysisRunsList
│   └─ AnalysisResultsView (expandable)
├─ GenerationPhase (locked until analysis selected)
│   ├─ TemplateSelector
│   ├─ TemplateEditor (JSON textarea)
│   ├─ RunButton
│   ├─ GenerationRunsList
│   └─ GenerationResultsView (image + thinking + tokens)
└─ EvaluationPhase (locked until generation selected)
    ├─ RunButton
    ├─ EvaluationRunsList
    └─ EvaluationResultsView
```

### 1. NotebookView (Main Container)

```typescript
const NotebookView = () => {
  const [sessionId, setSessionId] = useState(null);
  const [fixtureImages, setFixtureImages] = useState({});
  const [selectedFixtureIds, setSelectedFixtureIds] = useState([]);
  const [showFixtureSelector, setShowFixtureSelector] = useState(false);

  const [analysisRuns, setAnalysisRuns] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);

  const [generationRuns, setGenerationRuns] = useState([]);
  const [selectedGenerationId, setSelectedGenerationId] = useState(null);

  const [evaluationRuns, setEvaluationRuns] = useState([]);

  useEffect(() => {
    // Load session from URL
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('session');

    if (urlSessionId) {
      setSessionId(urlSessionId);
      loadSession(urlSessionId);
    } else {
      // New session - show fixture selector
      setShowFixtureSelector(true);
    }

    // Load fixture images
    fetch('/api/notebook/fixtures')
      .then(res => res.json())
      .then(data => setFixtureImages(data.fixtures));
  }, []);

  const loadSession = async (sessionId) => {
    const res = await fetch(`/api/notebook/session/${sessionId}`);
    const data = await res.json();

    setAnalysisRuns(data.phases.analysis);
    setGenerationRuns(data.phases.generation);
    setEvaluationRuns(data.phases.evaluation);
  };

  const handleFixtureSelection = (fixtureIds) => {
    setSelectedFixtureIds(fixtureIds);
    setShowFixtureSelector(false);

    // Generate session ID
    const newSessionId = `notebook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(newSessionId);
    window.history.replaceState({}, '', `?session=${newSessionId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <SessionHeader sessionId={sessionId} />

      {showFixtureSelector && (
        <FixtureImageSelector
          fixtures={fixtureImages}
          onSelect={handleFixtureSelection}
          onCancel={() => setShowFixtureSelector(false)}
        />
      )}

      {sessionId && (
        <div className="space-y-8 mt-6">
          <AnalysisPhase
            sessionId={sessionId}
            fixtureImageIds={selectedFixtureIds}
            runs={analysisRuns}
            selectedRunId={selectedAnalysisId}
            onRunComplete={(newRun) => setAnalysisRuns([...analysisRuns, newRun])}
            onSelectRun={setSelectedAnalysisId}
          />

          <GenerationPhase
            sessionId={sessionId}
            parentRunId={selectedAnalysisId}
            runs={generationRuns.filter(r => r.parent_run_id === selectedAnalysisId)}
            selectedRunId={selectedGenerationId}
            disabled={!selectedAnalysisId}
            onRunComplete={(newRun) => setGenerationRuns([...generationRuns, newRun])}
            onSelectRun={setSelectedGenerationId}
          />

          <EvaluationPhase
            sessionId={sessionId}
            parentRunId={selectedGenerationId}
            runs={evaluationRuns.filter(r => r.parent_run_id === selectedGenerationId)}
            disabled={!selectedGenerationId}
            onRunComplete={(newRun) => setEvaluationRuns([...evaluationRuns, newRun])}
          />
        </div>
      )}
    </div>
  );
};
```

### 2. FixtureImageSelector (Modal with Grid)

```typescript
const FixtureImageSelector = ({ fixtures, onSelect, onCancel }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleImage = (imageId) => {
    setSelectedIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const filteredFixtures = Object.entries(fixtures).reduce((acc, [product, images]) => {
    const filtered = images.filter(img =>
      img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) acc[product] = filtered;
    return acc;
  }, {});

  const selectedCount = selectedIds.length;
  const productCount = new Set(
    selectedIds.map(id => {
      for (const [product, images] of Object.entries(fixtures)) {
        if (images.some(img => img.id === id)) return product;
      }
    })
  ).size;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Select Fixture Images</h2>

        <input
          type="text"
          placeholder="Search images..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 mb-4"
        />

        <div className="text-sm text-gray-600 mb-4">
          {selectedCount > 0 ? (
            `Selected: ${selectedCount} images from ${productCount} product${productCount !== 1 ? 's' : ''} → Will create ${productCount} test${productCount !== 1 ? 's' : ''}`
          ) : (
            'Click images to select. Same product = 1 test with multiple images.'
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {Object.entries(filteredFixtures).map(([product, images]) => (
            <div key={product} className="border rounded p-4">
              <h3 className="font-semibold mb-3 capitalize">{product.replace(/-/g, ' ')}</h3>

              <div className="grid grid-cols-6 gap-2">
                {images.map(img => (
                  <div
                    key={img.id}
                    onClick={() => toggleImage(img.id)}
                    className={`cursor-pointer border-2 rounded p-1 transition ${
                      selectedIds.includes(img.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img.r2_url}
                      alt={img.filename}
                      className="w-full h-12 object-cover rounded"
                    />
                    <p className="text-xs mt-1 truncate text-center">{img.filename}</p>
                    {selectedIds.includes(img.id) && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedIds)}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
          >
            Use Selected Images
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3. AnalysisPhase Component

```typescript
const AnalysisPhase = ({ sessionId, fixtureImageIds, runs, selectedRunId, onRunComplete, onSelectRun }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [variables, setVariables] = useState({});
  const [expandedRunId, setExpandedRunId] = useState(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/notebook/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fixtureImageIds,
          variables,
          model: 'gemini-2.0-flash-exp',
          cacheEnabled: true
        })
      });

      const result = await res.json();
      if (result.error) {
        alert(`Analysis failed: ${result.error}`);
      } else {
        onRunComplete(result);
        setVariables({}); // Reset for next run
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-4">Analysis Phase</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Analysis Variables (optional overrides)
        </label>
        <textarea
          value={JSON.stringify(variables, null, 2)}
          onChange={(e) => {
            try {
              setVariables(JSON.parse(e.target.value));
            } catch {}
          }}
          className="w-full border rounded p-2 font-mono text-sm h-24"
          placeholder='{"key": "value"}'
        />
      </div>

      <button
        onClick={handleRun}
        disabled={isRunning || fixtureImageIds.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isRunning ? 'Running Analysis...' : `Run Analysis (${runs.length + 1})`}
      </button>

      {runs.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Analysis Runs ({runs.length})</h3>
          {runs.map(run => (
            <div
              key={run.id}
              className={`border rounded p-3 cursor-pointer ${
                selectedRunId === run.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={selectedRunId === run.id}
                    onChange={() => onSelectRun(run.id)}
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="font-medium">Run {run.phase_run_number}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {run.debug_metadata?.tokens?.input || 0} in / {run.debug_metadata?.tokens?.output || 0} out
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedRunId(expandedRunId === run.id ? null : run.id);
                  }}
                  className="text-sm text-blue-600"
                >
                  {expandedRunId === run.id ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {expandedRunId === run.id && (
                <div className="mt-3 pt-3 border-t">
                  <h4 className="text-sm font-semibold mb-2">Analysis Results:</h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(run.inputs, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedRunId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          ✓ Analysis Run {runs.find(r => r.id === selectedRunId)?.phase_run_number} selected for generation
        </div>
      )}
    </div>
  );
};
```

### 4. GenerationPhase Component

```typescript
const GenerationPhase = ({ sessionId, parentRunId, runs, selectedRunId, disabled, onRunComplete, onSelectRun }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [templateSlug, setTemplateSlug] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateData, setTemplateData] = useState({});
  const [expandedRunId, setExpandedRunId] = useState(null);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []));
  }, []);

  useEffect(() => {
    if (templateSlug) {
      const template = templates.find(t => t.slug === templateSlug);
      if (template) {
        setTemplateData(template.template_data || {});
      }
    }
  }, [templateSlug, templates]);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/notebook/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          parentRunId,
          templateSlug,
          templateData,
          variables: {}
        })
      });

      const result = await res.json();
      if (result.error) {
        alert(`Generation failed: ${result.error}`);
      } else {
        onRunComplete(result);
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (disabled) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4 text-gray-400">Generation Phase</h2>
        <p className="text-gray-500">Select an analysis run to unlock generation</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-4">Generation Phase</h2>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Template</label>
          <select
            value={templateSlug}
            onChange={(e) => setTemplateSlug(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select template --</option>
            {templates.map(t => (
              <option key={t.slug} value={t.slug}>{t.slug}</option>
            ))}
          </select>
        </div>

        {templateSlug && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Template JSON (edit to customize)
            </label>
            <textarea
              value={JSON.stringify(templateData, null, 2)}
              onChange={(e) => {
                try {
                  setTemplateData(JSON.parse(e.target.value));
                } catch {}
              }}
              className="w-full border rounded p-2 font-mono text-sm h-64"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleRun}
        disabled={isRunning || !templateSlug}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isRunning ? 'Generating...' : `Run Generation (${runs.length + 1})`}
      </button>

      {runs.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Generation Runs ({runs.length})</h3>
          {runs.map(run => (
            <div
              key={run.id}
              className={`border rounded p-3 ${
                selectedRunId === run.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={selectedRunId === run.id}
                    onChange={() => onSelectRun(run.id)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Run {run.phase_run_number}</span>
                  <span className="text-xs text-gray-500">
                    {run.debug_metadata?.tokens?.input || 0} in / {run.debug_metadata?.tokens?.output || 0} out
                  </span>
                </div>
                <button
                  onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                  className="text-sm text-blue-600"
                >
                  {expandedRunId === run.id ? 'Collapse' : 'Expand'}
                </button>
              </div>

              <img src={run.image_url} alt={`Run ${run.phase_run_number}`} className="w-48 rounded" />

              {expandedRunId === run.id && run.debug_metadata?.thinking && (
                <div className="mt-3 pt-3 border-t">
                  <h4 className="text-sm font-semibold mb-2">Thinking:</h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                    {run.debug_metadata.thinking}
                  </pre>

                  <h4 className="text-sm font-semibold mb-2 mt-3">Final Prompt:</h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                    {run.final_prompt}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 5. SessionHeader

```typescript
const SessionHeader = ({ sessionId }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notebook</h1>
          {sessionId && (
            <p className="text-sm text-gray-500 mt-1">Session: {sessionId}</p>
          )}
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};
```

## Acceptance Criteria

### Fixture Image Selector
- [ ] Modal displays on new session
- [ ] Grid shows all fixture images grouped by product
- [ ] 50px thumbnails with filename labels
- [ ] Multi-select via click (green border when selected)
- [ ] Search filters by product/filename
- [ ] Summary shows "X images from Y products → Y tests"
- [ ] Clicking "Use Selected" creates session and closes modal

### Analysis Phase
- [ ] Variables editor (JSON textarea)
- [ ] "Run Analysis" button triggers POST to `/api/notebook/analyze`
- [ ] Loading state during run
- [ ] Runs list shows all attempts with radio buttons
- [ ] Selecting run unlocks generation phase
- [ ] Expandable results show analysis JSON + token counts
- [ ] Green highlight on selected run

### Generation Phase
- [ ] Locked (grayed out) until analysis selected
- [ ] Template dropdown populated from `/api/templates`
- [ ] Template JSON editor (textarea)
- [ ] "Run Generation" button triggers POST
- [ ] Runs list shows images + token counts
- [ ] Expandable view shows thinking output + final prompt
- [ ] Radio button to select for evaluation

### General
- [ ] Session ID in URL query param
- [ ] Page refresh restores session from database
- [ ] Simple, clean UI (no fancy animations)
- [ ] Responsive layout works on desktop

## Dependencies
- Task 02 (backend API endpoints) must be completed

## Testing Checklist

1. **Fixture selection**:
   - Open `/notebook`
   - Select 3 images from "bag" product → shows "3 images from 1 product → 1 test"
   - Select 1 image each from "bag", "mug", "monitor" → shows "3 images from 3 products → 3 tests"
   - Click "Use Selected" → session created, URL updated

2. **Analysis phase**:
   - Click "Run Analysis" → loading state shown
   - After completion → run appears in list
   - Click "Run Analysis" again → creates Run 2
   - Select Run 1 via radio → generation unlocks

3. **Generation phase**:
   - Select template from dropdown
   - Edit JSON (change "background" value)
   - Click "Run Generation" → image appears
   - Expand run → see thinking output and tokens
   - Run again with different template → creates Run 2

4. **Session persistence**:
   - Copy session URL
   - Refresh page → all runs restore
   - Open URL in new tab → session loads
