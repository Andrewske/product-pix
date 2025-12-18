import { createRoot } from 'react-dom/client';
import { NotebookView } from './components/notebook';

// Mount function that uses bundled React
const mount = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  const root = createRoot(rootElement);
  root.render(<NotebookView />);
};

// Expose mount function globally
(window as any).NotebookApp = { mount };

export default { mount };