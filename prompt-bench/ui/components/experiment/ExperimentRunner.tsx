import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ProgressBar } from '../primitives';
import type { BatchFileMetadata, TemplateMetadata, ProgressEvent } from '../../types';

export function ExperimentRunner(): React.ReactElement {
  const [batches, setBatches] = useState<BatchFileMetadata[]>([]);
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [label, setLabel] = useState('');

  // Run state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reader, setReader] = useState<ReadableStreamDefaultReader | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  // Fetch batches and templates on mount
  useEffect(() => {
    fetchBatches();
    fetchTemplates();
  }, [fetchBatches, fetchTemplates]);

  const handleRun = async () => {
    if (!selectedTemplate || !selectedBatch) {
      setError('Please select both template and batch file');
      return;
    }

    setIsRunning(true);
    setError(null);
    setProgress(null);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          batchFile: selectedBatch,
          label: label || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const streamReader = response.body?.getReader();
      if (!streamReader) throw new Error('No stream available');

      setReader(streamReader);

      // Read SSE stream
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await streamReader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.done) {
                setReader(null);
                setIsRunning(false);
                setProgress({ phase: 'complete' as any, current: 100, total: 100, message: 'Run completed successfully!', timestamp: Date.now() });
              } else if (event.error) {
                setReader(null);
                setError(event.error);
                setIsRunning(false);
              } else {
                setProgress(event);
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

  const handleQuickStart = (preset: string) => {
    if (preset === 'stage1') {
      setSelectedBatch('prompt-bench/fixtures/stage1-batch.json');
      setSelectedTemplate('ecommerce-base');
    } else if (preset === 'stage2-all') {
      // Note: Would need to run 3 separate runs for each strategy
      alert('Run all Stage 2 strategies sequentially (to be implemented)');
    }
  };

  // Render
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">Experiment Runner</h1>

      {/* Quick Start Section */}
      <Card title="Quick Start">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleQuickStart('stage1')}
          >
            Run Stage 1
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleQuickStart('stage2-all')}
          >
            Run All Stage 2 Strategies
          </Button>
        </div>
      </Card>

      {/* Configuration Section */}
      <Card title="Configure Experiment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="batch-select" className="text-sm font-medium text-gray-700">Batch File</label>
            <select
              id="batch-select"
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={isRunning}
            >
              <option value="">-- Select batch file --</option>
              {batches.map(b => (
                <option key={b.filename} value={b.filename}>
                  {b.label} ({b.testCount} tests)
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="template-select" className="text-sm font-medium text-gray-700">Template</label>
            <select
              id="template-select"
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={isRunning}
            >
              <option value="">-- Select template --</option>
              {templates.map(t => (
                <option key={t.slug} value={t.slug}>{t.slug}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="label-input" className="text-sm font-medium text-gray-700">Label (optional)</label>
            <input
              id="label-input"
              type="text"
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Auto-generated if empty"
              disabled={isRunning}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={handleRun}
            disabled={isRunning || !selectedTemplate || !selectedBatch}
          >
            {isRunning ? 'Running...' : 'Run Experiment'}
          </Button>
        </div>
      </Card>

      {/* Progress Section */}
      {isRunning && progress && (
        <Card title="Progress">
          <ProgressBar
            current={progress.current}
            total={progress.total}
            label={progress.message}
          />
          <div className="mt-4 text-sm text-gray-600">
            Phase: {progress.phase} | {progress.current}/{progress.total}
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel Run
            </Button>
          </div>
        </Card>
      )}

      {/* Error Section */}
      {error && (
        <Card>
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Success Section */}
      {!isRunning && progress?.phase === ('complete' as any) && (
        <Card title="Run Complete">
          <p className="text-green-600 mb-4">✓ Experiment completed successfully!</p>
          <Button onClick={() => { window.location.href = '/results'; }}>
            View Results
          </Button>
        </Card>
      )}
    </div>
  );
}