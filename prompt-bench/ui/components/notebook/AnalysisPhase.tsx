import { useState, useEffect } from 'react';
import { Button, Card } from '../primitives';
import { ErrorMessage } from '../shared/ErrorMessage';
import type { AnalysisRun } from '../../types/index';

interface AnalysisPhaseProps {
  sessionId: string;
  fixtureIds: string[];
  runs: AnalysisRun[];
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
  onRunComplete: (run: AnalysisRun) => void;
}

function RunComparisonModal({ phase, runs, onClose }: { phase: string; runs: AnalysisRun[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Compare {phase.charAt(0).toUpperCase() + phase.slice(1)} Runs</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className={`grid gap-6 ${runs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {runs.map(run => (
            <div key={run.id} className="border rounded p-4">
              <h3 className="font-bold mb-3">Run {run.phase_run_number}</h3>
              <div className="text-sm text-gray-600 mb-3">
                Tokens: {run.debug_metadata?.tokens?.input || 0} in / {run.debug_metadata?.tokens?.output || 0} out
              </div>
              <h4 className="text-sm font-semibold mb-2">Analysis Results:</h4>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(run.inputs, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalysisPhase({
  sessionId,
  fixtureIds,
  runs,
  selectedRunId,
  onSelectRun,
  onRunComplete
}: AnalysisPhaseProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [analysisPrompt, setAnalysisPrompt] = useState<string>('');
  const [analysisSchema, setAnalysisSchema] = useState<Record<string, any>>({});
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  //   // const [showComparison, setShowComparison] = useState(false);

  // Set default prompt and schema on mount
  useEffect(() => {
    setAnalysisPrompt('Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.');
    setAnalysisSchema({
      product: { type: 'string', description: 'The main product name/type' },
      color: { type: 'string', description: 'Primary color and finish' },
      material: { type: 'string', description: 'Primary material composition' },
      shape: { type: 'string', description: 'Overall shape and form' },
      features: { type: 'array', items: 'string', description: 'Key distinguishing features' },
      hasScaleReference: { type: 'boolean', description: 'True if hand/body part visible for scale' },
      scaleDescription: { type: 'string', optional: true, description: 'Scale description if visible' },
      brand: { type: 'string', optional: true, description: 'Brand name if visible' },
      brandingDetails: { type: 'string', optional: true, description: 'Branding element details' },
    });
  }, []);

  const handleRun = async () => {
    // Validate before running
    if (fixtureIds.length === 0) {
      setError('No fixture images selected. Please start a new session with images.');
      return;
    }

    // Validate JSON
    try {
      JSON.stringify(variables);
    } catch {
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
          sessionId: sessionId,
          fixtureImageIds: fixtureIds,
          variables,
          model: 'gemini-2.0-flash-exp',
          cacheEnabled: true,
          customPrompt: analysisPrompt,
          customSchema: analysisSchema
        })
      });

      const result = await res.json();

      if (result.error) {
        setError(`Analysis failed: ${result.error}`);
      } else {
        setError(null);
        onRunComplete(result);
        setVariables({});
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleVariablesChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setVariables(parsed);
    } catch {
      // Invalid JSON, keep current state
    }
  };

  const handleExpandRun = (runId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const handleRunClick = (runId: string) => {
    onSelectRun(runId);
  };

  const handleRunKeyDown = (runId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectRun(runId);
    }
  };

  return (
    <Card>
      <ErrorMessage message={error} onDismiss={() => setError(null)} />
      <h2 className="text-xl font-bold mb-4">Analysis Phase</h2>
      <div className="mb-4">
        <label htmlFor="analysis-prompt-textarea" className="block text-sm font-medium mb-1">
          Analysis Prompt
        </label>
        <textarea
          id="analysis-prompt-textarea"
          value={analysisPrompt}
          onChange={(e) => setAnalysisPrompt(e.target.value)}
          className="w-full h-24 border rounded p-2 font-mono text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="analysis-schema-textarea" className="block text-sm font-medium mb-1">
          Response Schema (fields to extract)
        </label>
        <textarea
          id="analysis-schema-textarea"
          value={JSON.stringify(analysisSchema, null, 2)}
          onChange={(e) => {
            try {
              setAnalysisSchema(JSON.parse(e.target.value));
            } catch {
              // Invalid JSON - ignore
            }
          }}
          className="w-full h-64 border rounded p-2 font-mono text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="variables-textarea" className="block text-sm font-medium mb-2">
          Analysis Variables (optional overrides)
        </label>
        <textarea
          id="variables-textarea"
          value={JSON.stringify(variables || {}, null, 2)}
          onChange={(e) => handleVariablesChange(e.target.value)}
          className="w-full border rounded p-2 font-mono text-sm h-24"
          placeholder='{"key": "value"}'
        />
      </div>
      <Button
        onClick={handleRun}
        disabled={isRunning || fixtureIds.length === 0}
      >
        {isRunning ? 'Running Analysis...' : `Run Analysis (${runs.length + 1})`}
      </Button>
      {runs.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Analysis Runs ({runs.length})</h3>
          {/* {runs.length >= 2 && (
            <Button
              variant="outline"
              onClick={() => setShowComparison(true)}
            >
              Compare All {runs.length} Runs
            </Button>
          )} */}
           {runs.map(run => (
             <div
               key={run.id}
               className={`border rounded p-3 w-full ${
                 selectedRunId === run.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
               }`}
             >
               <div className="flex justify-between items-center">
                 <button
                   type="button"
                   className="flex items-center gap-3 cursor-pointer flex-1 text-left"
                   onClick={() => handleRunClick(run.id)}
                   onKeyDown={(e) => handleRunKeyDown(run.id, e)}
                   aria-label={`Select analysis run ${run.phase_run_number}`}
                 >
                   <input
                     type="radio"
                     checked={selectedRunId === run.id}
                     onChange={() => onSelectRun(run.id)}
                     className="w-4 h-4"
                     aria-label={`Select run ${run.phase_run_number}`}
                   />
                   <div>
                     <span className="font-medium">Run {run.phase_run_number}</span>
                     <span className="text-xs text-gray-500 ml-2">
                       {run.debug_metadata?.tokens?.input || 0} in / {run.debug_metadata?.tokens?.output || 0} out
                     </span>
                   </div>
                 </button>
                 <button
                   type="button"
                   onClick={(e) => handleExpandRun(run.id, e)}
                   className="text-sm text-blue-600 ml-2"
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
      {(() => {
        if (!selectedRunId) return null;
        const run = runs.find(r => r.id === selectedRunId as string);
        const runNumber = run?.phase_run_number || 'Unknown';
        return (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            ✓ Analysis Run {runNumber} selected for generation
          </div>
        );
      })()}
      {/* {showComparison && (
        <RunComparisonModal
          phase="analysis"
          runs={runs}
          onClose={() => setShowComparison(false)}
        />
      )} */}
    </Card>
  );
}