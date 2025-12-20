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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../shadcn';
import { ChevronDown, X, CheckCircle, Loader2, Microscope, Settings2, Play } from 'lucide-react';
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
  const [model, setModel] = React.useState('gemini-3-flash-preview');
  const [showAllRuns, setShowAllRuns] = React.useState(false);

  // Set default prompt and schema on mount
  React.useEffect(() => {
    setAnalysisPrompt(
      `Analyze this product image carefully. Be specific and descriptive.

## Brand Detection (CRITICAL)
Look for brand identifiers on:
- Metal plaques or badges
- Embossed or debossed text
- Tags, labels, or hang tags
- Logos or emblems

**IMPORTANT**: Read brand text CHARACTER BY CHARACTER. Do not guess or infer brand names.
- If text is partially obscured or unclear, report only the letters you can clearly see
- Report EXACTLY what is written, preserving spacing and capitalization
- If you cannot read the text clearly, leave brand empty rather than guessing

## Product Analysis
Extract product details accurately. If you cannot determine a field, use an empty string.`
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
        description: 'True if human hand/body part or common object visible for scale comparison',
      },
      scaleDescription: {
        type: 'string',
        optional: true,
        description: 'Natural language description of scale if reference visible (e.g., "fits in palm", "hand-holdable size", "about 12 inches wide")',
      },
      brand: {
        type: 'string',
        optional: true,
        description: 'Brand name EXACTLY as shown on product (read character by character, do not guess)',
      },
      brandingDetails: {
        type: 'string',
        optional: true,
        description: 'Description of where/how branding appears (e.g., "metal plaque on front")',
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
    <ShadcnCard className="border-l-4 border-l-primary/50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Microscope className="h-5 w-5 text-primary" />
            Analysis Phase
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              label=""
              value={model}
              onChange={setModel}
              options={[
                { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
                { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
              ]}
              className="w-[200px]"
            />
            <Button onClick={handleRun} disabled={isRunning || fixtureIds.length === 0} size="sm">
              {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRunning ? 'Running...' : 'Run Analysis'}
              {!isRunning && <Play className="ml-2 h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="config" className="border rounded-md px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                <span>Configure Prompt & Schema</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Analysis Prompt</Label>
                  <Textarea
                    value={analysisPrompt}
                    onChange={(e) => setAnalysisPrompt(e.target.value)}
                    className="h-48 font-mono text-xs resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Response Schema</Label>
                  <Textarea
                    value={JSON.stringify(analysisSchema, null, 2)}
                    onChange={(e) => {
                      try {
                        setAnalysisSchema(JSON.parse(e.target.value));
                      } catch {
                        // Invalid JSON - ignore
                      }
                    }}
                    className="h-48 font-mono text-xs resize-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Variables (JSON)</Label>
                <Textarea
                  value={JSON.stringify(variables || {}, null, 2)}
                  onChange={(e) => handleVariablesChange(e.target.value)}
                  className="h-24 font-mono text-xs"
                  placeholder='{"key": "value"}'
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {runs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Run History</h3>
               <span className="text-xs text-muted-foreground">{runs.length} run{runs.length !== 1 ? 's' : ''}</span>
            </div>

            <RadioGroup
              value={selectedRunId || ''}
              onValueChange={onSelectRun}
              className="space-y-3"
            >
              {[...runs].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ).slice(0, showAllRuns ? runs.length : 1).map((run) => (
                <Collapsible
                  key={run.id}
                  open={expandedRunId === run.id}
                  onOpenChange={() =>
                    setExpandedRunId(expandedRunId === run.id ? null : run.id)
                  }
                >
                  <div
                    className={cn(
                      'rounded-xl border transition-all duration-200',
                      selectedRunId === run.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-border/80'
                    )}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-1">
                        <RadioGroupItem value={run.id} id={run.id} />
                        <label
                          htmlFor={run.id}
                          className="cursor-pointer flex-1 grid gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              Run {run.phase_run_number}
                            </span>
                            {selectedRunId === run.id && (
                                <span className="flex items-center text-xs text-primary font-medium">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                            <span>{run.debug_metadata?.model}</span>
                            <span>•</span>
                            <span>${run.debug_metadata?.cost?.toFixed(4) || '0.0000'}</span>
                            <span>•</span>
                            <span>
                              {run.debug_metadata?.duration_ms !== undefined
                                ? `${(run.debug_metadata.duration_ms / 1000).toFixed(2)}s`
                                : ''}
                            </span>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform text-muted-foreground',
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
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <Separator />
                      <div className="p-3 bg-muted/30 rounded-b-xl">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="text-xs font-semibold text-muted-foreground uppercase">Extracted Data</h4>
                        </div>
                         <pre className="text-xs font-mono bg-background p-3 rounded-md border whitespace-pre-wrap break-words max-h-[300px] overflow-scroll">
                           {JSON.stringify(run.inputs, null, 2)}
                         </pre>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </RadioGroup>

            {runs.length > 1 && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllRuns(!showAllRuns)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showAllRuns ? 'Show Less' : `Show ${runs.length - 1} More Run${runs.length - 1 !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </ShadcnCard>
  );
}
