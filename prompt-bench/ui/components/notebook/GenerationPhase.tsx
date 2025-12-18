import { useState, useEffect, useCallback } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select } from '../primitives';
import { ErrorMessage } from '../shared/ErrorMessage';
import type { GenerationRun, AnalysisRun } from '../../types/index';

interface ImageCacheEntry {
  runId: string;
  r2Url: string;
  dataUrl: string;
  size: number;
  timestamp: number;
}

interface GenerationPhaseProps {
  sessionId: string;
  parentRunId: string | null;
  analysisRuns: AnalysisRun[];
  runs: GenerationRun[];
  selectedRunId: string | null;
  disabled: boolean;
  onRunComplete: (run: GenerationRun) => void;
  onSelectRun: (id: string) => void;
  imageCache: ImageCacheEntry[];
  setImageCache: (cache: ImageCacheEntry[]) => void;
}

interface Template {
  slug: string;
  template_data: Record<string, unknown>;
}

// Helper functions
const convertImageToDataUrl = async (r2Url: string): Promise<string> => {
  const response = await fetch(r2Url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getCachedOrConvertImage = async (
  runId: string,
  r2Url: string,
  imageCache: ImageCacheEntry[]
): Promise<{ dataUrl: string; isNew: boolean; updatedCache: ImageCacheEntry[] }> => {
  const cached = imageCache.find(c => c.runId === runId);
  if (cached) {
    const updatedCache = imageCache.map(c =>
      c.runId === runId ? { ...c, timestamp: Date.now() } : c
    );
    return { dataUrl: cached.dataUrl, isNew: false, updatedCache };
  }

  const dataUrl = await convertImageToDataUrl(r2Url);
  const newEntry: ImageCacheEntry = { runId, r2Url, dataUrl, size: dataUrl.length, timestamp: Date.now() };
  const withNewEntry = [...imageCache, newEntry];
  const updatedCache = withNewEntry.length > 5
    ? withNewEntry.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
    : withNewEntry;

  return { dataUrl, isNew: true, updatedCache };
};

function RunComparisonModal({ phase, runs, onClose }: { phase: string; runs: GenerationRun[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Compare {phase.charAt(0).toUpperCase() + phase.slice(1)} Runs</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <div className={`grid gap-6 ${runs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {runs.map(run => (
            <div key={run.id} className="border rounded p-4">
              <h3 className="font-bold mb-3">Run {run.phase_run_number}</h3>
              <div className="text-sm text-gray-600 mb-3">
                Tokens: {run.debug_metadata?.tokens?.input || 0} in / {run.debug_metadata?.tokens?.output || 0} out
              </div>
              <div className="mb-3">
                <img
                  src={run.debug_metadata?.image_url || ''}
                  alt={`Generated result for run ${run.phase_run_number}`}
                  className="w-full rounded border border-gray-200"
                />
              </div>
              {run.debug_metadata?.thinking && (
                <details className="mb-2">
                  <summary className="text-sm cursor-pointer font-semibold">Thinking</summary>
                  <pre className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                    {run.debug_metadata.thinking}
                  </pre>
                </details>
              )}
              <details>
                <summary className="text-sm cursor-pointer font-semibold">Final Prompt</summary>
                <pre className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                  {run.final_prompt}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GenerationPhase({
  sessionId,
  parentRunId,
  analysisRuns,
  runs,
  selectedRunId,
  disabled,
  onRunComplete,
  onSelectRun,
  imageCache,
  setImageCache
}: GenerationPhaseProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [templateSlug, setTemplateSlug] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateData, setTemplateData] = useState<Record<string, unknown>>({});
  const [analysisVariables, setAnalysisVariables] = useState<Record<string, unknown>>({});
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [imageDataUrls, setImageDataUrls] = useState<Record<string, string>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, string>>({});

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

  // Load from parent run when selected
  useEffect(() => {
    if (parentRunId) {
      const parentRun = analysisRuns.find(r => r.id === parentRunId);
      if (parentRun) {
        setAnalysisVariables(parentRun.inputs || {});
      }
    }
  }, [parentRunId, analysisRuns]);

  // Persist to SessionStorage
  useEffect(() => {
    sessionStorage.setItem('notebook.generation.analysisVariables', JSON.stringify(analysisVariables));
  }, [analysisVariables]);

  // Restore from SessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('notebook.generation.analysisVariables');
    if (stored) {
      try {
        setAnalysisVariables(JSON.parse(stored));
      } catch {
        // Ignore corrupt data
      }
    }
  }, []);

  const loadImage = useCallback(async (run: GenerationRun) => {
    const r2Url = run.debug_metadata?.image_url;
    if (!r2Url) return;

    try {
      const result = await getCachedOrConvertImage(run.id, r2Url, imageCache);

      setImageDataUrls(prev => ({ ...prev, [run.id]: result.dataUrl }));

      if (result.updatedCache) {
        setImageCache(result.updatedCache);
      }
    } catch (err) {
      console.error('Failed to convert image to data URL', { error: (err as Error).message, runId: run.id });
      setImageLoadErrors(prev => ({ ...prev, [run.id]: (err as Error).message }));
    }
  }, [imageCache, setImageCache]);

  // Load image when run is expanded
  useEffect(() => {
    if (expandedRunId && !imageDataUrls[expandedRunId] && !imageLoadErrors[expandedRunId]) {
      const run = runs.find(r => r.id === expandedRunId);
      if (run) {
        loadImage(run);
      }
    }
  }, [expandedRunId, imageDataUrls, imageLoadErrors, runs, loadImage]);

  const handleRun = async () => {
    // Validate template selected
    if (!templateSlug) {
      setError('Please select a template');
      return;
    }

    // Validate template JSON
    try {
      if (typeof templateData === 'string') {
        JSON.parse(templateData as string);
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
          variables: analysisVariables
        })
      });

      const result = await res.json();

      if (result.error) {
        setError('Generation failed: ' + result.error);
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
        <h2 className="text-xl font-bold mb-4 text-gray-400">Generation Phase</h2>
        <p className="text-gray-500">Select an analysis run to unlock generation</p>
      </Card>
    );
  }

  return (
    <Card className="border rounded-lg p-6 bg-white">
      <ErrorMessage message={error} onDismiss={() => setError(null)} />
      <h2 className="text-xl font-bold mb-4">Generation Phase</h2>
      <div className="space-y-4 mb-4">
        <Select
          label="Template"
          value={templateSlug}
          onChange={setTemplateSlug}
          options={[
            { value: '', label: '-- Select template --' },
            ...templates.map(t => ({ value: t.slug, label: t.slug }))
          ]}
        />
        {templateSlug && (
          <div>
            <label htmlFor="template-json" className="block text-sm font-medium mb-2">
              Template JSON (edit to customize)
            </label>
            <textarea
              id="template-json"
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
        <div>
          <label htmlFor="analysis-variables" className="block text-sm font-medium mb-1">
            Analysis Variables
          </label>
          <textarea
            id="analysis-variables"
            value={JSON.stringify(analysisVariables || {}, null, 2)}
            onChange={(e) => {
              try {
                setAnalysisVariables(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON - just ignore, don't crash
              }
            }}
            placeholder='{"background": "white"}'
            className="w-full h-48 border rounded p-2 font-mono text-sm"
          />
        </div>
      </div>
      <Button
        onClick={handleRun}
        disabled={isRunning || !templateSlug}
      >
        {isRunning ? 'Generating...' : `Run Generation (${runs.length + 1})`}
      </Button>
      {runs.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Generation Runs ({runs.length})</h3>
          {runs.length >= 2 && (
            <Button
              variant="outline"
              onClick={() => setShowComparison(true)}
            >
              Compare All {runs.length} Runs
            </Button>
          )}
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
                    {(run.debug_metadata?.tokens?.input || 0)} in / {(run.debug_metadata?.tokens?.output || 0)} out
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                  className="text-sm text-blue-600"
                >
                  {expandedRunId === run.id ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <img
                src={imageDataUrls[run.id] || run.debug_metadata?.image_url || ''}
                alt={`Generated result for run ${run.phase_run_number} - ${run.inputs?.product || ''}`}
                className="w-full h-auto rounded border border-gray-200"
              />
              {imageLoadErrors[run.id] && (
                <div className="text-xs text-red-600 mt-1">
                  Cache failed, using direct URL
                </div>
              )}
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
      {showComparison && (
        <RunComparisonModal
          phase="generation"
          runs={runs}
          onClose={() => setShowComparison(false)}
        />
      )}
    </Card>
  );
}