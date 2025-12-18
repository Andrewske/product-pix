# Run Comparison and History

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add comparison view component)

## Implementation Details

Add simple comparison view for comparing multiple runs within the same phase.

### Within-Phase Comparison

User can select 2-3 runs from the same phase (e.g., Analysis Run 1 vs Run 2 vs Run 3) to compare side-by-side.

### Component: RunComparisonModal

```typescript
const RunComparisonModal = ({ phase, runs, onClose }) => {
  if (runs.length < 2) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Compare {phase} Runs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${runs.length}, 1fr)` }}>
          {runs.map(run => (
            <div key={run.id} className="border rounded p-4">
              <h3 className="font-bold mb-3">Run {run.phase_run_number}</h3>

              {/* Tokens */}
              <div className="mb-3">
                <div className="text-sm text-gray-600">Tokens</div>
                <div className="text-xs">
                  In: {run.debug_metadata?.tokens?.input || 0} /
                  Out: {run.debug_metadata?.tokens?.output || 0}
                </div>
              </div>

              {/* Phase-specific content */}
              {phase === 'analysis' && (
                <div>
                  <div className="text-sm font-semibold mb-2">Analysis Results:</div>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(run.inputs, null, 2)}
                  </pre>
                </div>
              )}

              {phase === 'generation' && (
                <div>
                  <img
                    src={run.image_url}
                    alt={`Run ${run.phase_run_number}`}
                    className="w-full rounded mb-2"
                  />
                  {run.debug_metadata?.thinking && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer">Thinking</summary>
                      <pre className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                        {run.debug_metadata.thinking}
                      </pre>
                    </details>
                  )}
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">Prompt</summary>
                    <pre className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                      {run.final_prompt}
                    </pre>
                  </details>
                </div>
              )}

              {phase === 'evaluation' && run.prompt_evaluations?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Score: {run.prompt_evaluations[0].score_overall}/10</div>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(run.prompt_evaluations[0].details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Integration into Phase Components

Add "Compare" button to each phase component:

```typescript
const AnalysisPhase = ({ /* ... */, runs }) => {
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonRuns, setComparisonRuns] = useState([]);

  const handleCompare = () => {
    // User selects which runs to compare (could use checkboxes)
    // For simplicity, compare all runs
    setComparisonRuns(runs);
    setShowComparison(true);
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      {/* ... existing content ... */}

      {runs.length >= 2 && (
        <button
          onClick={handleCompare}
          className="mt-4 px-4 py-2 border rounded hover:bg-gray-50"
        >
          Compare All {runs.length} Runs
        </button>
      )}

      {showComparison && (
        <RunComparisonModal
          phase="analysis"
          runs={comparisonRuns}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};
```

### Alternative: Inline Comparison

Instead of modal, show comparison inline below the runs list:

```typescript
const InlineComparison = ({ runs }) => {
  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-semibold mb-4">Comparison ({runs.length} runs)</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Metric</th>
              {runs.map(run => (
                <th key={run.id} className="text-left py-2 px-4">Run {run.phase_run_number}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Input Tokens</td>
              {runs.map(run => (
                <td key={run.id} className="py-2 px-4">{run.debug_metadata?.tokens?.input || 0}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Output Tokens</td>
              {runs.map(run => (
                <td key={run.id} className="py-2 px-4">{run.debug_metadata?.tokens?.output || 0}</td>
              ))}
            </tr>
            {/* Add more metrics as needed */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## Acceptance Criteria

### Comparison View
- [ ] "Compare Runs" button appears when 2+ runs exist
- [ ] Modal/inline view shows runs side-by-side
- [ ] Token counts displayed for each run
- [ ] Phase-specific data shown (analysis JSON, generation images, eval scores)
- [ ] Can close comparison and return to normal view

### Usability
- [ ] Easy to visually scan differences between runs
- [ ] Thinking output expandable (doesn't clutter view)
- [ ] Works with 2, 3, or more runs
- [ ] Responsive (scrollable on narrow screens)

## Dependencies
- Task 03 (UI components) - integrates into phase components

## Testing Checklist

1. **Analysis comparison**:
   - Run analysis 3 times with different variables
   - Click "Compare All 3 Runs"
   - Verify JSON outputs shown side-by-side
   - Verify token counts visible

2. **Generation comparison**:
   - Run generation 2 times with different templates
   - Click "Compare"
   - Verify images shown side-by-side
   - Expand thinking → verify different for each run

3. **Modal behavior**:
   - Open comparison modal
   - Click X → modal closes
   - Click outside modal → modal closes (if you add that)
