import * as React from 'react';
import { SessionHeader } from './SessionHeader';
import { FixtureImageSelector } from './FixtureImageSelector';
import { AnalysisPhase } from './AnalysisPhase';
import { GenerationPhase } from './GenerationPhase';
import { EvaluationPhase } from './EvaluationPhase';
import { ErrorMessage } from '../shared/ErrorMessage';
import type { AnalysisRun, GenerationRun, EvaluationRun } from '../../types/index';

interface FixtureImage {
  id: string;
  product_name: string;
  filename: string;
  r2_url: string;
}

export function NotebookView(): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [fixtureImages, setFixtureImages] = React.useState<
    Record<string, FixtureImage[]>
  >({});
  const [selectedFixtureIds, setSelectedFixtureIds] = React.useState<string[]>(
    []
  );

  const [analysisRuns, setAnalysisRuns] = React.useState<AnalysisRun[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = React.useState<
    string | null
  >(null);

  const [generationRuns, setGenerationRuns] = React.useState<GenerationRun[]>(
    []
  );
  const [selectedGenerationId, setSelectedGenerationId] = React.useState<
    string | null
  >(null);

  const [evaluationRuns, setEvaluationRuns] = React.useState<EvaluationRun[]>(
    []
  );

  const [isFixtureSelectorExpanded, setIsFixtureSelectorExpanded] =
    React.useState(false);

  const handleFixtureSelection = React.useCallback((fixtureIds: string[]) => {
    setSelectedFixtureIds(fixtureIds);

    // Clear downstream state (inputs changed)
    setAnalysisRuns([]);
    setGenerationRuns([]);
    setEvaluationRuns([]);
    setSelectedAnalysisId(null);
    setSelectedGenerationId(null);
  }, []);

  const handleRemoveAnalysisRun = React.useCallback(
    (runId: string) => {
      setAnalysisRuns((prev) => prev.filter((run) => run.id !== runId));
      if (selectedAnalysisId === runId) {
        setSelectedAnalysisId(null);
      }
    },
    [selectedAnalysisId]
  );

  const handleRemoveGenerationRun = React.useCallback(
    (runId: string) => {
      setGenerationRuns((prev) => prev.filter((run) => run.id !== runId));
      if (selectedGenerationId === runId) {
        setSelectedGenerationId(null);
      }
    },
    [selectedGenerationId]
  );

  const handleRemoveEvaluationRun = React.useCallback((runId: string) => {
    setEvaluationRuns((prev) => prev.filter((run) => run.id !== runId));
  }, []);

  const copyContextToClipboard = React.useCallback(() => {
    const context = {
      sessionId,
      analysisRuns: analysisRuns.map((r) => ({
        runNumber: r.phase_run_number,
        inputs: r.inputs,
      })),
      generationRuns: generationRuns.map((r) => ({
        runNumber: r.phase_run_number,
        parentRun: r.parent_run_id,
        finalPrompt: r.final_prompt,
        imageUrls: r.debug_metadata?.image_urls,
      })),
      evaluationRuns: evaluationRuns.map((r) => ({
        runNumber: r.phase_run_number,
        score: r.prompt_evaluations?.[0]?.score_overall,
        details: r.prompt_evaluations?.[0]?.details,
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(context, null, 2));
  }, [sessionId, analysisRuns, generationRuns, evaluationRuns]);

  const loadSessionCallback = React.useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/notebook/session/${sessionId}`, {});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Update React state
      const analysisRuns = data.phases.analysis || [];
      const generationRuns = data.phases.generation || [];
      setAnalysisRuns(analysisRuns);
      setGenerationRuns(generationRuns);
      // Select the most recent run for each phase
      const mostRecentAnalysis = analysisRuns.sort(
        (a: AnalysisRun, b: AnalysisRun) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const mostRecentGeneration = generationRuns.sort(
        (a: GenerationRun, b: GenerationRun) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      setSelectedAnalysisId(mostRecentAnalysis?.id || null);
      setSelectedGenerationId(mostRecentGeneration?.id || null);
      setEvaluationRuns(data.phases.evaluation || []);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(
        'Failed to load session. Check network connection or try refreshing.'
      );
    }
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('session');

    if (urlSessionId) {
      setSessionId(urlSessionId);
      // Load from database
      loadSessionCallback(urlSessionId);
    } else {
      // No session: expand selector, create session ID
      setIsFixtureSelectorExpanded(true);
      const tempId = `notebook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(tempId);
      const params = new URLSearchParams(window.location.search);
      params.set('session', tempId);
      window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    }

    // Load fixtures (always)
    fetch('/api/notebook/fixtures')
      .then((res) => res.json())
      .then((data) => setFixtureImages(data.fixtures))
      .catch((err) => {
        console.error('Failed to load fixtures:', err);
        setError(
          'Failed to load fixture images. Have you run `bun bench sync`?'
        );
      });
  }, [loadSessionCallback]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}

        <SessionHeader
          sessionId={sessionId}
          onCopyContext={copyContextToClipboard}
        />

        <div className="space-y-8">
          <FixtureImageSelector
            fixtures={fixtureImages}
            selectedFixtureIds={selectedFixtureIds}
            isExpanded={isFixtureSelectorExpanded}
            onToggleExpand={() =>
              setIsFixtureSelectorExpanded(!isFixtureSelectorExpanded)
            }
            onSelect={handleFixtureSelection}
          />

          {sessionId && selectedFixtureIds.length > 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalysisPhase
                sessionId={sessionId}
                fixtureIds={selectedFixtureIds}
                runs={analysisRuns}
                selectedRunId={selectedAnalysisId}
                onSelectRun={setSelectedAnalysisId}
                onRunComplete={(newRun) =>
                  setAnalysisRuns([...analysisRuns, newRun])
                }
                onRemoveRun={handleRemoveAnalysisRun}
              />

              <GenerationPhase
                sessionId={sessionId}
                parentRunId={selectedAnalysisId}
                analysisRuns={analysisRuns}
                runs={generationRuns.filter(
                  (r) => r.parent_run_id === selectedAnalysisId
                )}
                selectedRunId={selectedGenerationId}
                disabled={!selectedAnalysisId}
                onRunComplete={(newRun) =>
                  setGenerationRuns([...generationRuns, newRun])
                }
                onSelectRun={setSelectedGenerationId}
                onRemoveRun={handleRemoveGenerationRun}
              />

              <EvaluationPhase
                sessionId={sessionId}
                parentRunId={selectedGenerationId}
                runs={evaluationRuns.filter(
                  (r) => r.parent_run_id === selectedGenerationId
                )}
                disabled={!selectedGenerationId}
                onRunComplete={(newRun) =>
                  setEvaluationRuns([...evaluationRuns, newRun])
                }
                onRemoveRun={handleRemoveEvaluationRun}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
