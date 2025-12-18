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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  RadioGroup,
  RadioGroupItem,
  AspectRatio,
} from '../../shadcn';
import { ChevronDown, X, Loader2, Wand2, Lock } from 'lucide-react';
import type { GenerationRun, AnalysisRun } from '../../types/index';

interface GenerationPhaseProps {
  sessionId: string;
  parentRunId: string | null;
  analysisRuns: AnalysisRun[];
  runs: GenerationRun[];
  selectedRunId: string | null;
  disabled: boolean;
  onRunComplete: (run: GenerationRun) => void;
  onSelectRun: (id: string) => void;
  onRemoveRun: (id: string) => void;
}

interface Template {
  slug: string;
  template_data: Record<string, unknown>;
  variables_schema?: Record<string, unknown>;
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
  onRemoveRun,
}: GenerationPhaseProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [templateSlug, setTemplateSlug] = React.useState('');
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [templateData, setTemplateData] = React.useState<Record<string, unknown>>({});
  const [analysisVariables, setAnalysisVariables] = React.useState<Record<string, unknown>>({});
  const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);
  const [showComparison, setShowComparison] = React.useState(false);
  const [model, setModel] = React.useState('gemini-3-pro-image-preview');
  const [variablesSchema, setVariablesSchema] = React.useState<Record<string, unknown> | null>(null);
  const [compiledPrompt, setCompiledPrompt] = React.useState<string | null>(null);
  const [generationConfig, setGenerationConfig] = React.useState({
    resolution: '1k' as '1k' | '2k' | '4k',
    aspectRatio: '1:1' as string,
  });

  React.useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []));
  }, []);

  React.useEffect(() => {
    if (templateSlug) {
      const template = templates.find((t) => t.slug === templateSlug);
      if (template) {
        setTemplateData(template.template_data || {});
        setVariablesSchema(template.variables_schema || null);
      }
    }
  }, [templateSlug, templates]);

  React.useEffect(() => {
    if (parentRunId) {
      const parentRun = analysisRuns.find((r) => r.id === parentRunId);
      if (parentRun) {
        setAnalysisVariables(parentRun.inputs || {});
      }
    }
  }, [parentRunId, analysisRuns]);

  const previewPrompt = async () => {
    if (!templateSlug) {
      setError('Please select a template first');
      return;
    }

    try {
      const res = await fetch('/api/notebook/compile-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateSlug, templateData, variables: analysisVariables }),
      });
      const data = await res.json();
      setCompiledPrompt(data.prompt || 'Error compiling prompt');
    } catch (err) {
      setError('Failed to compile prompt: ' + (err as Error).message);
    }
  };

  const handleRun = async () => {
    if (!templateSlug) {
      setError('Please select a template');
      return;
    }

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
          variables: analysisVariables,
          model,
          config: generationConfig,
        }),
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
      <ShadcnCard className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5" />
            Generation Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select an analysis run to unlock generation
          </p>
        </CardContent>
      </ShadcnCard>
    );
  }

  const templateOptions = [
    { value: '', label: '-- Select template --' },
    ...templates.map((t) => ({ value: t.slug, label: t.slug })),
  ];

  return (
    <ShadcnCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Generation Phase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Template"
            value={templateSlug}
            onChange={setTemplateSlug}
            options={templateOptions}
          />
          <Select
            label="Model"
            value={model}
            onChange={setModel}
            options={[{ value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image' }]}
          />
        </div>

        {templateSlug && (
          <div className="space-y-1.5">
            <Label>Template JSON (edit to customize)</Label>
            <Textarea
              value={JSON.stringify(templateData, null, 2)}
              onChange={(e) => {
                try {
                  setTemplateData(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON
                }
              }}
              className="h-64 font-mono text-sm"
            />
          </div>
        )}

        {variablesSchema && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
              Available Variables
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(variablesSchema, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}

        {templateSlug && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary">
              <ChevronDown className="h-4 w-4" />
              Preview Compiled Prompt
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <Button variant="outline" size="sm" onClick={previewPrompt}>
                Compile
              </Button>
              {compiledPrompt && (
                <Textarea
                  value={compiledPrompt}
                  onChange={(e) => setCompiledPrompt(e.target.value)}
                  className="h-32 font-mono text-sm"
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Resolution"
            value={generationConfig.resolution}
            onChange={(value) =>
              setGenerationConfig((prev) => ({ ...prev, resolution: value as '1k' | '2k' | '4k' }))
            }
            options={[
              { value: '1k', label: '1K' },
              { value: '2k', label: '2K' },
              { value: '4k', label: '4K' },
            ]}
          />
          <Select
            label="Aspect Ratio"
            value={generationConfig.aspectRatio}
            onChange={(value) => setGenerationConfig((prev) => ({ ...prev, aspectRatio: value }))}
            options={[
              { value: '1:1', label: '1:1 (Square)' },
              { value: '3:4', label: '3:4 (Portrait)' },
              { value: '4:3', label: '4:3 (Landscape)' },
              { value: '9:16', label: '9:16 (Vertical)' },
              { value: '16:9', label: '16:9 (Horizontal)' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Analysis Variables</Label>
          <Textarea
            value={JSON.stringify(analysisVariables || {}, null, 2)}
            onChange={(e) => {
              try {
                setAnalysisVariables(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON
              }
            }}
            placeholder='{"background": "white"}'
            className="h-48 font-mono text-sm"
          />
        </div>

        <Button onClick={handleRun} disabled={isRunning || !templateSlug}>
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRunning ? 'Generating...' : `Run Generation (${runs.length + 1})`}
        </Button>

        {runs.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Generation Runs ({runs.length})</h3>
                {runs.length >= 2 && (
                  <Button variant="outline" size="sm" onClick={() => setShowComparison(true)}>
                    Compare All
                  </Button>
                )}
              </div>
              <RadioGroup
                value={selectedRunId || ''}
                onValueChange={onSelectRun}
                className="space-y-3"
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
                        selectedRunId === run.id ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={run.id} id={run.id} />
                          <label htmlFor={run.id} className="cursor-pointer">
                            <span className="font-medium">Run {run.phase_run_number}</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="info">{run.debug_metadata?.model || 'unknown'}</Badge>
                              <Badge variant="info">
                                ${run.debug_metadata?.cost?.toFixed(4) || '0.0000'}
                              </Badge>
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

                      {/* Image grid */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(run.debug_metadata?.image_urls || []).map((imageUrl, index) => (
                          <div key={`${run.id}-${index}`} className="relative">
                            <img
                              src={imageUrl}
                              alt={`Generated result ${index + 1}`}
                              className="w-[150px] h-[150px] object-cover rounded border"
                            />
                            {index === 0 && run.debug_metadata?.image_urls && run.debug_metadata.image_urls.length > 1 && (
                              <Badge className="absolute -top-1 -right-1" variant="info">
                                {run.debug_metadata.image_urls.length}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      <CollapsibleContent>
                        <Separator className="my-3" />
                        {run.debug_metadata?.thinking && (
                          <div className="space-y-2 mb-3">
                            <h4 className="text-sm font-medium">Thinking:</h4>
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-32">
                              {run.debug_metadata.thinking}
                            </pre>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Final Prompt:</h4>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-32">
                            {run.final_prompt}
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

        {/* Comparison Dialog */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Compare Generation Runs</DialogTitle>
            </DialogHeader>
            <div className={cn('grid gap-6', runs.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
              {runs.map((run) => (
                <div key={run.id} className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-bold">Run {run.phase_run_number}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Model: {run.debug_metadata?.model || 'unknown'}</div>
                    <div>Cost: ${run.debug_metadata?.cost?.toFixed(4) || '0.0000'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {run.debug_metadata?.image_urls?.map((url, idx) => (
                      <img
                        key={`${run.id}-modal-${idx}`}
                        src={url}
                        alt={`Result ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </ShadcnCard>
  );
}
