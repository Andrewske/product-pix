import * as React from 'react';
import { Button, cn } from '../primitives';
import { ArrowLeft, Copy, Sparkles } from 'lucide-react';

interface SessionHeaderProps {
  sessionId: string | null;
  onCopyContext?: () => void;
}

export function SessionHeader({
  sessionId,
  onCopyContext,
}: SessionHeaderProps): React.ReactElement {
  const handleBackClick = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2">
           <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight">Prompt Notebook</h1>
        </div>
        {sessionId && (
          <p className="text-sm text-muted-foreground mt-1 font-mono pl-[52px]">
            {sessionId}
          </p>
        )}
      </div>
      <div className="flex gap-3 pl-[52px] md:pl-0">
        {onCopyContext && (
          <Button variant="outline" size="sm" onClick={onCopyContext}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Context
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
