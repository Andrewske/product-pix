import React from 'react';
import { Button } from '../primitives';

interface SessionHeaderProps {
  sessionId: string | null;
}

export function SessionHeader({ sessionId }: SessionHeaderProps): React.ReactElement {
  const handleBackClick = () => {
    window.location.href = '/';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notebook</h1>
          {sessionId && <p className="text-sm text-gray-500 mt-1">Session: {sessionId}</p>}
        </div>
        <Button
          variant="ghost"
          onClick={handleBackClick}
        >
          ← Back
        </Button>
      </div>
    </div>
  );
}