import * as React from 'react';
import { Alert, AlertTitle, AlertDescription } from '../primitives';
import { AlertTriangle, Terminal } from 'lucide-react';

export function FixturesEmptyState(): React.ReactElement {
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-400">
        No Fixture Images Found
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-amber-800 dark:text-amber-300 mb-4">
          Fixture images must be synced from the filesystem before you can use
          the notebook.
        </p>
        <div className="flex items-center gap-2 bg-card border rounded-md p-3 mb-4">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <code className="text-sm font-mono">bun bench sync</code>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This command uploads images from{' '}
          <code className="text-xs">prompt-bench/fixtures/images/</code> to R2
          and saves references to the database.
        </p>
      </AlertDescription>
    </Alert>
  );
}
