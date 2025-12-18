import * as React from 'react';
import {
  Button,
  Select,
  Label,
  Textarea,
  Badge,
  ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Alert,
  AlertDescription,
  cn,
} from '../primitives';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  RadioGroup,
  RadioGroupItem,
} from '../../shadcn';
import { ChevronDown, X, CheckCircle, Loader2, Microscope } from 'lucide-react';
import type { AnalysisRun } from '../../types/index';

interface AnalysisPhaseProps {
  sessionId: string;
  fixtureIds: string[];
  runs: AnalysisRun[];
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
  onRunComplete: (run: AnalysisRun) => void;
  onRemoveRun: (id: string) => void;
}

export function AnalysisPhase({
  sessionId,
  fixtureIds,
  runs,
  selectedRunId,
  onSelectRun,
  onRunComplete,
  onRemoveRun,
}: AnalysisPhaseProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [variables, setVariables] = React.useState<Record<string, unknown>>({});
  const [analysisPrompt, setAnalysisPrompt] = React.useState<string>('');
  const [analysisSchema, setAnalysisSchema] = React.useState<Record<string, unknown>>({});
  const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);
  const [model, setModel] = React.useState('gemini-2.0-flash');

  // Set default prompt and schema on mount
  React.useEffect(() => {
    setAnalysisPrompt(
      'Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.'
    );
    setAnalysisSchema({
      product: { type: 'string', description: 'The main product name/type' },
      color: { type: 'string', description: 'Primary color and finish' },
      material: { type: 'string', description: 'Primary material composition' },
      shape: { type: 'string', description: 'Overall shape and form' },
      features: {
        type: 'array',
        items: 'string',
        description: 'Key distinguishing features',
      },
      hasScaleReference: {
        type: 'boolean',
        description: 'True if hand/body part visible for scale',
      },
      scaleDescription: {
        type: 'string',
        optional: true,
        description: 'Scale description if visible',
      },
      brand: {
        type: 'string',
        optional: true,
        description: 'Brand name if visible',
      },
      brandingDetails: {
        type: 'string',
        optional: true,
        description: 'Branding element details',
      },
    });
  }, []);

  const handleRun = async () => {
    if (fixtureIds.length === 0) {
      setError('No fixture images selected. Please start a new session with images.');
      return;
    }

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
          model,
          cacheEnabled: true,
          customPrompt: analysisPrompt,
          customSchema: analysisSchema,
        }),
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

  return (
    <ShadcnCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Microscope className="h-5 w-5" />
          Analysis Phase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Select
          label="Model"
          value={model}
          onChange={setModel}
          options={[
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { value: 'gemini-2.0-flash-thinking', label: 'Gemini 2.0 Flash Thinking' },
          ]}
        />

        <div className="space-y-1.5">
          <Label>Analysis Prompt</Label>
          <Textarea
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            className="h-24 font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Response Schema (fields to extract)</Label>
          <Textarea
            value={JSON.stringify(analysisSchema, null, 2)}
            onChange={(e) => {
              try {
                setAnalysisSchema(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON - ignore
              }
            }}
            className="h-64 font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Analysis Variables (optional overrides)</Label>
          <Textarea
            value={JSON.stringify(variables || {}, null, 2)}
            onChange={(e) => handleVariablesChange(e.target.value)}
            className="h-24 font-mono text-sm"
            placeholder='{"key": "value"}'
          />
        </div>

        <Button onClick={handleRun} disabled={isRunning || fixtureIds.length === 0}>
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRunning ? 'Running Analysis...' : `Run Analysis (${runs.length + 1})`}
        </Button>

        {runs.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h3 className="font-semibold">Analysis Runs ({runs.length})</h3>
              <RadioGroup
                value={selectedRunId || ''}
                onValueChange={onSelectRun}
                className="space-y-2"
              >
                {runs.map((run) => (
                  <Collapsible
                    key={run.id}
                    open={expandedRunId === run.id}
                    onOpenChange={() =>
                      setExpandedRunId(expandedRunId === run.id ? null : run.id)
                    }
                  >
                    <div
                      className={cn(
                        'rounded-lg border p-3',
                        selectedRunId === run.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={run.id} id={run.id} />
                          <label
                            htmlFor={run.id}
                            className="cursor-pointer flex-1"
                          >
                            <span className="font-medium">
                              Run {run.phase_run_number}
                            </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="info">
                                {run.debug_metadata?.model || 'unknown'}
                              </Badge>
                              <Badge variant="info">
                                ${run.debug_metadata?.cost?.toFixed(4) || '0.0000'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {run.debug_metadata?.duration_ms !== undefined
                                  ? `${(run.debug_metadata.duration_ms / 1000).toFixed(2)}s`
                                  : ''}
                              </span>
                            </div>
                          </label>
                        </div>
                        <div className="flex items-center gap-1">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  expandedRunId === run.id && 'rotate-180'
                                )}
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveRun(run.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Analysis Results:</h4>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-64">
                            {JSON.stringify(run.inputs, null, 2)}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </RadioGroup>
            </div>
          </>
        )}

        {selectedRunId && (
          <Alert className="bg-primary/10 border-primary/20">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              Analysis Run{' '}
              {runs.find((r) => r.id === selectedRunId)?.phase_run_number || ''}{' '}
              selected for generation
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </ShadcnCard>
  );
}
