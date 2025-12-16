#!/usr/bin/env bun
import { resolve, join } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createAdminClient } from '../../src/lib/supabase/admin';
import { testCommand } from '../commands/test';
import type { ProgressCallback } from '../core/orchestrator';
import type { BatchFileMetadata, TemplateMetadata } from './types';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

Bun.serve({
  port: 3001,
  fetch(req: Request) {
    const url = new URL(req.url);

    // Route handlers
    if (url.pathname === '/') return serveHTML();
    if (url.pathname === '/results') return serveHTML(); // Same HTML, client-side routing
    if (url.pathname === '/api/batches') return handleBatches(req);
    if (url.pathname === '/api/templates') return handleTemplates(req);
    if (url.pathname === '/api/results') return handleResults(req);
    if (url.pathname === '/api/run' && req.method === 'POST') return handleRun(req);

    return new Response('Not Found', { status: 404 });
  }
});

console.log('🚀 Prompt Bench UI running at http://localhost:3001');

const serveHTML = (): Response => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Bench UI</title>
  <script src="https://cdn.tailwindcss.com"></script>
   <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body class="bg-gray-50">
  <div id="root"></div>
   <script type="module">
    const { useState, useEffect } = React;
    const { createRoot } = ReactDOM;

    // ============================================================================
    // UI Primitives (~150 LOC)
    // ============================================================================

    const Button = ({ variant = 'primary', children, disabled, ...props }) => {
      const baseStyles = 'px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
      const variants = {
        primary: 'bg-green-600 text-white hover:bg-green-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        ghost: 'bg-transparent hover:bg-gray-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      };

      return React.createElement('button', {
        className: baseStyles + ' ' + variants[variant],
        disabled,
        ...props
      }, children);
    };

    const Select = ({ label, options, value, onChange, ...props }) => {
      return React.createElement('div', { className: 'flex flex-col gap-1' },
        label && React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, label),
        React.createElement('select', {
          className: 'px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500',
          value,
          onChange: (e) => onChange(e.target.value),
          ...props
        }, options.map(opt =>
          React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
        ))
      );
    };

    const Input = ({ label, ...props }) => {
      return React.createElement('div', { className: 'flex flex-col gap-1' },
        label && React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, label),
        React.createElement('input', {
          className: 'px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500',
          ...props
        })
      );
    };

    const Card = ({ title, children, ...props }) => {
      return React.createElement('div', {
        className: 'bg-white rounded-lg shadow p-6',
        ...props
      },
        title && React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, title),
        children
      );
    };

    const Badge = ({ status, children }) => {
      const styles = {
        completed: 'bg-green-100 text-green-800',
        running: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        pending: 'bg-gray-100 text-gray-800',
      };

      return React.createElement('span', {
        className: 'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ' + (styles[status] || styles.pending)
      }, children);
    };

    const ProgressBar = ({ current, total, label, className = '' }) => {
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

      return React.createElement('div', { className: 'w-full ' + className },
        React.createElement('div', { className: 'flex justify-between mb-1' },
          React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, label || 'Progress'),
          React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, percentage + '%')
        ),
        React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2.5' },
          React.createElement('div', {
            className: 'bg-green-600 h-2.5 rounded-full transition-all duration-300',
            style: { width: percentage + '%' }
          })
        )
      );
    };

    const Table = ({ columns, data, onRowClick }) => {
      return React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', {},
              columns.map(col =>
                React.createElement('th', {
                  key: col,
                  className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                }, col)
              )
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            data.map((row, idx) =>
              React.createElement('tr', {
                key: idx,
                className: onRowClick ? 'cursor-pointer hover:bg-gray-50' : '',
                onClick: onRowClick ? () => onRowClick(row) : undefined
              },
                Object.values(row).map((cell, cellIdx) =>
                  React.createElement('td', {
                    key: cellIdx,
                    className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'
                  }, cell)
                )
              )
            )
          )
        )
      );
    };

    const ImageGrid = ({ images, columns = 3, onImageClick }) => {
      return React.createElement('div', {
        className: 'grid gap-4',
        style: { gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }
      },
        images.map((img, idx) =>
          React.createElement('div', {
            key: idx,
            className: 'relative aspect-square rounded overflow-hidden cursor-pointer hover:opacity-90',
            onClick: onImageClick ? () => onImageClick(img) : undefined
          },
            React.createElement('img', {
              src: img.url,
              alt: img.alt || 'Image ' + (idx + 1),
              className: 'w-full h-full object-cover'
            }),
            img.score && React.createElement('div', {
              className: 'absolute top-2 right-2'
            },
              React.createElement(Badge, { status: img.score >= 8 ? 'completed' : 'pending' },
                img.score.toFixed(1)
              )
            )
          )
        )
      );
    };

    const MetricsTable = ({ metrics }) => {
      return React.createElement('table', { className: 'min-w-full' },
        React.createElement('tbody', { className: 'divide-y divide-gray-200' },
          Object.entries(metrics).map(([key, value]) =>
            React.createElement('tr', { key },
              React.createElement('td', { className: 'py-2 pr-4 text-sm font-medium text-gray-700' }, key),
              React.createElement('td', { className: 'py-2 text-sm text-gray-900' }, value)
            )
          )
        )
      );
    };

    // ============================================================================
    // ExperimentRunner Component
    // ============================================================================

    const ExperimentRunner = () => {
      // Form state
      const [stage, setStage] = useState('stage1');
      const [batchFile, setBatchFile] = useState('');
      const [template, setTemplate] = useState('');
      const [label, setLabel] = useState('');

      // Data state
      const [batches, setBatches] = useState([]);
      const [templates, setTemplates] = useState([]);
      const [loadingBatches, setLoadingBatches] = useState(true);
      const [loadingTemplates, setLoadingTemplates] = useState(true);

      // Run state
      const [isRunning, setIsRunning] = useState(false);
      const [progress, setProgress] = useState(null);
      const [error, setError] = useState(null);
      const [recentImages, setRecentImages] = useState([]);
      const [totalCost, setTotalCost] = useState(0);
      const [reader, setReader] = useState(null);

      // Fetch batches and templates on mount
      useEffect(() => {
        fetchBatches();
        fetchTemplates();
      }, []);

      const fetchBatches = async () => {
        setLoadingBatches(true);
        try {
          const res = await fetch('/api/batches');
          const data = await res.json();
          setBatches(data.batches || []);
        } catch (err) {
          console.error('Failed to fetch batches:', err);
        } finally {
          setLoadingBatches(false);
        }
      };

      const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
          const res = await fetch('/api/templates');
          const data = await res.json();
          setTemplates(data.templates || []);
        } catch (err) {
          console.error('Failed to fetch templates:', err);
        } finally {
          setLoadingTemplates(false);
        }
      };

      const handleRun = async () => {
        if (!template || !batchFile) {
          setError('Please select both template and batch file');
          return;
        }

        setIsRunning(true);
        setError(null);
        setProgress(null);
        setRecentImages([]);
        setTotalCost(0);

        try {
          const response = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template, batchFile, label })
          });

          if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
          }

          const reader = response.body.getReader();
          setReader(reader);
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split("\\n");

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.done) {
                  setReader(null);
                  setIsRunning(false);
                  setProgress({ phase: 'complete', current: 100, total: 100, message: 'Run completed successfully!' });
                } else if (data.error) {
                  setReader(null);
                  setError(data.error);
                  setIsRunning(false);
                } else {
                  setProgress(data);
                }
                } catch (parseErr) {
                  console.error('Failed to parse SSE data:', parseErr);
                }
              }
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setReader(null);
          setError(message);
          setIsRunning(false);
        }
      };

      const handleCancel = () => {
        if (reader) {
          reader.cancel();
          setReader(null);
          setIsRunning(false);
          setProgress(null);
          setError('Run cancelled by user');
        }
      };

      const handleQuickStart = (preset) => {
        if (preset === 'stage1') {
          setStage('stage1');
          setBatchFile('prompt-bench/fixtures/stage1-batch.json');
          setTemplate('ecommerce-base');
        } else if (preset === 'stage2-all') {
          setStage('stage2');
          // Note: Would need to run 3 separate runs for each strategy
          alert('Run all Stage 2 strategies sequentially (to be implemented)');
        }
      };

      // Render
      return React.createElement('div', { className: 'max-w-6xl mx-auto p-8 space-y-6' },
        // Header
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 'Experiment Runner'),

        // Quick Start Section
        React.createElement(Card, { title: 'Quick Start' },
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement(Button, {
              variant: 'secondary',
              onClick: () => handleQuickStart('stage1')
            }, 'Run Stage 1'),
            React.createElement(Button, {
              variant: 'secondary',
              onClick: () => handleQuickStart('stage2-all')
            }, 'Run All Stage 2 Strategies')
          )
        ),

        // Configuration Section
        React.createElement(Card, { title: 'Configure Experiment' },
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement(Select, {
              label: 'Stage',
              value: stage,
              onChange: setStage,
              options: [
                { value: 'stage1', label: 'Stage 1 - Single vs Multi Input' },
                { value: 'stage2', label: 'Stage 2 - Strategy Comparison' },
                { value: 'stage3', label: 'Stage 3 - Context Strategy' }
              ]
            }),
            React.createElement(Select, {
              label: 'Batch File',
              value: batchFile,
              onChange: setBatchFile,
              options: loadingBatches
                ? [{ value: '', label: 'Loading batches...' }]
                : [{ value: '', label: '-- Select batch file --' }, ...batches.map(b => ({ value: b.filename, label: b.label + ' (' + b.testCount + ' tests)' }))]
            }),
            React.createElement(Select, {
              label: 'Template',
              value: template,
              onChange: setTemplate,
              options: loadingTemplates
                ? [{ value: '', label: 'Loading templates...' }]
                : [{ value: '', label: '-- Select template --' }, ...templates.map(t => ({ value: t.slug, label: t.slug }))]
            }),
            React.createElement(Input, {
              label: 'Label (optional)',
              value: label,
              onChange: (e) => setLabel(e.target.value),
              placeholder: 'Auto-generated if empty'
            })
          ),
          React.createElement('div', { className: 'mt-4' },
            React.createElement(Button, {
              onClick: handleRun,
              disabled: isRunning || !template || !batchFile
            }, isRunning ? 'Running...' : 'Run Experiment')
          )
        ),

        // Progress Section
        isRunning && progress && React.createElement(Card, { title: 'Progress' },
          React.createElement(ProgressBar, {
            current: progress.current,
            total: progress.total,
            label: progress.message
          }),
          React.createElement('div', { className: 'mt-4 text-sm text-gray-600' },
            'Phase: ' + progress.phase + ' | ' + progress.current + '/' + progress.total
          ),
          React.createElement('div', { className: 'text-sm text-gray-600 mt-2' },
            'Estimated cost: $' + totalCost.toFixed(4)
          ),
          React.createElement('div', { className: 'mt-4' },
            React.createElement(Button, {
              variant: 'danger',
              onClick: handleCancel
            }, 'Cancel Run')
          )
        ),

        // Error Section
        error && React.createElement(Card, {},
          React.createElement('div', { className: 'text-red-600' },
            React.createElement('strong', {}, 'Error: '),
            error
          )
        ),

        // Success Section
        !isRunning && progress?.phase === 'complete' && React.createElement(Card, { title: 'Run Complete' },
          React.createElement('p', { className: 'text-green-600 mb-4' }, '✓ Experiment completed successfully!'),
          React.createElement(Button, {
            onClick: () => window.location.href = '/results'
          }, 'View Results')
        )
      );
    };

    // ============================================================================
    // ResultsBrowser Component
    // ============================================================================

    const ResultsBrowser = () => {
      const [results, setResults] = useState([]);
      const [loading, setLoading] = useState(true);
      const [expandedRow, setExpandedRow] = useState(null);

      // Filters
      const [labelFilter, setLabelFilter] = useState('');
      const [minScoreFilter, setMinScoreFilter] = useState('');

      useEffect(() => {
        fetchResults();
      }, [labelFilter, minScoreFilter]);

      const fetchResults = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (labelFilter) params.set('label', labelFilter);
          if (minScoreFilter) params.set('minScore', minScoreFilter);

          const res = await fetch('/api/results?' + params);
          const data = await res.json();
          setResults(data.results || []);
        } catch (err) {
          console.error('Failed to fetch results:', err);
        } finally {
          setLoading(false);
        }
      };

      const toggleRow = (batchLabel) => {
        setExpandedRow(expandedRow === batchLabel ? null : batchLabel);
      };

      return React.createElement('div', { className: 'max-w-7xl mx-auto p-8 space-y-6' },
        // Header
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 'Results Browser'),
          React.createElement(Button, {
            variant: 'secondary',
            onClick: () => window.location.href = '/'
          }, '← Back to Runner')
        ),

        // Filters
        React.createElement(Card, { title: 'Filters' },
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
            React.createElement(Input, {
              label: 'Batch Label',
              value: labelFilter,
              onChange: (e) => setLabelFilter(e.target.value),
              placeholder: 'Filter by label...'
            }),
            React.createElement(Input, {
              label: 'Min Score',
              type: 'number',
              step: '0.1',
              value: minScoreFilter,
              onChange: (e) => setMinScoreFilter(e.target.value),
              placeholder: '0.0 - 10.0'
            }),
            React.createElement('div', { className: 'flex items-end' },
              React.createElement(Button, {
                variant: 'secondary',
                onClick: () => {
                  setLabelFilter('');
                  setMinScoreFilter('');
                }
              }, 'Clear Filters')
            )
          )
        ),

        // Results Table
        React.createElement(Card, { title: 'Results (' + results.length + ')' },
          loading ? React.createElement('p', { className: 'text-gray-500' }, 'Loading...') :
          results.length === 0 ? React.createElement('div', { className: 'text-center py-12' },
            React.createElement('p', { className: 'text-gray-500 text-lg mb-4' }, '📊 No experiment results yet'),
            React.createElement('p', { className: 'text-gray-400 mb-6' }, 'Run your first experiment to see results here'),
            React.createElement(Button, {
              onClick: () => window.location.href = '/'
            }, 'Go to Experiment Runner')
          ) :
          React.createElement('div', { className: 'space-y-4' },
            results.map(result =>
              React.createElement('div', { key: result.batchLabel },
                // Row header
                React.createElement('div', {
                  className: 'flex items-center justify-between p-4 bg-gray-50 rounded cursor-pointer hover:bg-gray-100',
                  onClick: () => toggleRow(result.batchLabel)
                },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', { className: 'font-medium' }, result.batchLabel),
                    React.createElement('div', { className: 'text-sm text-gray-500' },
                      result.stats.count + ' tests | Mean Score: ' + result.stats.meanScore.toFixed(2) + ' | Cost: $' + result.stats.totalCost.toFixed(4)
                    )
                  ),
                  React.createElement('span', { className: 'text-gray-400' },
                    expandedRow === result.batchLabel ? '▼' : '▶'
                  )
                ),

                // Expanded comparison view
                expandedRow === result.batchLabel && React.createElement(ComparisonView, { data: result })
              )
            )
          )
        )
      );
    };

    // ============================================================================
    // ComparisonView Component
    // ============================================================================

    const ComparisonView = ({ data }) => {
      // Group tests by collection (if applicable)
      const images = data.tests
        .filter(t => t.image_url)
        .map(t => ({
          url: t.image_url,
          score: t.prompt_evaluations?.[0]?.score_overall,
          details: t.prompt_evaluations?.[0]?.details
        }));

      // Calculate aggregate metrics
      const scores = data.tests
        .map(t => t.prompt_evaluations?.[0]?.score_overall)
        .filter(s => s !== undefined);

      const avgConsistency = scores.length > 0
        ? data.tests.reduce((sum, t) => sum + (t.prompt_evaluations?.[0]?.details?.consistency || 0), 0) / data.tests.length
        : 0;

      const avgVariety = scores.length > 0
        ? data.tests.reduce((sum, t) => sum + (t.prompt_evaluations?.[0]?.details?.variety || 0), 0) / data.tests.length
        : 0;

      const avgPlausibility = scores.length > 0
        ? data.tests.reduce((sum, t) => sum + (t.prompt_evaluations?.[0]?.details?.physicalPlausibility || 0), 0) / data.tests.length
        : 0;

      return React.createElement('div', { className: 'p-4 border-t space-y-4' },
        // Metrics table
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          React.createElement('div', {},
            React.createElement('h3', { className: 'font-semibold mb-2' }, 'Collection Metrics'),
            React.createElement(MetricsTable, {
              metrics: {
                'Consistency': avgConsistency > 0 ? avgConsistency.toFixed(2) : 'N/A',
                'Variety': avgVariety > 0 ? avgVariety.toFixed(2) : 'N/A',
                'Physical Plausibility': avgPlausibility > 0 ? avgPlausibility.toFixed(2) : 'N/A',
                'Mean Score': data.stats.meanScore.toFixed(2),
              }
            })
          ),
          React.createElement('div', {},
            React.createElement('h3', { className: 'font-semibold mb-2' }, 'Summary'),
            React.createElement(MetricsTable, {
              metrics: {
                'Total Tests': data.stats.count,
                'Total Cost': '$' + data.stats.totalCost.toFixed(4),
                'Avg Cost per Test': '$' + (data.stats.totalCost / data.stats.count).toFixed(4),
              }
            })
          )
        ),

        // Image grid
        React.createElement('div', {},
          React.createElement('h3', { className: 'font-semibold mb-2' }, 'Generated Images'),
          images.length > 0
            ? React.createElement(ImageGrid, {
                images,
                columns: 5,
                onImageClick: (img) => window.open(img.url, '_blank')
              })
            : React.createElement('p', { className: 'text-gray-500' }, 'No images available')
        )
      );
    };

    const TestComponents = () => {
      const [value, setValue] = useState('option1');

      return React.createElement('div', { className: 'p-8 space-y-8' },
        React.createElement(Card, { title: 'Buttons' },
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement(Button, { variant: 'primary' }, 'Primary'),
            React.createElement(Button, { variant: 'secondary' }, 'Secondary'),
            React.createElement(Button, { variant: 'ghost' }, 'Ghost'),
            React.createElement(Button, { variant: 'danger' }, 'Danger'),
            React.createElement(Button, { disabled: true }, 'Disabled')
          )
        ),
        React.createElement(Card, { title: 'Form Inputs' },
          React.createElement(Select, {
            label: 'Select Option',
            options: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' }
            ],
            value,
            onChange: setValue
          }),
          React.createElement(Input, { label: 'Text Input', placeholder: 'Enter text...' })
        ),
        React.createElement(Card, { title: 'Progress' },
          React.createElement(ProgressBar, { current: 7, total: 10, label: 'Processing...' })
        ),
        React.createElement(Card, { title: 'Badges' },
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement(Badge, { status: 'completed' }, 'Completed'),
            React.createElement(Badge, { status: 'running' }, 'Running'),
            React.createElement(Badge, { status: 'failed' }, 'Failed'),
            React.createElement(Badge, { status: 'pending' }, 'Pending')
          )
        )
      );
    };

    // Error boundary component
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      render() {
        if (this.state.hasError) {
          return React.createElement('div', { className: 'p-8' },
            React.createElement(Card, { title: 'Something went wrong' },
              React.createElement('div', { className: 'text-red-600 mb-4' },
                this.state.error.message
              ),
              React.createElement(Button, {
                onClick: () => window.location.reload()
              }, 'Reload Page')
            )
          );
        }
        return this.props.children;
      }
    }

    // Main app component
    const App = () => {
      const [view, setView] = useState(
        window.location.pathname === '/results' ? 'results' : 'runner'
      );

      // Listen to popstate for browser back/forward
      useEffect(() => {
        const handlePopState = () => {
          setView(window.location.pathname === '/results' ? 'results' : 'runner');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
      }, []);

      return React.createElement('div', {},
        // Nav header
        React.createElement('nav', { className: 'bg-white border-b' },
          React.createElement('div', { className: 'max-w-7xl mx-auto px-8 py-4' },
            React.createElement('div', { className: 'flex gap-6' },
              React.createElement('button', {
                className: 'font-medium ' + (view === 'runner' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'),
                onClick: () => {
                  window.history.pushState({}, '', '/');
                  setView('runner');
                }
              }, 'Experiment Runner'),
              React.createElement('button', {
                className: 'font-medium ' + (view === 'results' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'),
                onClick: () => {
                  window.history.pushState({}, '', '/results');
                  setView('results');
                }
              }, 'Results Browser')
            )
          )
        ),

        // Main content
        view === 'runner'
          ? React.createElement(ExperimentRunner)
          : React.createElement(ResultsBrowser)
      );
    };

    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(ErrorBoundary, {}, React.createElement(App)));
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
};

const handleBatches = async (req: Request): Promise<Response> => {
  try {
    const fixturesDir = resolve(process.cwd(), 'prompt-bench/fixtures');
    const files = readdirSync(fixturesDir).filter(f => f.endsWith('.json'));

    const batches: BatchFileMetadata[] = files.map(filename => {
      const fullPath = join(fixturesDir, filename);
      const content = readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);

      return {
        filename,
        label: parsed.label || filename.replace('.json', ''),
        description: parsed.description,
        testCount: parsed.tests?.length || 0,
      };
    });

    return Response.json({ batches });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load batches: ${message}` }, { status: 500 });
  }
};

const handleTemplates = async (req: Request): Promise<Response> => {
  try {
    const supabase = createAdminClient();

    const { data: templates, error } = await supabase
      .from('prompt_templates')
      .select('slug, version, status')
      .order('slug', { ascending: true })
      .order('version', { ascending: false });

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by slug, keeping only latest version per slug
    const uniqueTemplates = templates?.reduce((acc, template) => {
      if (!acc.find(t => t.slug === template.slug)) {
        acc.push(template);
      }
      return acc;
    }, [] as TemplateMetadata[]) || [];

    return Response.json({ templates: uniqueTemplates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load templates: ${message}` }, { status: 500 });
  }
};

const handleResults = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const label = url.searchParams.get('label');
    const minScore = url.searchParams.get('minScore');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const supabase = createAdminClient();

    let query = supabase
      .from('prompt_tests')
      .select(`
        id,
        batch_label,
        template_id,
        status,
        image_url,
        created_at,
        cost_usd,
        prompt_evaluations (
          score_overall,
          details
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Apply filters
    if (label) query = query.eq('batch_label', label);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: tests, error } = await query;

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by batch_label and calculate stats
    type TestRecord = NonNullable<typeof tests>[number];
    interface GroupedResult {
      batchLabel: string;
      tests: TestRecord[];
      stats: { count: number; meanScore: number; totalCost: number };
    }

    const grouped = (tests || []).reduce<Record<string, GroupedResult>>((acc, test) => {
      const label = test.batch_label || 'unlabeled';

      if (!acc[label]) {
        acc[label] = {
          batchLabel: label,
          tests: [],
          stats: { count: 0, meanScore: 0, totalCost: 0 },
        };
      }

      acc[label].tests.push(test);
      acc[label].stats.count++;
      acc[label].stats.totalCost += test.cost_usd || 0;

      const evaluation = test.prompt_evaluations?.[0];
      if (evaluation) {
        acc[label].stats.meanScore += evaluation.score_overall;
      }

      return acc;
    }, {});

    // Calculate mean scores
    Object.values(grouped).forEach((group) => {
      if (group.stats.count > 0) {
        group.stats.meanScore = group.stats.meanScore / group.stats.count;
      }
    });

    // Filter by minScore if provided
    let results: GroupedResult[] = Object.values(grouped);
    if (minScore) {
      const minScoreNum = parseFloat(minScore);
      results = results.filter((r) => r.stats.meanScore >= minScoreNum);
    }

    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load results: ${message}` }, { status: 500 });
  }
};

const createSSERunStream = (template: string, batchFile: string, label?: string): ReadableStream => {
  return new ReadableStream({
    async start(controller) {
      // Progress callback that writes to SSE stream
      const onProgress: ProgressCallback = (
        phase: string,
        current: number,
        total: number,
        message: string
      ) => {
        const data = JSON.stringify({
          phase,
          current,
          total,
          message,
          timestamp: Date.now(),
        });
        controller.enqueue(`data: ${data}\n\n`);
      };

      try {
        // Build CLI args
        const args = ['--template', template, '--batch', batchFile];
        if (label) args.push('--label', label);

        // Execute test command with progress callback
        await testCommand(args, onProgress);

        // Send completion event
        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(`data: ${JSON.stringify({ error: message })}\n\n`);
      } finally {
        controller.close();
      }
    },
  });
};

const handleRun = async (req: Request): Promise<Response> => {
  let body: { template?: string; batchFile?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  try {
    const { template, batchFile, label } = body;

    // Validate required fields
    if (!template || !batchFile) {
      return Response.json(
        { error: 'Missing required fields: template, batchFile' },
        { status: 400 }
      );
    }

    const stream = createSSERunStream(template, batchFile, label);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to start run: ${message}` }, { status: 500 });
  }
};