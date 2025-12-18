import * as React from 'react';
import {
  Button,
  ShadcnCard,
  CardContent,
  cn,
} from '../primitives';
import { ArrowLeft, Copy } from 'lucide-react';

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
    <ShadcnCard className="mb-6">
      <CardContent className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Notebook</h1>
            {sessionId && (
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                Session: {sessionId}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {onCopyContext && (
              <Button variant="outline" size="sm" onClick={onCopyContext}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Context
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </CardContent>
    </ShadcnCard>
  );
}
