import * as React from 'react';
import {
  Button,
  Select,
  Label,
  Textarea,
  Badge,
  Progress,
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
} from '../../shadcn';
import { ChevronDown, X, Loader2, ClipboardCheck, Lock, RotateCcw } from 'lucide-react';
import type { EvaluationRun } from '../../types/index';

interface EvaluationPhaseProps {
  sessionId: string;
  parentRunId: string | null;
  runs: EvaluationRun[];
  disabled: boolean;
  onRunComplete: (run: EvaluationRun) => void;
  onRemoveRun: (id: string) => void;
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

function EvaluationScoreGrid({ details }: { details: Record<string, unknown> }): React.ReactElement {
  const criteria = [
    { key: 'composition', label: 'Composition' },
    { key: 'lighting', label: 'Lighting' },
    { key: 'productVisibility', label: 'Product Visibility' },
    { key: 'backgroundQuality', label: 'Background' },
    { key: 'professionalQuality', label: 'Professional' },
    { key: 'promptAdherence', label: 'Adherence' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {criteria.map((c) => {
        const score = (details[c.key] as { score?: number })?.score || 0;
        return (
          <div key={c.key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{c.label}</span>
              <span className="font-medium">{score}/10</span>
            </div>
            <Progress value={score * 10} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}

function EvaluationDetails({ details }: { details: Record<string, unknown> }): React.ReactElement {
  const reasoning = details.reasoning as string;
  const suggestions = details.suggestions as string[];

  return (
    <div className="space-y-3">
      {reasoning && (
        <div>
          <h4 className="text-sm font-medium mb-1">Reasoning:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reasoning}</p>
        </div>
      )}
      {suggestions?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-1">Suggestions:</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EvaluationRunCard({
  run,
  isExpanded,
  onToggleExpand,
  onRemoveRun,
}: {
  run: EvaluationRun;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onRemoveRun: (id: string) => void;
}): React.ReactElement {
  const evaluation = run.prompt_evaluations?.[0];
  const details = (evaluation?.details || {}) as Record<string, unknown>;
  const scoreOverall = evaluation?.score_overall;

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(run.id)}>
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">Run {run.phase_run_number}</span>
            {scoreOverall !== undefined && (
              <Badge variant={scoreOverall >= 7 ? 'success' : 'warning'}>
                {scoreOverall.toFixed(1)}/10
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {run.debug_metadata?.tokens?.input || 0} tokens
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
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
        <EvaluationScoreGrid details={details} />
        <CollapsibleContent>
          <Separator className="my-3" />
          <EvaluationDetails details={details} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function EvaluationPhase({
  sessionId,
  parentRunId,
  runs,
  disabled,
  onRunComplete,
  onRemoveRun,
}: EvaluationPhaseProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [evaluationPrompt, setEvaluationPrompt] = React.useState(DEFAULT_EVALUATION_PROMPT);
  const [showPromptEditor, setShowPromptEditor] = React.useState(false);
  const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);
  const [showComparison, setShowComparison] = React.useState(false);
  const [model, setModel] = React.useState('claude-sonnet-4-20250514');

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
          model,
        }),
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
      <ShadcnCard className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5" />
            Evaluation Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a generation run to unlock evaluation
          </p>
        </CardContent>
      </ShadcnCard>
    );
  }

  return (
    <ShadcnCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Evaluation Phase
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
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
          ]}
        />

        <Collapsible open={showPromptEditor} onOpenChange={setShowPromptEditor}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-primary">
              <ChevronDown
                className={cn('h-4 w-4 mr-2 transition-transform', showPromptEditor && 'rotate-180')}
              />
              {showPromptEditor ? 'Hide Prompt' : 'Show Prompt'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            <Textarea
              value={evaluationPrompt}
              onChange={(e) => setEvaluationPrompt(e.target.value)}
              className="h-64 font-mono text-sm"
              placeholder="Enter evaluation prompt..."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEvaluationPrompt(DEFAULT_EVALUATION_PROMPT)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to default
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRunning ? 'Evaluating...' : `Run Evaluation (${runs.length + 1})`}
        </Button>

        {runs.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Evaluation Runs ({runs.length})</h3>
                {runs.length >= 2 && (
                  <Button variant="outline" size="sm" onClick={() => setShowComparison(true)}>
                    Compare All
                  </Button>
                )}
              </div>
              {runs.map((run) => (
                <EvaluationRunCard
                  key={run.id}
                  run={run}
                  isExpanded={expandedRunId === run.id}
                  onToggleExpand={(id) => setExpandedRunId(expandedRunId === id ? null : id)}
                  onRemoveRun={onRemoveRun}
                />
              ))}
            </div>
          </>
        )}

        {/* Comparison Dialog */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Compare Evaluation Runs</DialogTitle>
            </DialogHeader>
            <div className={cn('grid gap-6', runs.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
              {runs.map((run) => {
                const evaluation = run.prompt_evaluations?.[0];
                const details = (evaluation?.details || {}) as Record<string, unknown>;
                return (
                  <div key={run.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Run {run.phase_run_number}</h3>
                      {evaluation?.score_overall !== undefined && (
                        <Badge variant={evaluation.score_overall >= 7 ? 'success' : 'warning'}>
                          {evaluation.score_overall.toFixed(1)}/10
                        </Badge>
                      )}
                    </div>
                    <EvaluationScoreGrid details={details} />
                    <Separator />
                    <EvaluationDetails details={details} />
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </ShadcnCard>
  );
}
