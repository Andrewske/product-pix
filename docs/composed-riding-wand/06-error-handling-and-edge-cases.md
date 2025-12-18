# Error Handling and Edge Cases

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add validation and error display)

## Implementation Details

Simple error handling focused on showing clear error messages to the developer.

### Error Display Component

```typescript
const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded p-4 shadow-lg z-50">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-red-900">Error</div>
          <div className="text-sm text-red-700 mt-1">{message}</div>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 ml-4"
        >
          ×
        </button>
      </div>
    </div>
  );
};
```

### Form Validation

```typescript
const AnalysisPhase = ({ sessionId, fixtureImageIds, runs, onRunComplete, onSelectRun }) => {
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [variables, setVariables] = useState({});

  const handleRun = async () => {
    // Validate before running
    if (fixtureImageIds.length === 0) {
      setError('No fixture images selected. Please start a new session with images.');
      return;
    }

    // Validate JSON
    try {
      if (typeof variables === 'string') {
        JSON.parse(variables);
      }
    } catch (e) {
      setError('Invalid JSON in variables field');
      return;
    }

    setError(null);
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
        setError(`Analysis failed: ${result.error}`);
      } else {
        onRunComplete(result);
        setVariables({});
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* ... rest of component ... */}
    </div>
  );
};
```

### Generation Phase Validation

```typescript
const GenerationPhase = ({ sessionId, parentRunId, disabled, /* ... */ }) => {
  const [error, setError] = useState(null);
  const [templateSlug, setTemplateSlug] = useState('');
  const [templateData, setTemplateData] = useState({});

  const handleRun = async () => {
    // Validate template selected
    if (!templateSlug) {
      setError('Please select a template');
      return;
    }

    // Validate template JSON
    try {
      if (typeof templateData === 'string') {
        JSON.parse(templateData);
      }
    } catch (e) {
      setError('Invalid JSON in template editor');
      return;
    }

    // Validate parent run
    if (!parentRunId) {
      setError('No analysis run selected. Please select an analysis run first.');
      return;
    }

    setError(null);
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
        setError(`Generation failed: ${result.error}`);
      } else {
        onRunComplete(result);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // ... rest of component
};
```

### Edge Cases

**1. Session not found**
```typescript
const loadSession = async (sessionId) => {
  try {
    const res = await fetch(`/api/notebook/session/${sessionId}`);

    if (!res.ok) {
      if (res.status === 404) {
        setError('Session not found. Starting new session.');
        window.location.href = '/notebook';
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    setAnalysisRuns(data.phases.analysis);
    setGenerationRuns(data.phases.generation);
    setEvaluationRuns(data.phases.evaluation);
  } catch (err) {
    setError(`Failed to load session: ${err.message}`);
  }
};
```

**2. No fixture images synced**
```typescript
useEffect(() => {
  fetch('/api/notebook/fixtures')
    .then(res => res.json())
    .then(data => {
      if (!data.fixtures || Object.keys(data.fixtures).length === 0) {
        setError('No fixture images found. Run "bun bench sync" to upload fixture images.');
      }
      setFixtureImages(data.fixtures);
    })
    .catch(err => setError(`Failed to load fixtures: ${err.message}`));
}, []);
```

**3. API timeout**
```typescript
const fetchWithTimeout = async (url, options, timeout = 120000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 2 minutes');
    }
    throw err;
  }
};
```

**4. Corrupted SessionStorage**
```typescript
// Already handled in Task 04 with try/catch
const saved = sessionStorage.getItem(`notebook-${urlSessionId}`);
if (saved) {
  try {
    const { selectedAnalysisId, selectedGenerationId } = JSON.parse(saved);
    setSelectedAnalysisId(selectedAnalysisId);
    setSelectedGenerationId(selectedGenerationId);
  } catch (e) {
    console.warn('Failed to restore session state:', e);
    // Continue without restored state - no error shown to user
  }
}
```

## Acceptance Criteria

### Validation
- [ ] Analysis phase: Validates fixture images exist
- [ ] Generation phase: Validates template selected and parent run exists
- [ ] JSON editors: Validates JSON syntax before submission
- [ ] Clear error messages for each validation failure

### Error Display
- [ ] Errors shown in red toast (top-right corner)
- [ ] Error message includes context (which phase, what failed)
- [ ] Can dismiss error by clicking X
- [ ] Error auto-dismissed on successful operation

### Network Errors
- [ ] Fetch failures show network error message
- [ ] Timeout after 2 minutes shows timeout message
- [ ] 404 redirects to new session
- [ ] 500 shows server error message

### Edge Cases
- [ ] Session not found → clear error + redirect to new session
- [ ] No fixtures → error with "run bun bench sync" instruction
- [ ] Corrupted SessionStorage → gracefully ignored
- [ ] Invalid template JSON → error before API call

## Dependencies
- Task 02 (backend endpoints) - for error responses
- Task 03 (UI components) - error display integrates

## Testing Checklist

1. **Validation errors**:
   - Try running analysis without fixture images → error shown
   - Enter invalid JSON in variables → error shown
   - Try running generation without template → error shown

2. **Network errors**:
   - Disconnect network, try running → network error shown
   - Manually trigger 500 response → server error shown

3. **Edge cases**:
   - Navigate to `?session=nonexistent` → error + redirect
   - Corrupt SessionStorage JSON → gracefully handled
   - No fixture images in DB → error with instructions

4. **Error dismissal**:
   - Show error → click X → error disappears
   - Show error → run successful operation → error auto-clears
