import * as React from 'react';
import {
  Card,
  Button,
  Input,
  Label,
  ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  cn,
} from '../primitives';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../shadcn';
import { ChevronDown, ArrowLeft, BarChart3 } from 'lucide-react';
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
  const [results, setResults] = React.useState<TestResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

  // Filters
  const [labelFilter, setLabelFilter] = React.useState('');
  const [minScoreFilter, setMinScoreFilter] = React.useState('');

  const fetchResultsCallback = React.useCallback(async () => {
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

  React.useEffect(() => {
    fetchResultsCallback();
  }, [fetchResultsCallback]);

  const toggleRow = (batchLabel: string) => {
    setExpandedRow(expandedRow === batchLabel ? null : batchLabel);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Batch Label"
            value={labelFilter}
            onChange={setLabelFilter}
            placeholder="Filter by label..."
          />
          <div className="space-y-1.5">
            <Label>Min Score</Label>
            <input
              type="number"
              step="0.1"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
              placeholder="0.0 - 10.0"
              className={cn(
                'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
                'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
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

      {/* Results */}
      <Card title={`Results (${results.length})`}>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No experiment results yet</p>
            <p className="text-muted-foreground mb-6">
              Run your first experiment to see results here
            </p>
            <Button
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Go to Experiment Runner
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <Collapsible
                key={result.batchLabel}
                open={expandedRow === result.batchLabel}
                onOpenChange={() => toggleRow(result.batchLabel)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center justify-between w-full p-4 rounded-lg text-left transition-colors',
                      'bg-muted/50 hover:bg-muted',
                      expandedRow === result.batchLabel && 'bg-muted'
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{result.batchLabel}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.stats.count} tests | Mean Score:{' '}
                        <span className="font-medium text-foreground">
                          {result.stats.meanScore.toFixed(2)}
                        </span>{' '}
                        | Cost: ${result.stats.totalCost.toFixed(4)}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform',
                        expandedRow === result.batchLabel && 'rotate-180'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-2">
                    <ComparisonView
                      data={result}
                      onClose={() => setExpandedRow(null)}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
