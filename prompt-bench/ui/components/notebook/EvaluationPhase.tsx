import * as React from 'react';
import {
  Button,
  Select,
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
import { ChevronDown, X, Loader2, ClipboardCheck, Lock, RotateCcw, Play, BarChart2, Settings2 } from 'lucide-react';
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {criteria.map((c) => {
        const score = (details[c.key] as { score?: number })?.score || 0;
        return (
          <div key={c.key} className="space-y-1.5">
            <div className="flex justify-between text-xs items-center">
              <span className="text-muted-foreground font-medium">{c.label}</span>
              <span className={cn(
                  "font-bold",
                  score >= 8 ? "text-green-500" : score >= 5 ? "text-yellow-500" : "text-red-500"
              )}>{score}/10</span>
            </div>
            <Progress value={score * 10} className="h-1.5" />
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
    <div className="space-y-4 pt-2">
      {reasoning && (
        <div className="bg-muted/30 p-3 rounded-md">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Analysis</h4>
          <p className="text-sm leading-relaxed">{reasoning}</p>
        </div>
      )}
      {suggestions?.length > 0 && (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-900/30">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Suggestions</h4>
          <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
            {suggestions.map((suggestion, idx) => (
              <li key={`sugg-${idx}`}>{suggestion}</li>
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
      <div className={cn(
          "rounded-xl border transition-all duration-300",
          isExpanded ? "border-emerald-500/50 shadow-md bg-emerald-500/5" : "border-border hover:border-emerald-500/20"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
                 <span className="font-semibold text-sm">Run {run.phase_run_number}</span>
                 <span className="text-xs text-muted-foreground">{run.debug_metadata?.tokens?.input || 0} tokens</span>
            </div>
            
            {scoreOverall !== undefined && (
               <div className={cn(
                   "px-2 py-1 rounded-md text-sm font-bold border",
                   scoreOverall >= 8 ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                   scoreOverall >= 5 ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800" :
                   "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
               )}>
                  {scoreOverall.toFixed(1)} / 10
               </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className={cn(
                  "text-muted-foreground",
                  isExpanded && "bg-background/50"
              )}>
                {isExpanded ? 'Hide Report' : 'View Report'}
                <ChevronDown
                  className={cn('h-4 w-4 ml-2 transition-transform', isExpanded && 'rotate-180')}
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
              className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CollapsibleContent>
           <div className="px-4 pb-4">
              <div className="bg-card rounded-lg p-4 border shadow-sm space-y-4">
                 <EvaluationScoreGrid details={details} />
                 <Separator />
                 <EvaluationDetails details={details} />
              </div>
           </div>
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
        setError(`Evaluation failed: ${result.error}`);
      } else {
        setError(null);
        onRunComplete(result);
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (disabled) {
    return (
      <ShadcnCard className="opacity-50 border-dashed border-2 shadow-none bg-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-muted-foreground/60">
            <Lock className="h-5 w-5" />
            Evaluation Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground/60">
            Select a generation run to unlock evaluation
          </p>
        </CardContent>
      </ShadcnCard>
    );
  }

  return (
    <ShadcnCard className="border-l-4 border-l-emerald-500/50 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            Evaluation Phase
          </CardTitle>
          <Button onClick={handleRun} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? 'Evaluating...' : 'Run Evaluation'}
            {!isRunning && <Play className="ml-2 h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                 <Select
                  label="Model"
                  value={model}
                  onChange={setModel}
                  options={[
                    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
                    { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
                  ]}
                  className="w-full"
                />
            </div>
            <div className="flex items-end justify-end pb-1">
                 <Collapsible open={showPromptEditor} onOpenChange={setShowPromptEditor} className="w-full md:w-auto">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full md:w-auto justify-between">
                         <span className="flex items-center">
                            <Settings2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {showPromptEditor ? 'Hide Prompt' : 'Customize Prompt'}
                         </span>
                         <ChevronDown
                            className={cn('h-4 w-4 ml-2 transition-transform text-muted-foreground', showPromptEditor && 'rotate-180')}
                         />
                      </Button>
                    </CollapsibleTrigger>
                </Collapsible>
            </div>
        </div>

        <Collapsible open={showPromptEditor} onOpenChange={setShowPromptEditor}>
             <CollapsibleContent className="mt-2 space-y-2">
               <div className="relative">
                  <Textarea
                    value={evaluationPrompt}
                    onChange={(e) => setEvaluationPrompt(e.target.value)}
                    className="h-64 font-mono text-xs resize-none bg-muted/30"
                    placeholder="Enter evaluation prompt..."
                  />
                  <div className="absolute bottom-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEvaluationPrompt(DEFAULT_EVALUATION_PROMPT)}
                        className="text-xs h-7 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background"
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Reset Default
                      </Button>
                  </div>
               </div>
            </CollapsibleContent>
        </Collapsible>

        {runs.length > 0 && (
          <div className="space-y-4 pt-4">
             <div className="flex items-center justify-between border-b pb-2">
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Evaluation History</h3>
               {runs.length >= 2 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowComparison(true)} className="h-8 text-muted-foreground">
                    <BarChart2 className="h-3 w-3 mr-1.5" />
                    Compare All
                  </Button>
                )}
             </div>
             
             <div className="grid grid-cols-1 gap-4">
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
          </div>
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
                  <div key={run.id} className="border rounded-lg p-4 space-y-3 bg-card shadow-sm">
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
