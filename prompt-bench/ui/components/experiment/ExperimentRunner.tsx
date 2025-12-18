import * as React from 'react';
import {
  Card,
  Button,
  ProgressBar,
  Select,
  Input,
  Label,
  ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  cn,
} from '../primitives';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { BatchFileMetadata, TemplateMetadata, ProgressEvent } from '../../types';

export function ExperimentRunner(): React.ReactElement {
  const [batches, setBatches] = React.useState<BatchFileMetadata[]>([]);
  const [templates, setTemplates] = React.useState<TemplateMetadata[]>([]);
  const [selectedBatch, setSelectedBatch] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [label, setLabel] = React.useState('');

  // Run state
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<ProgressEvent | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [reader, setReader] = React.useState<ReadableStreamDefaultReader | null>(null);

  const fetchBatches = React.useCallback(async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  }, []);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  // Fetch batches and templates on mount
  React.useEffect(() => {
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
          label: label || undefined,
        }),
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
                setProgress({
                  phase: 'complete' as ProgressEvent['phase'],
                  current: 100,
                  total: 100,
                  message: 'Run completed successfully!',
                  timestamp: Date.now(),
                });
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
      alert('Run all Stage 2 strategies sequentially (to be implemented)');
    }
  };

  const batchOptions = batches.map((b) => ({
    value: b.filename,
    label: `${b.label} (${b.testCount} tests)`,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.slug,
    label: t.slug,
  }));

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      <Card title="Quick Start">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleQuickStart('stage1')}
            disabled={isRunning}
          >
            Run Stage 1
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleQuickStart('stage2-all')}
            disabled={isRunning}
          >
            Run All Stage 2 Strategies
          </Button>
        </div>
      </Card>

      {/* Configuration Section */}
      <Card title="Configure Experiment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Batch File"
            options={[{ value: '', label: '-- Select batch file --' }, ...batchOptions]}
            value={selectedBatch}
            onChange={setSelectedBatch}
            disabled={isRunning}
          />
          <Select
            label="Template"
            options={[{ value: '', label: '-- Select template --' }, ...templateOptions]}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            disabled={isRunning}
          />
          <div className="md:col-span-2">
            <Input
              label="Label (optional)"
              value={label}
              onChange={setLabel}
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
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <div className="mt-4 text-sm text-muted-foreground">
            Phase: {progress.phase} | {progress.current}/{progress.total}
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel Run
            </Button>
          </div>
        </Card>
      )}

      {/* Error Section */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Section */}
      {!isRunning && progress?.phase === ('complete' as ProgressEvent['phase']) && (
        <ShadcnCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              Run Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Experiment completed successfully!
            </p>
            <Button
              onClick={() => {
                window.location.href = '/results';
              }}
            >
              View Results
            </Button>
          </CardContent>
        </ShadcnCard>
      )}
    </div>
  );
}
