import { createRoot } from 'react-dom/client';
import { ReviewView } from './components/review';

// Mount function that uses bundled React
const mount = (): void => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  const root = createRoot(rootElement);
  root.render(<ReviewView />);
};

// Expose mount function globally
(window as any).ReviewApp = { mount };

export default { mount };
