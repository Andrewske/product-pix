import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../primitives';
import { ComparisonView } from './ComparisonView';

interface ResultsBrowserProps {
  onCompare?: (baselineLabel: string, candidateLabel: string) => void;
}

interface TestResult {
  batchLabel: string;
  stats: {
    count: number;
    meanScore: number;
    totalCost: number;
  };
  tests: Array<{
    id: string;
    image_url?: string;
    prompt_evaluations?: Array<{
      score_overall: number;
      details?: Record<string, unknown>;
    }>;
  }>;
}

export function ResultsBrowser({ onCompare }: ResultsBrowserProps): React.ReactElement {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filters
  const [labelFilter, setLabelFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');

  const fetchResultsCallback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (labelFilter) params.set('label', labelFilter);
      if (minScoreFilter) params.set('minScore', minScoreFilter);

      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  }, [labelFilter, minScoreFilter]);

  useEffect(() => {
    fetchResultsCallback();
  }, [fetchResultsCallback]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (labelFilter) params.set('label', labelFilter);
      if (minScoreFilter) params.set('minScore', minScoreFilter);

      const res = await fetch('/api/results?' + params);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (batchLabel: string) => {
    setExpandedRow(expandedRow === batchLabel ? null : batchLabel);
  };

  const handleCompare = (baseline: string, candidate: string) => {
    if (onCompare) {
      onCompare(baseline, candidate);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Results Browser</h1>
        <Button
          variant="outline"
          onClick={() => { window.location.href = '/'; }}
        >
          ← Back to Runner
        </Button>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="label-filter" className="text-sm font-medium text-gray-700">Batch Label</label>
            <input
              id="label-filter"
              type="text"
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              placeholder="Filter by label..."
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="score-filter" className="text-sm font-medium text-gray-700">Min Score</label>
            <input
              id="score-filter"
              type="number"
              step="0.1"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
              placeholder="0.0 - 10.0"
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setLabelFilter('');
                setMinScoreFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card title={`Results (${results.length})`}>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">📊 No experiment results yet</p>
            <p className="text-gray-400 mb-6">Run your first experiment to see results here</p>
            <Button onClick={() => { window.location.href = '/'; }}>
              Go to Experiment Runner
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.batchLabel}>
                {/* Row header */}
                <button
                  type="button"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 w-full text-left"
                  onClick={() => toggleRow(result.batchLabel)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{result.batchLabel}</div>
                    <div className="text-sm text-gray-500">
                      {result.stats.count} tests | Mean Score: {result.stats.meanScore.toFixed(2)} | Cost: ${result.stats.totalCost.toFixed(4)}
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedRow === result.batchLabel ? '▼' : '▶'}
                  </span>
                </button>

                {/* Expanded comparison view */}
                {expandedRow === result.batchLabel && (
                  <ComparisonView data={result} onClose={() => setExpandedRow(null)} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}