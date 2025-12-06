interface ProgressBar {
  update: (current: number, total: number, suffix?: string) => void;
  complete: (message: string) => void;
  error: (message: string) => void;
}

import type { BatchReport } from '@/lib/prompts/statistics';

interface PipelineResult {
  label: string;
  phases: {
    sync?: { synced: boolean };
    run: { completed: number; failed: number; skipped: number };
    evaluate?: { completed: number; failed: number };
    report?: BatchReport;
  };
  totalDuration: number;
  costs: { generation: number; evaluation: number };
}

const createProgressBar = (label: string): ProgressBar => {
  const width = 30;

  return {
    update: (current, total, suffix = '') => {
      const pct = Math.round((current / total) * 100);
      const filled = Math.round((current / total) * width);
      const empty = width - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      process.stdout.write(`\r${label.padEnd(10)} [${bar}] ${pct.toString().padStart(3)}% ${suffix}`);
    },
    complete: (message) => {
      process.stdout.write(`\r${label.padEnd(10)} ✅ ${message}\n`);
    },
    error: (message) => {
      process.stdout.write(`\r${label.padEnd(10)} ❌ ${message}\n`);
    },
  };
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const displayPipelineSummary = (result: PipelineResult): void => {
  const totalCost = result.costs.generation + result.costs.evaluation;

  console.log(`
┌─────────────────────────────────────────────────────────────┐
│ Pipeline Complete: ${result.label.padEnd(40)}│
├─────────────────────────────────────────────────────────────┤
│ Duration: ${formatDuration(result.totalDuration).padEnd(49)}│
│ Generated: ${result.phases.run.completed}/${result.phases.run.completed + result.phases.run.failed}`.padEnd(61) + `│
│ Evaluated: ${result.phases.evaluate?.completed ?? 'skipped'}`.padEnd(61) + `│
│ Mean Score: ${result.phases.report?.stats.mean.toFixed(2) ?? 'N/A'}/10`.padEnd(61) + `│
├─────────────────────────────────────────────────────────────┤
│ Cost: $${totalCost.toFixed(4)} (Gen: $${result.costs.generation.toFixed(4)}, Eval: $${result.costs.evaluation.toFixed(4)})`.padEnd(60) + `│
└─────────────────────────────────────────────────────────────┘`);
};

export { createProgressBar, formatDuration, displayPipelineSummary };
export type { ProgressBar, PipelineResult };