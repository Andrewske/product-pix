import * as React from 'react';
import { Alert, AlertTitle, AlertDescription, cn } from '../primitives';
import { X, AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorMessage({
  message,
  onDismiss,
}: ErrorMessageProps): React.ReactNode {
  if (!message) return null;

  return (
    <Alert
      variant="destructive"
      className={cn(
        'fixed top-4 right-4 max-w-md shadow-lg z-50',
        'animate-in fade-in slide-in-from-top-2 duration-300'
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="pr-8">{message}</AlertDescription>
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          'absolute top-3 right-3 rounded-sm opacity-70',
          'ring-offset-background transition-opacity hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </Alert>
  );
}
