import { createRoot } from 'react-dom/client';
import { App } from './components/experiment';

// Mount function that uses bundled React
const mount = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  const root = createRoot(rootElement);
  root.render(<App />);
};

// Expose mount function globally
(window as any).ExperimentApp = { mount };

export default { mount };