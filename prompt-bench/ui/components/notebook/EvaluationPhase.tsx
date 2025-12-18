import { useState } from 'react';
import { Button, Card } from '../primitives';
import { ErrorMessage } from '../shared/ErrorMessage';
import type { EvaluationRun } from '../../types/index';

interface EvaluationPhaseProps {
  sessionId: string;
  parentRunId: string | null;
  runs: EvaluationRun[];
  disabled: boolean;
  onRunComplete: (run: EvaluationRun) => void;
}

const DEFAULT_EVALUATION_PROMPT = `You are an expert product photographer evaluating generated images. Score each image on a scale of 1-10 (10 being best) across these criteria:

1. **Composition** - How well the product is positioned and framed
2. **Lighting** - Quality and appropriateness of lighting
3. **Product Visibility** - How clearly the product is shown
4. **Background Quality** - How clean and appropriate the background is
5. **Professional Quality** - Overall production quality
6. **Prompt Adherence** - How well the image matches the generation prompt

For each criterion, provide:
- A score (1-10)
- Brief reasoning (1-2 sentences)

Also provide:
- **Overall Score** (1-10) - weighted average of criteria
- **Suggestions** - 2-3 specific improvements for future generations

Format your response as valid JSON with this structure:
{
  "composition": {"score": 8, "reasoning": "The product is well-centered..."},
  "lighting": {"score": 7, "reasoning": "Lighting is adequate but could be more dramatic..."},
  "productVisibility": {"score": 9, "reasoning": "Product is clearly visible..."},
  "backgroundQuality": {"score": 8, "reasoning": "Background is clean..."},
  "professionalQuality": {"score": 8, "reasoning": "Image looks professional..."},
  "promptAdherence": {"score": 9, "reasoning": "Matches the prompt requirements..."},
  "overall_score": 8.2,
  "reasoning": "Overall good quality with room for lighting improvement...",
  "suggestions": [
    "Increase lighting contrast for more dramatic effect",
    "Consider different background options",
    "Adjust product angle slightly"
  ]
}`;

function EvaluationRunCard({ run, isExpanded, onToggleExpand }: {
  run: EvaluationRun;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  const evaluation = run.prompt_evaluations?.[0];
  const details = evaluation?.details || {};
  const scoreOverall = evaluation?.score_overall;

  return (
    <div className="border rounded p-3 border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">Run {run.phase_run_number}</span>
          {scoreOverall && (
            <span className="font-bold text-green-600">{scoreOverall.toFixed(1)}/10</span>
          )}
          <span className="text-xs text-gray-500">
            {(run.debug_metadata?.tokens?.input || 0)} tokens
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleExpand(run.id)}
          className="text-sm text-blue-600"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <EvaluationScoreGrid details={details} />
      {isExpanded && <EvaluationDetails details={details} />}
    </div>
  );
}

function EvaluationScoreGrid({ details }: { details: Record<string, unknown> }) {
  const criteria = [
    { key: 'composition', label: 'Composition' },
    { key: 'lighting', label: 'Lighting' },
    { key: 'productVisibility', label: 'Product Visibility' },
    { key: 'backgroundQuality', label: 'Background Quality' },
    { key: 'professionalQuality', label: 'Professional Quality' },
    { key: 'promptAdherence', label: 'Prompt Adherence' }
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {criteria.map(c => (
        <div key={c.key} className="bg-gray-50 p-2 rounded text-xs">
          <div className="font-medium">{c.label}</div>
          <div>{(details[c.key] as { score?: number })?.score || 'N/A'}</div>
        </div>
      ))}
    </div>
  );
}

function EvaluationDetails({ details }: { details: Record<string, unknown> }) {
  const reasoning = details.reasoning as string;
  const suggestions = details.suggestions as string[];

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      {reasoning && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Reasoning:</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reasoning}</p>
        </div>
      )}
      {suggestions?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Suggestions:</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RunComparisonModal({ phase, runs, onClose }: { phase: string; runs: EvaluationRun[]; onClose: () => void }) {
  if (runs.length < 2) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Compare {phase.charAt(0).toUpperCase() + phase.slice(1)} Runs</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <div className={`grid gap-6 ${runs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {runs.map(run => {
            const evaluation = run.prompt_evaluations?.[0];
            return (
              <div key={run.id} className="border rounded p-4">
                <h3 className="font-bold mb-3">Run {run.phase_run_number}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  Tokens: {run.debug_metadata?.tokens?.input || 0} in / {run.debug_metadata?.tokens?.output || 0} out
                </div>
                {evaluation && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Score: {evaluation.score_overall}/10</div>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(evaluation.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EvaluationPhase({
  sessionId,
  parentRunId,
  runs,
  disabled,
  onRunComplete
}: EvaluationPhaseProps) {
   const [error, setError] = useState<string | null>(null);
   const [isRunning, setIsRunning] = useState(false);
   const [evaluationPrompt, setEvaluationPrompt] = useState(DEFAULT_EVALUATION_PROMPT);
   const [showPromptEditor, setShowPromptEditor] = useState(true);
   const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
   const [showComparison, setShowComparison] = useState(false);

  const handleRun = async () => {
    setError(null);
    setIsRunning(true);

    try {
      const res = await fetch('/api/notebook/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          parentRunId,
          evaluationPrompt: showPromptEditor ? evaluationPrompt : undefined,
          model: 'claude-sonnet-4-20250514'
        })
      });

      const result = await res.json();

      if (result.error) {
        setError('Evaluation failed: ' + result.error);
      } else {
        setError(null);
        onRunComplete(result);
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  if (disabled) {
    return (
      <Card className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4 text-gray-400">Evaluation Phase</h2>
        <p className="text-gray-500">Select a generation run to unlock evaluation</p>
      </Card>
    );
  }

  return (
    <Card className="border rounded-lg p-6 bg-white">
      <ErrorMessage message={error} onDismiss={() => setError(null)} />
      <h2 className="text-xl font-bold mb-4">Evaluation Phase</h2>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowPromptEditor(!showPromptEditor)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showPromptEditor ? 'Hide Prompt' : 'Show Prompt'}
        </button>
        {showPromptEditor && (
          <div className="mt-2 space-y-2">
            <textarea
              value={evaluationPrompt}
              onChange={(e) => setEvaluationPrompt(e.target.value)}
              className="w-full border rounded p-2 font-mono text-sm h-64"
              placeholder="Enter evaluation prompt..."
            />
            <button
              type="button"
              onClick={() => setEvaluationPrompt(DEFAULT_EVALUATION_PROMPT)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Reset to default
            </button>
          </div>
        )}
      </div>
      <Button
        onClick={handleRun}
        disabled={isRunning}
      >
        {isRunning ? 'Evaluating...' : `Run Evaluation (${runs.length + 1})`}
      </Button>
      {runs.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Evaluation Runs ({runs.length})</h3>
          {runs.length >= 2 && (
            <Button
              variant="outline"
              onClick={() => setShowComparison(true)}
            >
              Compare All {runs.length} Runs
            </Button>
          )}
          {runs.map(run => (
            <EvaluationRunCard
              key={run.id}
              run={run}
              isExpanded={expandedRunId === run.id}
              onToggleExpand={(id) => setExpandedRunId(expandedRunId === id ? null : id)}
            />
          ))}
        </div>
      )}
      {showComparison && (
        <RunComparisonModal
          phase="evaluation"
          runs={runs}
          onClose={() => setShowComparison(false)}
        />
      )}
    </Card>
  );
}