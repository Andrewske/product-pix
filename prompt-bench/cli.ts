#!/usr/bin/env tsx
/**
 * Prompt Testing CLI
 *
 * Usage:
 *   bunbench test --template <slug> --batch <file> [options]  # Unified pipeline
 *   bunbench run --template <slug> --batch <file> [options]
 *   bunbench evaluate --label <batch-label>
 *   bunbench compare --baseline <label> --candidate <label>
 *   bunbench report --label <batch-label>
 *   bunbench sync
 */

// IMPORTANT: Load environment variables FIRST before any other imports
// This ensures R2/Supabase clients get the correct credentials
// Load .env first, then .env.local (which overrides .env)
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

import { runCommand } from '@bench/commands/run';
import { evaluateCommand } from '@bench/commands/evaluate';
import { compareCommand } from '@bench/commands/compare';
import { reportCommand } from '@bench/commands/report';
import { syncCommand } from '@bench/commands/sync';
import { testCommand } from '@bench/commands/test';

const COMMANDS = ['test', 'run', 'evaluate', 'compare', 'report', 'sync'] as const;
type Command = (typeof COMMANDS)[number];

const parseCommand = (): { command: Command; args: string[] } => {
  const args = process.argv.slice(2);
  const command = args[0] as Command;

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error(`Available commands: ${COMMANDS.join(', ')}`);
    process.exit(1);
  }

  return { command, args: args.slice(1) };
};

const main = async (): Promise<void> => {
  const { command, args } = parseCommand();

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
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
