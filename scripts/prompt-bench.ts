#!/usr/bin/env tsx
/**
 * Prompt Testing CLI
 *
 * Usage:
 *   npm run bench run --template <slug> --batch <file> [options]
 *   npm run bench evaluate --label <batch-label>
 *   npm run bench compare --baseline <label> --candidate <label>
 *   npm run bench report --label <batch-label>
 *   npm run bench sync
 */

import { runCommand } from './commands/run';
import { evaluateCommand } from './commands/evaluate';
import { compareCommand } from './commands/compare';
import { reportCommand } from './commands/report';
import { syncCommand } from './commands/sync';

const COMMANDS = ['run', 'evaluate', 'compare', 'report', 'sync'] as const;
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
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
