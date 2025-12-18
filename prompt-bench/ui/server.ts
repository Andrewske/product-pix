#!/usr/bin/env bun
import { resolve, join, relative } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createAdminClient } from '../../src/lib/supabase/admin';
import { testCommand } from '../commands/test';
import { logger } from '../core/logger';
import { runAnalysisPhase, runGenerationPhase, runEvaluationPhase } from '../core/notebook-orchestrator';
import { isOk } from '../core/errors';
import type { AnalysisResult, GenerationResult, EvaluationResult } from '../core/notebook-orchestrator';
import type { ProgressCallback } from '../core/orchestrator';
import type { BatchFileMetadata, TemplateMetadata } from './types';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

Bun.serve({
  port: 8181,
  idleTimeout: 255, // 4.25 minutes max for Bun.serve, for long-running prompt bench operations
  fetch(req: Request) {
    const url = new URL(req.url);

    // Route handlers
    if (url.pathname === '/') return serveHTML();
    if (url.pathname === '/results') return serveHTML(); // Same HTML, client-side routing
    if (url.pathname === '/notebook') return serveNotebookHTML();
    if (url.pathname === '/api/batches') return handleBatches(req);
    if (url.pathname === '/api/templates') return handleTemplates(req);
    if (url.pathname === '/api/results') return handleResults(req);
    if (url.pathname === '/api/run' && req.method === 'POST') return handleRun(req);
    if (url.pathname === '/api/notebook/fixtures') return handleNotebookFixtures(req);
    if (url.pathname === '/api/notebook/analyze' && req.method === 'POST') return handleNotebookAnalyze(req);
    if (url.pathname === '/api/notebook/generate' && req.method === 'POST') return handleNotebookGenerate(req);
    if (url.pathname === '/api/notebook/evaluate' && req.method === 'POST') return handleNotebookEvaluate(req);
    if (url.pathname.match(/^\/api\/notebook\/session\/[^/]+$/)) return handleNotebookSession(req);

    return new Response('Not Found', { status: 404 });
  }
});

console.log('🚀 Prompt Bench UI running at http://localhost:8181');

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

    const DEFAULT_EVALUATION_PROMPT = 'You are evaluating an AI-generated product photo for e-commerce use.\n\nScore each criterion from 1-10 (1 = poor, 10 = excellent):\n\n1. **Composition** (1-10): Product placement, visual balance, appropriate fill percentage (product should fill 60-90% of frame)\n\n2. **Lighting** (1-10): Even illumination, no harsh shadows, appropriate highlights, professional studio quality\n\n3. **Product Visibility** (1-10): Sharp focus on product, all features clearly visible, no obscured details\n\n4. **Background Quality** (1-10): Clean, distraction-free background, appropriate for e-commerce\n\n5. **Professional Quality** (1-10): Overall marketplace-ready appearance, color accuracy, no artifacts\n\n6. **Prompt Adherence** (1-10): How well the image matches the original prompt request\n\nCalculate an overall score as the weighted average:\n- Composition: 15%\n- Lighting: 20%\n- Product Visibility: 25%\n- Background Quality: 15%\n- Professional Quality: 15%\n- Prompt Adherence: 10%\n\nReturn ONLY valid JSON in this exact format:\n{\n  "overall": 8.5,\n  "composition": 8,\n  "lighting": 9,\n  "productVisibility": 8,\n  "backgroundQuality": 9,\n  "professionalQuality": 8,\n  "promptAdherence": 9,\n  "reasoning": "Brief explanation of scores...",\n  "suggestions": ["Suggestion 1", "Suggestion 2"]\n}';

    // ============================================================================
    // Notebook Components
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
              }, 'Results Browser'),
              React.createElement('button', {
                className: 'font-medium text-gray-600 hover:text-gray-900',
                onClick: () => {
                  window.location.href = '/notebook';
                }
              }, 'Notebook')
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

const serveNotebookHTML = (): Response => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notebook - Prompt Bench</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body class="bg-gray-50">
  <div id="root"></div>
  <script type="module">
    const { useState, useEffect } = React;
    const { createRoot } = ReactDOM;

    const DEFAULT_EVALUATION_PROMPT = 'You are evaluating an AI-generated product photo for e-commerce use.\\n\\nScore each criterion from 1-10 (1 = poor, 10 = excellent):\\n\\n1. **Composition** (1-10): Product placement, visual balance, appropriate fill percentage (product should fill 60-90% of frame)\\n\\n2. **Lighting** (1-10): Even illumination, no harsh shadows, appropriate highlights, professional studio quality\\n\\n3. **Product Visibility** (1-10): Sharp focus on product, all features clearly visible, no obscured details\\n\\n4. **Background Quality** (1-10): Clean, distraction-free background, appropriate for e-commerce\\n\\n5. **Professional Quality** (1-10): Overall marketplace-ready appearance, color accuracy, no artifacts\\n\\n6. **Prompt Adherence** (1-10): How well the image matches the original prompt request\\n\\nCalculate an overall score as the weighted average:\\n- Composition: 15%\\n- Lighting: 20%\\n- Product Visibility: 25%\\n- Background Quality: 15%\\n- Professional Quality: 15%\\n- Prompt Adherence: 10%\\n\\nReturn ONLY valid JSON in this exact format:\\n{\\n  "overall": 8.5,\\n  "composition": 8,\\n  "lighting": 9,\\n  "productVisibility": 8,\\n  "backgroundQuality": 9,\\n  "professionalQuality": 8,\\n  "promptAdherence": 9,\\n  "reasoning": "Brief explanation of scores...",\\n  "suggestions": ["Suggestion 1", "Suggestion 2"]\\n}';

    // ============================================================================
    // Notebook Components
    // ============================================================================

    const ErrorMessage = ({ message, onDismiss }) => {
      if (!message) return null;

      return React.createElement('div', { className: 'fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded p-4 shadow-lg z-50' },
        React.createElement('div', { className: 'flex justify-between items-start' },
          React.createElement('div', {},
            React.createElement('div', { className: 'font-semibold text-red-900' }, 'Error'),
            React.createElement('div', { className: 'text-sm text-red-700 mt-1' }, message)
          ),
          React.createElement('button', {
            onClick: onDismiss,
            className: 'text-red-500 hover:text-red-700 ml-4'
          }, '×')
        )
      );
    };

    const fetchWithTimeout = async (url, options, timeout = 120000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out after 2 minutes');
        }
        throw err;
      }
    };

    // SessionStorage schema (lines 837-900)
    interface NotebookSessionState {
      version: 1;
      sessionId: string;
      timestamp: number;
      selectedFixtureIds: string[];
      selectedAnalysisId: string | null;
      selectedGenerationId: string | null;
      analysisRuns: Array<{
        id: string;
        phase_run_number: number;
        created_at: string;
        inputs: Record<string, unknown>;
        debug_metadata: {
          thinking: string | null;
          tokens: { input: number; output: number };
          raw_prompt: string;
          raw_response: unknown;
        };
      }>;
      generationRuns: Array<{
        id: string;
        parent_run_id: string;
        phase_run_number: number;
        created_at: string;
        inputs: Record<string, unknown>;
        final_prompt: string;
        debug_metadata: {
          thinking: string | null;
          tokens: { input: number; output: number };
          image_url: string;
        };
      }>;
      evaluationRuns: Array<{
        id: string;
        parent_run_id: string;
        phase_run_number: number;
        created_at: string;
        score: number;
        criteria: Record<string, unknown>;
        reasoning: string;
      }>;
      imageCache: Array<{
        runId: string;
        r2Url: string;
        dataUrl: string;
        size: number;
        timestamp: number;
      }>;
    }

    const saveNotebookSession = (state) => {
      try {
        sessionStorage.setItem(\`notebook-\${state.sessionId}\`, JSON.stringify({
          version: 1,
          timestamp: Date.now(),
          ...state
        }));
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          // Clear image cache and retry
          state.imageCache = [];
          try {
            sessionStorage.setItem(\`notebook-\${state.sessionId}\`, JSON.stringify({
              version: 1,
              timestamp: Date.now(),
              ...state
            }));
          } catch (e2) {
            console.warn('SessionStorage unavailable, using R2 URLs only');
          }
        }
      }
    };

    const loadNotebookSession = (sessionId) => {
      try {
        const cached = sessionStorage.getItem(\`notebook-\${sessionId}\`);
        if (!cached) return null;

        const state = JSON.parse(cached);

        // Migrate old schema (only had selectedAnalysisId, selectedGenerationId)
        if (!state.version) {
          console.log('Migrating old session schema to v1');
          return {
            version: 1,
            sessionId,
            timestamp: Date.now(),
            selectedAnalysisId: state.selectedAnalysisId || null,
            selectedGenerationId: state.selectedGenerationId || null,
            selectedFixtureIds: [],
            analysisRuns: [],
            generationRuns: [],
            evaluationRuns: [],
            imageCache: []
          };
        }

        // Validate current schema
        if (state.version !== 1) {
          console.warn('Incompatible schema version, clearing cache');
          sessionStorage.removeItem(\`notebook-\${sessionId}\`);
          return null;
        }

        // Check staleness (1 hour)
        if (Date.now() - state.timestamp > 3600000) {
          console.log('Session cache stale (>1 hour), will fetch fresh data');
          return null;
        }

        // Validate required fields
        if (!state.sessionId || !Array.isArray(state.analysisRuns)) {
          console.warn('Invalid session structure, clearing cache');
          sessionStorage.removeItem(\`notebook-\${sessionId}\`);
          return null;
        }

        return state;
      } catch (e) {
        console.warn('Failed to parse SessionStorage, clearing:', e);
        sessionStorage.removeItem(\`notebook-\${sessionId}\`);
        return null;
      }
    };

    const convertImageToDataUrl = async (r2Url) => {
      const response = await fetch(r2Url);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const getCachedOrConvertImage = async (runId, r2Url, imageCache) => {
      // Check cache first
      const cached = imageCache.find(c => c.runId === runId);
      if (cached) {
        // Update timestamp for LRU
        cached.timestamp = Date.now();
        return { dataUrl: cached.dataUrl, isNew: false };
      }

      // Convert to data URL
      const dataUrl = await convertImageToDataUrl(r2Url);
      const newEntry = {
        runId,
        r2Url,
        dataUrl,
        size: dataUrl.length,
        timestamp: Date.now()
      };

      // Add to cache
      imageCache.push(newEntry);

      // LRU eviction (keep max 5)
      if (imageCache.length > 5) {
        imageCache.sort((a, b) => b.timestamp - a.timestamp);
        imageCache.splice(5); // Remove items beyond index 5
      }

      return { dataUrl, isNew: true };
    };

    const SessionHeader = ({ sessionId }) => {
      return React.createElement('div', { className: 'bg-white rounded-lg shadow p-4 mb-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('div', {},
            React.createElement('h1', { className: 'text-2xl font-bold' }, 'Notebook'),
            sessionId && React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Session: ' + sessionId)
          ),
          React.createElement('button', {
            onClick: () => window.location.href = '/',
            className: 'px-4 py-2 border rounded hover:bg-gray-50'
          }, '← Back')
        )
      );
    };

    const FixtureImageSelector = ({ fixtures, onSelect, onCancel }) => {
      const [selectedIds, setSelectedIds] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');

      const toggleImage = (imageId) => {
        setSelectedIds(prev =>
          prev.includes(imageId)
            ? prev.filter(id => id !== imageId)
            : [...prev, imageId]
        );
      };

      const filteredFixtures = Object.entries(fixtures).reduce((acc, [product, images]) => {
        const filtered = images.filter(img =>
          img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[product] = filtered;
        return acc;
      }, {});

      const selectedCount = selectedIds.length;
      const productCount = new Set(
        selectedIds.map(id => {
          for (const [product, images] of Object.entries(fixtures)) {
            if (images.some(img => img.id === id)) return product;
          }
        })
      ).size;

      return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' },
        React.createElement('div', { className: 'bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col' },
          React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Select Fixture Images'),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search images...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: 'border rounded px-3 py-2 mb-4'
          }),
          React.createElement('div', { className: 'text-sm text-gray-600 mb-4' },
            selectedCount > 0 ? (
              \`Selected: \${selectedCount} images from \${productCount} product\${productCount !== 1 ? 's' : ''} → Will create \${productCount} test\${productCount !== 1 ? 's' : ''}\`
            ) : (
              'Click images to select. Same product = 1 test with multiple images.'
            )
          ),
          React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-6' },
            Object.entries(filteredFixtures).map(([product, images]) =>
              React.createElement('div', { key: product, className: 'border rounded p-4' },
                React.createElement('h3', { className: 'font-semibold mb-3 capitalize' }, product.replace(/-/g, ' ')),
                React.createElement('div', { className: 'grid grid-cols-6 gap-2' },
                  images.map(img =>
                    React.createElement('div', {
                      key: img.id,
                      onClick: () => toggleImage(img.id),
                      className: 'cursor-pointer border-2 rounded p-1 transition ' + (
                        selectedIds.includes(img.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-400'
                      )
                    },
                      React.createElement('img', {
                        src: img.r2_url,
                        alt: img.filename,
                        className: 'w-full h-12 object-cover rounded'
                      }),
                      React.createElement('p', { className: 'text-xs mt-1 truncate text-center' }, img.filename),
                      selectedIds.includes(img.id) && React.createElement('div', {
                        className: 'absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs'
                      }, '✓')
                    )
                  )
                )
              )
            )
          ),
          React.createElement('div', { className: 'flex justify-end gap-3 mt-4 pt-4 border-t' },
            React.createElement('button', {
              onClick: onCancel,
              className: 'px-4 py-2 border rounded hover:bg-gray-50'
            }, 'Cancel'),
            React.createElement('button', {
              onClick: () => onSelect(selectedIds),
              disabled: selectedIds.length === 0,
              className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300'
            }, 'Use Selected Images')
          )
        )
      );
    };

    const AnalysisPhase = ({ sessionId, fixtureImageIds, runs, selectedRunId, onRunComplete, onSelectRun }) => {
      const [error, setError] = useState(null);
      const [isRunning, setIsRunning] = useState(false);
      const [variables, setVariables] = useState({});
      const [expandedRunId, setExpandedRunId] = useState(null);
      const [showComparison, setShowComparison] = useState(false);

      const handleRun = async () => {
        // Validate before running
        if (fixtureImageIds.length === 0) {
          setError('No fixture images selected. Please start a new session with images.');
          return;
        }

        // Validate JSON
        try {
          if (typeof variables === 'string') {
            JSON.parse(variables);
          }
        } catch (e) {
          setError('Invalid JSON in variables field');
          return;
        }

        setError(null);
        setIsRunning(true);

        try {
          const res = await fetchWithTimeout('/api/notebook/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              fixtureImageIds,
              variables,
              model: 'gemini-2.0-flash-exp',
              cacheEnabled: true
            })
          });

          const result = await res.json();

          if (result.error) {
            setError('Analysis failed: ' + result.error);
          } else {
            setError(null);
            onRunComplete(result);
            setVariables({});
          }
        } catch (err) {
          setError('Network error: ' + err.message);
        } finally {
          setIsRunning(false);
        }
      };

      return React.createElement('div', { className: 'border rounded-lg p-6 bg-white' },
        React.createElement(ErrorMessage, { message: error, onDismiss: () => setError(null) }),
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Analysis Phase'),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' },
            'Analysis Variables (optional overrides)'
          ),
          React.createElement('textarea', {
            value: JSON.stringify(variables, null, 2),
            onChange: (e) => {
              try {
                setVariables(JSON.parse(e.target.value));
              } catch {}
            },
            className: 'w-full border rounded p-2 font-mono text-sm h-24',
            placeholder: '{"key": "value"}'
          })
        ),
        React.createElement('button', {
          onClick: handleRun,
          disabled: isRunning || fixtureImageIds.length === 0,
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300'
        }, isRunning ? 'Running Analysis...' : \`Run Analysis (\${runs.length + 1})\`),
        runs.length > 0 && React.createElement('div', { className: 'mt-6 space-y-2' },
          React.createElement('h3', { className: 'font-semibold' }, \`Analysis Runs (\${runs.length})\`),
          runs.length >= 2 && React.createElement('button', {
            onClick: () => setShowComparison(true),
            className: 'mt-2 px-4 py-2 border rounded hover:bg-gray-50'
          }, \`Compare All \${runs.length} Runs\`),
          runs.map(run =>
            React.createElement('div', {
              key: run.id,
              className: 'border rounded p-3 cursor-pointer ' + (
                selectedRunId === run.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
              )
            },
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                  React.createElement('input', {
                    type: 'radio',
                    checked: selectedRunId === run.id,
                    onChange: () => onSelectRun(run.id),
                    className: 'w-4 h-4'
                  }),
                  React.createElement('div', {},
                    React.createElement('span', { className: 'font-medium' }, \`Run \${run.phase_run_number}\`),
                    React.createElement('span', { className: 'text-xs text-gray-500 ml-2' },
                      (run.debug_metadata?.tokens?.input || 0) + ' in / ' + (run.debug_metadata?.tokens?.output || 0) + ' out'
                    )
                  )
                ),
                React.createElement('button', {
                  onClick: (e) => {
                    e.stopPropagation();
                    setExpandedRunId(expandedRunId === run.id ? null : run.id);
                  },
                  className: 'text-sm text-blue-600'
                }, expandedRunId === run.id ? 'Collapse' : 'Expand')
              ),
              expandedRunId === run.id && React.createElement('div', { className: 'mt-3 pt-3 border-t' },
                React.createElement('h4', { className: 'text-sm font-semibold mb-2' }, 'Analysis Results:'),
                React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs overflow-x-auto' },
                  JSON.stringify(run.inputs, null, 2)
                )
              )
            )
          )
        ),
        selectedRunId && React.createElement('div', { className: 'mt-4 p-3 bg-green-50 border border-green-200 rounded' },
          '✓ Analysis Run ' + runs.find(r => r.id === selectedRunId)?.phase_run_number + ' selected for generation'
        ),
        showComparison && React.createElement(RunComparisonModal, {
          phase: 'analysis',
          runs: runs,
          onClose: () => setShowComparison(false)
        })
      );
    };

    const GenerationPhase = ({ sessionId, parentRunId, runs, selectedRunId, disabled, onRunComplete, onSelectRun }) => {
      const [error, setError] = useState(null);
      const [isRunning, setIsRunning] = useState(false);
      const [templateSlug, setTemplateSlug] = useState('');
      const [templates, setTemplates] = useState([]);
      const [templateData, setTemplateData] = useState({});
      const [expandedRunId, setExpandedRunId] = useState(null);
      const [showComparison, setShowComparison] = useState(false);

      useEffect(() => {
        fetch('/api/templates')
          .then(res => res.json())
          .then(data => setTemplates(data.templates || []));
      }, []);

      useEffect(() => {
        if (templateSlug) {
          const template = templates.find(t => t.slug === templateSlug);
          if (template) {
            setTemplateData(template.template_data || {});
          }
        }
      }, [templateSlug, templates]);

      const handleRun = async () => {
        // Validate template selected
        if (!templateSlug) {
          setError('Please select a template');
          return;
        }

        // Validate template JSON
        try {
          if (typeof templateData === 'string') {
            JSON.parse(templateData);
          }
        } catch (e) {
          setError('Invalid JSON in template editor');
          return;
        }

        // Validate parent run
        if (!parentRunId) {
          setError('No analysis run selected. Please select an analysis run first.');
          return;
        }

        setError(null);
        setIsRunning(true);

        try {
          const res = await fetchWithTimeout('/api/notebook/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              parentRunId,
              templateSlug,
              templateData,
              variables: {}
            })
          });

          const result = await res.json();

          if (result.error) {
            setError('Generation failed: ' + result.error);
          } else {
            setError(null);
            onRunComplete(result);
          }
        } catch (err) {
          setError('Network error: ' + err.message);
        } finally {
          setIsRunning(false);
        }
      };

      if (disabled) {
        return React.createElement('div', { className: 'border rounded-lg p-6 bg-gray-50' },
          React.createElement('h2', { className: 'text-xl font-bold mb-4 text-gray-400' }, 'Generation Phase'),
          React.createElement('p', { className: 'text-gray-500' }, 'Select an analysis run to unlock generation')
        );
      }

      return React.createElement('div', { className: 'border rounded-lg p-6 bg-white' },
        React.createElement(ErrorMessage, { message: error, onDismiss: () => setError(null) }),
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Generation Phase'),
        React.createElement('div', { className: 'space-y-4 mb-4' },
          React.createElement('div', {},
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Template'),
            React.createElement('select', {
              value: templateSlug,
              onChange: (e) => setTemplateSlug(e.target.value),
              className: 'w-full border rounded px-3 py-2'
            },
              React.createElement('option', { value: '' }, '-- Select template --'),
              templates.map(t =>
                React.createElement('option', { key: t.slug, value: t.slug }, t.slug)
              )
            )
          ),
          templateSlug && React.createElement('div', {},
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              'Template JSON (edit to customize)'
            ),
            React.createElement('textarea', {
              value: JSON.stringify(templateData, null, 2),
              onChange: (e) => {
                try {
                  setTemplateData(JSON.parse(e.target.value));
                } catch {}
              },
              className: 'w-full border rounded p-2 font-mono text-sm h-64'
            })
          )
        ),
        React.createElement('button', {
          onClick: handleRun,
          disabled: isRunning || !templateSlug,
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300'
        }, isRunning ? 'Generating...' : \`Run Generation (\${runs.length + 1})\`),
        runs.length > 0 && React.createElement('div', { className: 'mt-6 space-y-2' },
          React.createElement('h3', { className: 'font-semibold' }, \`Generation Runs (\${runs.length})\`),
          runs.length >= 2 && React.createElement('button', {
            onClick: () => setShowComparison(true),
            className: 'mt-2 px-4 py-2 border rounded hover:bg-gray-50'
          }, \`Compare All \${runs.length} Runs\`),
          runs.map(run =>
            React.createElement('div', {
              key: run.id,
              className: 'border rounded p-3 ' + (
                selectedRunId === run.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
              )
            },
              React.createElement('div', { className: 'flex justify-between items-center mb-2' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                  React.createElement('input', {
                    type: 'radio',
                    checked: selectedRunId === run.id,
                    onChange: () => onSelectRun(run.id),
                    className: 'w-4 h-4'
                  }),
                  React.createElement('span', { className: 'font-medium' }, \`Run \${run.phase_run_number}\`),
                  React.createElement('span', { className: 'text-xs text-gray-500' },
                    (run.debug_metadata?.tokens?.input || 0) + ' in / ' + (run.debug_metadata?.tokens?.output || 0) + ' out'
                  )
                ),
                React.createElement('button', {
                  onClick: () => setExpandedRunId(expandedRunId === run.id ? null : run.id),
                  className: 'text-sm text-blue-600'
                }, expandedRunId === run.id ? 'Collapse' : 'Expand')
              ),
              React.createElement('img', {
                src: run.image_url,
                alt: \`Run \${run.phase_run_number}\`,
                className: 'w-48 rounded'
              }),
              expandedRunId === run.id && run.debug_metadata?.thinking && React.createElement('div', { className: 'mt-3 pt-3 border-t' },
                React.createElement('h4', { className: 'text-sm font-semibold mb-2' }, 'Thinking:'),
                React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap' },
                  run.debug_metadata.thinking
                ),
                React.createElement('h4', { className: 'text-sm font-semibold mb-2 mt-3' }, 'Final Prompt:'),
                React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap' },
                  run.final_prompt
                )
              )
            )
          )
        ),
        showComparison && React.createElement(RunComparisonModal, {
          phase: 'generation',
          runs: runs,
          onClose: () => setShowComparison(false)
        })
      );
    };

    const EvaluationPhase = ({ sessionId, parentRunId, runs, disabled, onRunComplete }) => {
      const [error, setError] = useState(null);
      const [isRunning, setIsRunning] = useState(false);
      const [evaluationPrompt, setEvaluationPrompt] = useState(DEFAULT_EVALUATION_PROMPT);
      const [showPromptEditor, setShowPromptEditor] = useState(false);
      const [expandedRunId, setExpandedRunId] = useState(null);
      const [showComparison, setShowComparison] = useState(false);

      const handleRun = async () => {
        setError(null);
        setIsRunning(true);

        try {
          const res = await fetchWithTimeout('/api/notebook/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              parentRunId,
              evaluationPrompt: showPromptEditor ? evaluationPrompt : undefined,
              model: 'claude-sonnet-4-20250514'
            })
          });

          const result = await res.json();

          if (result.error) {
            setError('Evaluation failed: ' + result.error);
          } else {
            setError(null);
            onRunComplete(result);
          }
        } catch (err) {
          setError('Network error: ' + err.message);
        } finally {
          setIsRunning(false);
        }
      };

      if (disabled) {
        return React.createElement('div', { className: 'border rounded-lg p-6 bg-gray-50' },
          React.createElement('h2', { className: 'text-xl font-bold mb-4 text-gray-400' }, 'Evaluation Phase'),
          React.createElement('p', { className: 'text-gray-500' }, 'Select a generation run to unlock evaluation')
        );
      }

      return React.createElement('div', { className: 'border rounded-lg p-6 bg-white' },
        React.createElement(ErrorMessage, { message: error, onDismiss: () => setError(null) }),
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Evaluation Phase'),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('button', {
            onClick: () => setShowPromptEditor(!showPromptEditor),
            className: 'text-sm text-blue-600 hover:text-blue-800'
          }, showPromptEditor ? '▼ Hide evaluation criteria editor' : '▶ Customize evaluation criteria'),
          showPromptEditor && React.createElement('div', { className: 'mt-2 space-y-2' },
            React.createElement('textarea', {
              value: evaluationPrompt,
              onChange: (e) => setEvaluationPrompt(e.target.value),
              className: 'w-full border rounded p-2 font-mono text-sm h-64',
              placeholder: 'Enter evaluation prompt...'
            }),
            React.createElement('button', {
              onClick: () => setEvaluationPrompt(DEFAULT_EVALUATION_PROMPT),
              className: 'px-3 py-1 text-sm border rounded hover:bg-gray-50'
            }, 'Reset to default')
          )
        ),
        React.createElement('button', {
          onClick: handleRun,
          disabled: isRunning,
          className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300'
        }, isRunning ? 'Evaluating...' : \`Run Evaluation (\${runs.length + 1})\`),
        runs.length > 0 && React.createElement('div', { className: 'mt-6 space-y-2' },
          React.createElement('h3', { className: 'font-semibold' }, \`Evaluation Runs (\${runs.length})\`),
          runs.length >= 2 && React.createElement('button', {
            onClick: () => setShowComparison(true),
            className: 'mt-2 px-4 py-2 border rounded hover:bg-gray-50'
          }, \`Compare All \${runs.length} Runs\`),
          runs.map(run => {
            const evaluation = run.prompt_evaluations?.[0];
            const details = evaluation?.details || {};
            const scoreOverall = evaluation?.score_overall;

            return React.createElement('div', { key: run.id, className: 'border rounded p-3 border-gray-200' },
              React.createElement('div', { className: 'flex justify-between items-center mb-2' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                  React.createElement('span', { className: 'font-medium' }, \`Run \${run.phase_run_number}\`),
                  scoreOverall && React.createElement('span', { className: 'font-bold text-green-600' }, scoreOverall.toFixed(1) + '/10'),
                  React.createElement('span', { className: 'text-xs text-gray-500' },
                    (run.debug_metadata?.tokens?.input || 0) + ' tokens'
                  )
                ),
                React.createElement('button', {
                  onClick: () => setExpandedRunId(expandedRunId === run.id ? null : run.id),
                  className: 'text-sm text-blue-600'
                }, expandedRunId === run.id ? 'Collapse' : 'Expand')
              ),
              React.createElement('div', { className: 'grid grid-cols-3 gap-2' },
                React.createElement('div', { className: 'bg-gray-50 p-2 rounded text-xs' },
                  React.createElement('div', { className: 'font-medium' }, 'Composition'),
                  React.createElement('div', {}, details.composition || 'N/A')
                ),
                React.createElement('div', { className: 'bg-gray-50 p-2 rounded text-xs' },
                  React.createElement('div', { className: 'font-medium' }, 'Lighting'),
                  React.createElement('div', {}, details.lighting || 'N/A')
                ),
                React.createElement('div', { className: 'bg-gray-50 p-2 rounded text-xs' },
                  React.createElement('div', { className: 'font-medium' }, 'Product Visibility'),
                  React.createElement('div', {}, details.productVisibility || 'N/A')
                ),
                React.createElement('div', { className: 'bg-gray-50 p-2 rounded text-xs' },
                  React.createElement('div', { className: 'font-medium' }, 'Background Quality'),
                  React.createElement('div', {}, details.backgroundQuality || 'N/A')
                ),
                React.createElement('div', { className: 'bg-gray-50 p-2 rounded text-xs' },
                  React.createElement('div', { className: 'font-medium' }, 'Professional Quality'),
                  React.createElement('div', {}, details.professionalQuality || 'N/A')
                ),
                React.createElement('div', { className: 'bg-gray-50 p-2 rounded text-xs' },
                  React.createElement('div', { className: 'font-medium' }, 'Prompt Adherence'),
                  React.createElement('div', {}, details.promptAdherence || 'N/A')
                )
              ),
              expandedRunId === run.id && React.createElement('div', { className: 'mt-3 pt-3 border-t space-y-2' },
                details.reasoning && React.createElement('div', {},
                  React.createElement('h4', { className: 'text-sm font-semibold mb-1' }, 'Reasoning:'),
                  React.createElement('p', { className: 'text-sm text-gray-700 whitespace-pre-wrap' }, details.reasoning)
                ),
                details.suggestions && details.suggestions.length > 0 && React.createElement('div', {},
                  React.createElement('h4', { className: 'text-sm font-semibold mb-1' }, 'Suggestions:'),
                  React.createElement('ul', { className: 'text-sm text-gray-700 list-disc list-inside' },
                    details.suggestions.map((suggestion, idx) =>
                      React.createElement('li', { key: idx }, suggestion)
                    )
                  )
                )
              )
            );
          })
        ),
        showComparison && React.createElement(RunComparisonModal, {
          phase: 'evaluation',
          runs: runs,
          onClose: () => setShowComparison(false)
        })
      );
    };

    const RunComparisonModal = ({ phase, runs, onClose }) => {
      if (runs.length < 2) return null;

      return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' },
        React.createElement('div', { className: 'bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto' },
          React.createElement('div', { className: 'flex justify-between items-center mb-6' },
            React.createElement('h2', { className: 'text-2xl font-bold' }, \`Compare \${phase.charAt(0).toUpperCase() + phase.slice(1)} Runs\`),
            React.createElement('button', {
              onClick: onClose,
              className: 'text-gray-500 hover:text-gray-700 text-2xl'
            }, '×')
          ),

          React.createElement('div', {
            className: 'grid gap-6',
            style: { gridTemplateColumns: \`repeat(\${runs.length}, 1fr)\` }
          },
            runs.map(run =>
              React.createElement('div', { key: run.id, className: 'border rounded p-4' },
                React.createElement('h3', { className: 'font-bold mb-3' }, \`Run \${run.phase_run_number}\`),

                // Tokens
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('div', { className: 'text-sm text-gray-600' }, 'Tokens'),
                  React.createElement('div', { className: 'text-xs' },
                    \`In: \${run.debug_metadata?.tokens?.input || 0} / Out: \${run.debug_metadata?.tokens?.output || 0}\`
                  )
                ),

                // Phase-specific content
                phase === 'analysis' && React.createElement('div', {},
                  React.createElement('div', { className: 'text-sm font-semibold mb-2' }, 'Analysis Results:'),
                  React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64' },
                    JSON.stringify(run.inputs, null, 2)
                  )
                ),

                phase === 'generation' && React.createElement('div', {},
                  React.createElement('img', {
                    src: run.image_url,
                    alt: \`Run \${run.phase_run_number}\`,
                    className: 'w-full rounded mb-2'
                  }),
                  run.debug_metadata?.thinking && React.createElement('details', { className: 'mt-2' },
                    React.createElement('summary', { className: 'text-sm cursor-pointer' }, 'Thinking'),
                    React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap' },
                      run.debug_metadata.thinking
                    )
                  ),
                  React.createElement('details', { className: 'mt-2' },
                    React.createElement('summary', { className: 'text-sm cursor-pointer' }, 'Prompt'),
                    React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap' },
                      run.final_prompt
                    )
                  )
                ),

                phase === 'evaluation' && run.prompt_evaluations?.length > 0 && React.createElement('div', {},
                  React.createElement('div', { className: 'text-sm font-semibold mb-2' }, \`Score: \${run.prompt_evaluations[0].score_overall}/10\`),
                  React.createElement('pre', { className: 'bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64' },
                    JSON.stringify(run.prompt_evaluations[0].details, null, 2)
                  )
                )
              )
            )
          )
        )
      );
    };

    const NotebookView = () => {
      const [error, setError] = useState(null);
      const [sessionId, setSessionId] = useState(null);
      const [fixtureImages, setFixtureImages] = useState({});
      const [selectedFixtureIds, setSelectedFixtureIds] = useState([]);
      const [showFixtureSelector, setShowFixtureSelector] = useState(false);

      const [analysisRuns, setAnalysisRuns] = useState([]);
      const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);

      const [generationRuns, setGenerationRuns] = useState([]);
      const [selectedGenerationId, setSelectedGenerationId] = useState(null);

      const [evaluationRuns, setEvaluationRuns] = useState([]);

      const [imageCache, setImageCache] = useState([]);

      useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('session');

        if (urlSessionId) {
          setSessionId(urlSessionId);

          // Try SessionStorage first
          const cached = loadNotebookSession(urlSessionId);
          if (cached) {
            console.log('Restored session from SessionStorage cache');
            setSelectedFixtureIds(cached.selectedFixtureIds || []);
            setAnalysisRuns(cached.analysisRuns || []);
            setSelectedAnalysisId(cached.selectedAnalysisId);
            setGenerationRuns(cached.generationRuns || []);
            setSelectedGenerationId(cached.selectedGenerationId);
            setEvaluationRuns(cached.evaluationRuns || []);
            setImageCache(cached.imageCache || []);
          } else {
            // Fallback to database
            console.log('SessionStorage miss, loading from database');
            loadSession(urlSessionId);
          }
        } else {
          setShowFixtureSelector(true);
        }

        // Load fixtures for selector
        fetch('/api/notebook/fixtures')
          .then(res => res.json())
          .then(data => setFixtureImages(data.fixtures))
          .catch(err => console.error('Failed to load fixtures:', err));
      }, []);

      // Save complete session state to SessionStorage
      useEffect(() => {
        if (sessionId) {
          saveNotebookSession({
            sessionId,
            selectedFixtureIds,
            selectedAnalysisId,
            selectedGenerationId,
            analysisRuns,
            generationRuns,
            evaluationRuns,
            imageCache
          });
        }
      }, [
        sessionId,
        selectedFixtureIds,
        selectedAnalysisId,
        selectedGenerationId,
        analysisRuns,
        generationRuns,
        evaluationRuns,
        imageCache
      ]);

      const loadSession = async (sessionId) => {
        try {
          const res = await fetchWithTimeout(\`/api/notebook/session/\${sessionId}\`, {});

          if (!res.ok) {
            if (res.status === 404) {
              setError('Session not found. Starting new session.');
              window.location.href = '/notebook';
              return;
            }
            throw new Error(\`HTTP \${res.status}\`);
          }

          const data = await res.json();
          setAnalysisRuns(data.phases.analysis);
          setGenerationRuns(data.phases.generation);
          setEvaluationRuns(data.phases.evaluation);
        } catch (err) {
          setError('Failed to load session: ' + err.message);
        }
      };

      const handleFixtureSelection = (fixtureIds) => {
        setSelectedFixtureIds(fixtureIds);
        setShowFixtureSelector(false);

        const newSessionId = \`notebook-\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}\`;
        setSessionId(newSessionId);
        window.history.replaceState({}, '', \`?session=\${newSessionId}\`);
      };

      return React.createElement('div', { className: 'max-w-7xl mx-auto p-8' },
        React.createElement(ErrorMessage, { message: error, onDismiss: () => setError(null) }),
        React.createElement(SessionHeader, { sessionId }),
        showFixtureSelector && React.createElement(FixtureImageSelector, {
          fixtures: fixtureImages,
          onSelect: handleFixtureSelection,
          onCancel: () => setShowFixtureSelector(false)
        }),
        sessionId && React.createElement('div', { className: 'space-y-8 mt-6' },
          React.createElement(AnalysisPhase, {
            sessionId,
            fixtureImageIds: selectedFixtureIds,
            runs: analysisRuns,
            selectedRunId: selectedAnalysisId,
            onRunComplete: (newRun) => setAnalysisRuns([...analysisRuns, newRun]),
            onSelectRun: setSelectedAnalysisId
          }),
          React.createElement(GenerationPhase, {
            sessionId,
            parentRunId: selectedAnalysisId,
            runs: generationRuns.filter(r => r.parent_run_id === selectedAnalysisId),
            selectedRunId: selectedGenerationId,
            disabled: !selectedAnalysisId,
            onRunComplete: (newRun) => setGenerationRuns([...generationRuns, newRun]),
            onSelectRun: setSelectedGenerationId
          }),
          React.createElement(EvaluationPhase, {
            sessionId,
            parentRunId: selectedGenerationId,
            runs: evaluationRuns.filter(r => r.parent_run_id === selectedGenerationId),
            disabled: !selectedGenerationId,
            onRunComplete: (newRun) => setEvaluationRuns([...evaluationRuns, newRun])
          })
        )
      );
    };

    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(NotebookView));
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
        filename: relative(process.cwd(), fullPath),
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

const createSSERunStream = (template: string, batchFile: string, batchLabel?: string): ReadableStream => {
  return new ReadableStream({
    async start(controller) {
      const connectionStart = Date.now();

      // Log connection established
      logger.debug('SSE connection established', {
        batchLabel,
        connectionDuration: '0s'
      });

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

        // Log SSE event sent
        logger.debug('SSE event sent', {
          batchLabel,
          event: 'progress',
          phase,
          progress: `${current}/${total}`
        });
      };

      try {
        // Build CLI args
        const args = ['--template', template, '--batch', batchFile];
        if (batchLabel) args.push('--label', batchLabel);

        // Execute test command with progress callback
        await testCommand(args, onProgress);

        // Send completion event
        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);

        // Log completion
        const totalDuration = Math.round((Date.now() - connectionStart) / 1000);
        logger.info('SSE connection closed', {
          batchLabel,
          duration: `${totalDuration}s`,
          reason: 'complete'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(`data: ${JSON.stringify({ error: message })}\n\n`);

        // Log connection error
        const elapsed = Math.round((Date.now() - connectionStart) / 1000);
        logger.error('SSE connection error', {
          batchLabel,
          connectionDuration: `${elapsed}s`,
          error: message
        });
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
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    logger.error('SSE request JSON parse error', {
      rawMessage: 'request body',
      phase: 'request',
      position: 'handleRun',
      error: message
    });
    return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  try {
    const { template, batchFile, label: batchLabel } = body;

    // Validate required fields
    if (!template || !batchFile) {
      return Response.json(
        { error: 'Missing required fields: template, batchFile' },
        { status: 400 }
      );
    }

    const stream = createSSERunStream(template, batchFile, batchLabel);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('SSE run handler error', {
      batchLabel: body.label,
      error: message
    });
    return Response.json({ error: `Failed to start run: ${message}` }, { status: 500 });
  }
};

const handleNotebookFixtures = async (req: Request): Promise<Response> => {
  try {
    const supabase = createAdminClient();

    const { data: fixtures, error } = await supabase
      .from('fixture_images')
      .select('id, filename, r2_url, product')
      .order('product', { ascending: true })
      .order('filename', { ascending: true });

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by product
    const grouped = (fixtures || []).reduce((acc, fixture) => {
      if (!acc[fixture.product]) {
        acc[fixture.product] = [];
      }
      acc[fixture.product].push(fixture);
      return acc;
    }, {} as Record<string, typeof fixtures>);

    return Response.json({ fixtures: grouped });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load fixtures: ${message}` }, { status: 500 });
  }
};

const handleNotebookAnalyze = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, fixtureImageIds, variables, model, cacheEnabled } = body;

    if (!sessionId || !fixtureImageIds || fixtureImageIds.length === 0) {
      return Response.json({ error: 'Missing required fields: sessionId, fixtureImageIds' }, { status: 400 });
    }

    // Call real orchestrator function
    const result = await runAnalysisPhase({
      sessionId,
      fixtureImageIds,
      variables: variables || {},
      model: model || 'gemini-2.0-flash',
      cacheEnabled: cacheEnabled ?? true
    });

    if (!isOk(result)) {
      logger.error('Notebook analysis failed', {
        sessionId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    logger.info('Notebook analysis succeeded', {
      sessionId,
      runId: (result.data as AnalysisResult).runId
    });

    return Response.json(result.data as AnalysisResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook analyze endpoint error', { error: message });
    return Response.json({ error: 'Analysis failed: ' + message }, { status: 500 });
  }
};

const handleNotebookGenerate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, parentRunId, templateSlug, templateData, variables } = body;

    if (!sessionId || !parentRunId || !templateSlug) {
      return Response.json({ error: 'Missing required fields: sessionId, parentRunId, templateSlug' }, { status: 400 });
    }

    // Call real orchestrator function
    const result = await runGenerationPhase({
      sessionId,
      parentRunId,
      templateSlug,
      templateData: templateData || {},
      variables: variables || {}
    });

    if (!isOk(result)) {
      logger.error('Notebook generation failed', {
        sessionId,
        parentRunId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    logger.info('Notebook generation succeeded', {
      sessionId,
      runId: (result.data as GenerationResult).runId,
      imageUrl: (result.data as GenerationResult).imageUrl
    });

    return Response.json(result.data as GenerationResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook generate endpoint error', { error: message });
    return Response.json({ error: 'Generation failed: ' + message }, { status: 500 });
  }
};

const handleNotebookEvaluate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, parentRunId, evaluationPrompt, model } = body;

    // Validate required fields
    if (!sessionId || !parentRunId) {
      return Response.json(
        { error: 'Missing required fields: sessionId, parentRunId' },
        { status: 400 }
      );
    }

    // Call orchestrator function
    const result = await runEvaluationPhase({
      sessionId,
      parentRunId,
      evaluationPrompt: evaluationPrompt || undefined,
      model: model || 'claude-sonnet-4-20250514'
    });

    // Handle errors
    if (!isOk(result)) {
      logger.error('Notebook evaluation failed', {
        sessionId,
        parentRunId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    // Success
    logger.info('Notebook evaluation succeeded', {
      sessionId,
      runId: (result.data as EvaluationResult).runId,
      scoreOverall: (result.data as EvaluationResult).scoreOverall
    });

    return Response.json(result.data as EvaluationResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook evaluate endpoint error', { error: message });
    return Response.json({ error: 'Evaluation failed: ' + message }, { status: 500 });
  }
};

const handleNotebookSession = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch all runs for this session
    const { data: runs, error } = await supabase
      .from('prompt_tests')
      .select(`
        *,
        prompt_evaluations(*)
      `)
      .eq('session_id', sessionId)
      .order('phase', { ascending: true })
      .order('phase_run_number', { ascending: true });

    if (error) {
      logger.error('Failed to load notebook session', {
        sessionId,
        error: error.message
      });
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by phase
    const phases = {
      analysis: runs?.filter(r => r.phase === 'analysis') || [],
      generation: runs?.filter(r => r.phase === 'generation') || [],
      evaluation: runs?.filter(r => r.phase === 'evaluation') || []
    };

    logger.info('Loaded notebook session', {
      sessionId,
      analysisRuns: phases.analysis.length,
      generationRuns: phases.generation.length,
      evaluationRuns: phases.evaluation.length
    });

    return Response.json({ sessionId, phases });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook session endpoint error', { error: message });
    return Response.json({ error: 'Failed to load session: ' + message }, { status: 500 });
  }
};