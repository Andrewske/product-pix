#!/usr/bin/env tsx
/**
 * Prompt Testing CLI
 *
 * Usage:
 *   bun bench test --template <slug> --batch <file> [options]  # Unified pipeline
 *   bun bench run --template <slug> --batch <file> [options]
 *   bun bench evaluate --label <batch-label>
 *   bun bench compare --baseline <label> --candidate <label>
 *   bun bench report --label <batch-label>
 *   bun bench sync
 */

// IMPORTANT: Load environment variables FIRST before any other imports
// This ensures R2/Supabase clients get the correct credentials
// Load .env first, then .env.local (which overrides .env)
import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });

import { runCommand } from '@bench/commands/run';
import { evaluateCommand } from '@bench/commands/evaluate';
import { compareCommand } from '@bench/commands/compare';
import { reportCommand } from '@bench/commands/report';
import { syncCommand } from '@bench/commands/sync';
import { testCommand } from '@bench/commands/test';
import { openLastReportCommand } from '@bench/commands/open-last-report';
import { improveCommand } from '@bench/commands/improve';

const COMMANDS = ['test', 'run', 'evaluate', 'compare', 'report', 'sync', 'open-last-report', 'improve'] as const;

type Command = (typeof COMMANDS)[number];

const showHelp = (): void => {
  console.log(`
Prompt Testing CLI

Usage:
  bun bench <command> [options]

Commands:
  test             Run full pipeline: generate → evaluate → report
  run              Generate images from prompts
  evaluate         Score generated images with AI evaluator
  compare          Compare two batch runs (baseline vs candidate)
  report           Generate HTML report for a batch
  sync             Sync local templates to database
  open-last-report Open the most recent HTML report
  improve          AI-powered template improvement

Examples:
  bun bench test --template product-photo --batch ./batches/test.csv
  bun bench run --template product-photo --batch ./batches/test.csv --label v1
  bun bench evaluate --label v1
  bun bench compare --baseline v1 --candidate v2
  bun bench report --label v1
  bun bench open-last-report
   bun bench improve                    # Uses config defaults
   bun bench improve --continue         # Resume previous session
   bun bench improve --new              # End previous session and start new one
   bun bench improve --history          # View past sessions

Run 'bun bench <command> --help' for command-specific options.
`);
};

const parseCommand = (): { command: Command; args: string[] } | null => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return null;
  }

  if (!COMMANDS.includes(command as Command)) {
    console.error(`Unknown command: ${command}`);
    console.error(`Available commands: ${COMMANDS.join(', ')}`);
    console.error(`\nRun 'bun bench --help' for usage information.`);
    process.exit(1);
  }

  return { command: command as Command, args: args.slice(1) };
};

const main = async (): Promise<void> => {
  const parsed = parseCommand();
  if (!parsed) return;

  const { command, args } = parsed;

  switch (command) {
    case 'run':
      await runCommand(args);
      break;
    case 'evaluate':
      await evaluateCommand(args);
      break;
    case 'compare':
      await compareCommand(args);
      break;
    case 'report':
      await reportCommand(args);
      break;
    case 'sync':
      await syncCommand();
      break;
    case 'test':
      await testCommand(args);
      break;
    case 'open-last-report':
      await openLastReportCommand();
      break;
    case 'improve':
      await improveCommand(args);
      break;
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
