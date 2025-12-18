import React, { useState } from 'react';
import { ExperimentRunner } from './ExperimentRunner';
import { ResultsBrowser } from './ResultsBrowser';

export function App(): React.ReactElement {
  const [view, setView] = useState<'runner' | 'results'>(
    window.location.pathname === '/results' ? 'results' : 'runner'
  );

  // Listen to popstate for browser back/forward
  React.useEffect(() => {
    const handlePopState = () => {
      setView(window.location.pathname === '/results' ? 'results' : 'runner');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Prompt Bench</h1>

          <div className="flex gap-2">
            <button
              type="button"
              className={`px-4 py-2 rounded font-medium transition-colors ${
                view === 'runner'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
              onClick={() => {
                window.history.pushState({}, '', '/');
                setView('runner');
              }}
            >
              Experiment Runner
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded font-medium transition-colors ${
                view === 'results'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
              onClick={() => {
                window.history.pushState({}, '', '/results');
                setView('results');
              }}
            >
              Results Browser
            </button>
          </div>
        </div>

        {view === 'runner' ? <ExperimentRunner /> : <ResultsBrowser />}
      </div>
    </div>
  );
}