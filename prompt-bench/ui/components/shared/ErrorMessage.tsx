import React from 'react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps): React.ReactNode {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded p-4 shadow-lg z-50">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-red-900">Error</div>
          <div className="text-sm text-red-700 mt-1">{message}</div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 ml-4"
        >
          ×
        </button>
      </div>
    </div>
  );
}