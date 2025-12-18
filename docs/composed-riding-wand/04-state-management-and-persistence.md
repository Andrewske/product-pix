# State Management and Persistence

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add SessionStorage logic to NotebookView)

## Implementation Details

Use SessionStorage for active session state and database for completed runs.

### SessionStorage Strategy

**What to store**: Session ID, selected fixture IDs, selected run IDs (analysis, generation)
**What NOT to store**: Run results (load from database), fixture image data (already in R2)

### Implementation

```typescript
const NotebookView = () => {
  const [sessionId, setSessionId] = useState(null);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState(null);

  // Load state on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('session');

    if (urlSessionId) {
      // Existing session - load from database
      setSessionId(urlSessionId);
      loadSession(urlSessionId);

      // Restore selections from SessionStorage
      const saved = sessionStorage.getItem(`notebook-${urlSessionId}`);
      if (saved) {
        try {
          const { selectedAnalysisId, selectedGenerationId } = JSON.parse(saved);
          setSelectedAnalysisId(selectedAnalysisId);
          setSelectedGenerationId(selectedGenerationId);
        } catch (e) {
          console.warn('Failed to restore session state:', e);
        }
      }
    }
  }, []);

  // Auto-save selections to SessionStorage
  useEffect(() => {
    if (!sessionId) return;

    const state = {
      selectedAnalysisId,
      selectedGenerationId,
      savedAt: new Date().toISOString()
    };

    sessionStorage.setItem(`notebook-${sessionId}`, JSON.stringify(state));
  }, [sessionId, selectedAnalysisId, selectedGenerationId]);

  const loadSession = async (sessionId) => {
    const res = await fetch(`/api/notebook/session/${sessionId}`);
    const data = await res.json();

    setAnalysisRuns(data.phases.analysis);
    setGenerationRuns(data.phases.generation);
    setEvaluationRuns(data.phases.evaluation);
  };

  // ... rest of component
};
```

### Fixture Image Persistence

**Not needed**: Fixture images are stored in R2 with stable URLs. On session reload, we just need the fixture IDs which are stored in the analysis run's inputs.

### Session Recovery Flow

1. User navigates to `/notebook?session=abc123`
2. Load runs from database via `/api/notebook/session/abc123`
3. Restore `selectedAnalysisId` and `selectedGenerationId` from SessionStorage
4. UI automatically shows correct phase states (locked/unlocked, selected runs)

### What Happens on Page Refresh

```
Before refresh:
- Analysis Run 2 selected
- Generation Run 3 selected
- SessionStorage: {"selectedAnalysisId": "uuid-2", "selectedGenerationId": "uuid-3"}

After refresh:
1. URL has ?session=abc123
2. Fetch all runs from DB
3. Read SessionStorage → restore selections
4. UI shows Analysis Run 2 selected (green), Generation Phase unlocked
5. Generation shows Run 3 selected (green), Evaluation Phase unlocked
```

## Acceptance Criteria

### SessionStorage
- [ ] Session state saved on every selection change
- [ ] State includes: selectedAnalysisId, selectedGenerationId
- [ ] State restores on page refresh
- [ ] SessionStorage key format: `notebook-{sessionId}`
- [ ] Invalid/corrupted SessionStorage gracefully ignored

### Database Loading
- [ ] `/api/notebook/session/:id` fetches all phase runs
- [ ] Runs grouped by phase (analysis, generation, evaluation)
- [ ] Parent-child relationships preserved

### Recovery
- [ ] Refresh during active session → state restored
- [ ] Close tab → SessionStorage cleared (auto-cleanup)
- [ ] Open session URL in new tab → loads from DB, no SessionStorage yet

## Dependencies
- Task 02 (backend API endpoints) - for session fetch
- Task 03 (UI components) - state integrates into components

## Testing Checklist

1. **Basic persistence**:
   - Start session, select Analysis Run 2
   - Refresh page → Run 2 still selected
   - Select Generation Run 1
   - Refresh page → Both selections restored

2. **SessionStorage cleanup**:
   - Start session
   - Close tab
   - Reopen browser → SessionStorage cleared (new session)

3. **URL sharing**:
   - Copy session URL from browser
   - Open in new private window
   - Verify runs load from database
   - Make selections → new SessionStorage entry created

4. **Corrupted state**:
   - Manually break SessionStorage JSON
   - Refresh → gracefully ignored, no errors
   - Can still interact with UI normally
