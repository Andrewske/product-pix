import React, { useState, useEffect, useCallback } from 'react';
import { SessionHeader } from './SessionHeader';
import { FixtureImageSelector } from './FixtureImageSelector';
import { AnalysisPhase } from './AnalysisPhase';
import { GenerationPhase } from './GenerationPhase';
import { EvaluationPhase } from './EvaluationPhase';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../primitives';
import type { AnalysisRun, GenerationRun, EvaluationRun } from '../../types/index';

interface ImageCacheEntry {
  runId: string;
  r2Url: string;
  dataUrl: string;
  size: number;
  timestamp: number;
}

interface FixtureImage {
  id: string;
  product_name: string;
  filename: string;
  r2_url: string;
}

interface NotebookSession {
  sessionId: string;
  selectedFixtureIds: string[];
  selectedAnalysisId: string | null;
  selectedGenerationId: string | null;
  analysisRuns: AnalysisRun[];
  generationRuns: GenerationRun[];
  evaluationRuns: EvaluationRun[];
  imageCache: ImageCacheEntry[];
}

export function NotebookView(): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fixtureImages, setFixtureImages] = useState<Record<string, FixtureImage[]>>({});
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([]);

  const [analysisRuns, setAnalysisRuns] = useState<AnalysisRun[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  const [generationRuns, setGenerationRuns] = useState<GenerationRun[]>([]);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);

  const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRun[]>([]);

  const [imageCache, setImageCache] = useState<ImageCacheEntry[]>([]);

  const [isFixtureSelectorExpanded, setIsFixtureSelectorExpanded] = useState(false);

  const handleFixtureSelection = useCallback((fixtureIds: string[]) => {
    setSelectedFixtureIds(fixtureIds);

    // Clear downstream state (inputs changed)
    setAnalysisRuns([]);
    setGenerationRuns([]);
    setEvaluationRuns([]);
    setSelectedAnalysisId(null);
    setSelectedGenerationId(null);

    // Collapse selector
    setIsFixtureSelectorExpanded(false);
  }, []);

  const loadSessionCallback = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/notebook/session/${sessionId}`, {});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Update React state
      setAnalysisRuns(data.phases.analysis || []);
      setGenerationRuns(data.phases.generation || []);
      setSelectedAnalysisId(data.phases.analysis?.[0]?.id || null);
      setSelectedGenerationId(data.phases.generation?.[0]?.id || null);
      setEvaluationRuns(data.phases.evaluation || []);

      // Cache in SessionStorage for next reload
      saveNotebookSession({
        sessionId,
        selectedFixtureIds: [], // Don't have this from DB
        selectedAnalysisId: data.phases.analysis?.[0]?.id || null,
        selectedGenerationId: data.phases.generation?.[0]?.id || null,
        analysisRuns: data.phases.analysis || [],
        generationRuns: data.phases.generation || [],
        evaluationRuns: data.phases.evaluation || [],
        imageCache: []
      });
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load session. Check network connection or try refreshing.');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('session');

    if (urlSessionId) {
      setSessionId(urlSessionId);

      // Try SessionStorage first
      const cached = loadNotebookSession(urlSessionId);
      if (cached) {
        console.log('Restored session from SessionStorage cache');
        setSelectedFixtureIds(cached.selectedFixtureIds || []);
        setAnalysisRuns(cached.analysisRuns || []);
        setSelectedAnalysisId(cached.selectedAnalysisId);
        setGenerationRuns(cached.generationRuns || []);
        setSelectedGenerationId(cached.selectedGenerationId);
        setEvaluationRuns(cached.evaluationRuns || []);
        setImageCache(cached.imageCache || []);
        setIsFixtureSelectorExpanded(false);
      } else {
        // Fallback to database
        console.log('SessionStorage miss, loading from database');
        loadSessionCallback(urlSessionId);
      }
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
      .then(res => res.json())
      .then(data => setFixtureImages(data.fixtures))
      .catch(err => {
        console.error('Failed to load fixtures:', err);
        setError('Failed to load fixture images. Have you run `bun bench sync`?');
      });
  }, [loadSessionCallback]);

  // Save complete session state to SessionStorage
  useEffect(() => {
    if (sessionId) {
      saveNotebookSession({
        sessionId,
        selectedFixtureIds,
        selectedAnalysisId,
        selectedGenerationId,
        analysisRuns,
        generationRuns,
        evaluationRuns,
        imageCache
      });
    }
  }, [
    sessionId,
    selectedFixtureIds,
    selectedAnalysisId,
    selectedGenerationId,
    analysisRuns,
    generationRuns,
    evaluationRuns,
    imageCache
   ]);

  return (
    <div className="max-w-7xl mx-auto p-8">
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <SessionHeader sessionId={sessionId} />

      {/* ALWAYS render selector (not conditional) */}
      <FixtureImageSelector
        fixtures={fixtureImages}
        selectedFixtureIds={selectedFixtureIds}
        isExpanded={isFixtureSelectorExpanded}
        onToggleExpand={() => setIsFixtureSelectorExpanded(!isFixtureSelectorExpanded)}
        onSelect={handleFixtureSelection}
      />

      {/* Only show phases when images are selected */}
      {sessionId && selectedFixtureIds.length > 0 && (
        <div className="space-y-8 mt-6">
          <AnalysisPhase
            sessionId={sessionId}
            fixtureIds={selectedFixtureIds}
            runs={analysisRuns}
            selectedRunId={selectedAnalysisId}
            onSelectRun={setSelectedAnalysisId}
            onRunComplete={(newRun) => setAnalysisRuns([...analysisRuns, newRun])}
          />

          <GenerationPhase
            sessionId={sessionId}
            parentRunId={selectedAnalysisId}
            analysisRuns={analysisRuns}
            runs={generationRuns.filter(r => r.parent_run_id === selectedAnalysisId)}
            selectedRunId={selectedGenerationId}
            disabled={!selectedAnalysisId}
            onRunComplete={(newRun) => setGenerationRuns([...generationRuns, newRun])}
            onSelectRun={setSelectedGenerationId}
            imageCache={imageCache}
            setImageCache={setImageCache}
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

      {/* Show prompt when no images selected */}
      {sessionId && selectedFixtureIds.length === 0 && (
        <Card className="mt-6 text-center py-8 text-gray-500">
          Select fixture images above to begin analysis
        </Card>
      )}
    </div>
  );
}

// Helper functions for session storage
function loadNotebookSession(sessionId: string): NotebookSession | null {
  try {
    const key = `notebook-session-${sessionId}`;
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Failed to load session from SessionStorage:', err);
    return null;
  }
}

function saveNotebookSession(session: NotebookSession): void {
  try {
    const key = `notebook-session-${session.sessionId}`;
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session to SessionStorage:', err);
  }
}