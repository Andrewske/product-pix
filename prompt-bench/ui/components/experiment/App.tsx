import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shadcn';
import { ExperimentRunner } from './ExperimentRunner';
import { ResultsBrowser } from './ResultsBrowser';

export function App(): React.ReactElement {
  const [view, setView] = React.useState<'runner' | 'results'>(
    window.location.pathname === '/results' ? 'results' : 'runner'
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newView = value as 'runner' | 'results';
    setView(newView);
    window.history.pushState({}, '', newView === 'results' ? '/results' : '/');
  };

  // Listen to popstate for browser back/forward
  React.useEffect(() => {
    const handlePopState = () => {
      setView(window.location.pathname === '/results' ? 'results' : 'runner');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Prompt Bench</h1>

        <Tabs value={view} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="runner">Experiment Runner</TabsTrigger>
            <TabsTrigger value="results">Results Browser</TabsTrigger>
          </TabsList>

          <TabsContent value="runner" className="mt-0">
            <ExperimentRunner />
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <ResultsBrowser />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
