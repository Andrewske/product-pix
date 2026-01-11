import * as React from 'react';
import { Badge, Separator, cn } from '../primitives';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../shadcn';
import { ChevronDown } from 'lucide-react';

interface ScoreComparisonProps {
  humanScore: number;
  llmScore: number;
  llmDetails: Record<string, unknown>;
}

export function ScoreComparison({ humanScore, llmScore, llmDetails }: ScoreComparisonProps): React.ReactElement {
  const [showDetails, setShowDetails] = React.useState(false);
  const delta = humanScore - llmScore;
  const reasoning = llmDetails.reasoning as string | undefined;

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    if (score >= 5) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
  };

  const getDeltaColor = (delta: number): string => {
    if (delta > 0) return 'text-green-600 dark:text-green-400';
    if (delta < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your Rating</p>
          <div className={cn('px-3 py-2 rounded-md text-center font-bold border', getScoreColor(humanScore))}>
            {humanScore}/10
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">AI Rating</p>
          <div className={cn('px-3 py-2 rounded-md text-center font-bold border', getScoreColor(llmScore))}>
            {llmScore.toFixed(1)}/10
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Difference</p>
        <p className={cn('text-lg font-bold', getDeltaColor(delta))}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
        </p>
      </div>

      {reasoning && (
        <>
          <Separator />
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground">
              <span>AI Reasoning</span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-muted/30 p-3 rounded-md text-sm leading-relaxed">
                {reasoning}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
