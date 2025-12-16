/**
 * Test Command - Unified CLI for running the complete prompt testing pipeline
 */

import { parseArgs } from 'node:util';

 import { runPipeline, generateBatchLabel, type ProgressCallback } from '@bench/core/orchestrator';
 import { createProgressBar, displayPipelineSummary } from './progress';
 import { loadConfig } from './shared';
 import { autoReportForLabel } from './report';


interface TestOptions {
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  template: string;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  version: number | 'latest';
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  batchFile: string;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  label?: string;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  skipSync: boolean;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  skipEval: boolean;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  skipReport: boolean;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  dryRun: boolean;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  quiet: boolean;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  json: boolean;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
  evalModel: string;
analysisModel?: string;
  noAnalysis: boolean;
  noCache: boolean;
}

const parseTestOptions = (args: string[]): TestOptions => {
  const config = loadConfig();

  const { values } = parseArgs({
    args,
    options: {
      template: { type: 'string', short: 't' },
      version: { type: 'string', short: 'v', default: 'latest' },
      batch: { type: 'string', short: 'b' },
      label: { type: 'string', short: 'l' },
      'no-sync': { type: 'boolean', default: false },
      'no-eval': { type: 'boolean', default: false },
      'no-report': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      quiet: { type: 'boolean', short: 'q', default: false },
      json: { type: 'boolean', default: false },
      'eval-model': { type: 'string' },
'analysis-model': { type: 'string' },
      'no-analysis': { type: 'boolean', default: false },
      'no-cache': { type: 'boolean', default: false },
    },
  });

  // Validation
  const template = values.template || config?.defaults.template;
  if (!template) {
    console.error('Error: --template is required (or set template in prompt-bench.toml)');
    process.exit(1);
  }

  const batch = values.batch || config?.defaults.batch_file;
  if (!batch) {
    console.error('Error: --batch is required (or set batch_file in prompt-bench.toml)');
    process.exit(1);
  }

  return {
    template,
    version: values.version === 'latest' ? 'latest' : parseInt(values.version, 10),
    batchFile: batch,
    label: values.label,
    skipSync: values['no-sync'] ?? false,
    skipEval: values['no-eval'] ?? false,
    skipReport: values['no-report'] ?? false,
    dryRun: values['dry-run'] ?? false,
    quiet: values.quiet ?? false,
    json: values.json ?? false,
    evalModel: values['eval-model'] || config?.defaults.evaluation_model || 'claude-sonnet-4-20250514',
analysisModel: values['analysis-model'],
    noAnalysis: values['no-analysis'] ?? false,
    noCache: values['no-cache'] ?? false,
  };
};

export const testCommand = async (
  args: string[],
  onProgress?: ProgressCallback
): Promise<void> => {
  const options = parseTestOptions(args);
  const batchLabel = options.label || generateBatchLabel(options.template);

  // Header (unless quiet/json)
  if (!options.quiet && !options.json) {
    console.log(`\n🧪 Prompt Bench: Test Pipeline`);
    console.log(`─────────────────────────────────`);
    console.log(`Template: ${options.template}`);
    console.log(`Batch: ${options.batchFile}`);
    console.log(`Label: ${batchLabel}`);
    console.log(`─────────────────────────────────\n`);
  }

  // Progress tracking
  const bars = new Map<string, ReturnType<typeof createProgressBar>>();
  const progressCallback = options.quiet || options.json
    ? undefined
    : (phase: string, current: number, total: number, message: string) => {
        if (!bars.has(phase)) {
          bars.set(phase, createProgressBar(phase));
        }
        const bar = bars.get(phase);
        if (!bar) return;
        if (current === total) {
          bar.complete(message);
        } else {
          bar.update(current, total, message);
        }
      };

  // Combine progress callbacks
  const combinedProgress: ProgressCallback = (phase, current, total, message) => {
    // Call CLI progress bar callback
    if (progressCallback) {
      progressCallback(phase, current, total, message);
    }
    // Call external progress callback (for SSE)
    if (onProgress) {
      onProgress(phase, current, total, message);
    }
  };

  // Run pipeline
  const result = await runPipeline({
    templateSlug: options.template,
    templateVersion: options.version,
    batchFile: options.batchFile,
    label: batchLabel,
    skipSync: options.skipSync,
    skipEval: options.skipEval,
    skipReport: options.skipReport,
    dryRun: options.dryRun,
    evalModel: options.evalModel,
analysisModel: options.analysisModel,
    analysisEnabled: !options.noAnalysis,
    analysisCacheEnabled: !options.noCache,
  }, combinedProgress);

  // Handle result
  if (!result.ok) {
    if (options.json) {
      console.log(JSON.stringify({ error: result.error }, null, 2));
    } else {
      console.error(`\n❌ Pipeline failed: ${result.error.message}`);
    }
    process.exit(1);
  }

  // Output
  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    if (!options.quiet) {
      displayPipelineSummary(result.data);
    }

    if (!options.skipReport) {
      await autoReportForLabel(batchLabel);
    }
  }
};
