# Task 4: Wire Up CLI Routing

## Objective
Connect the new `test` command to the CLI entry point and export the orchestrator from the prompts module.

## Files to Modify

### 1. `scripts/prompt-bench.ts`

#### Add Import
```typescript
import { testCommand } from './commands/test';
```

#### Update Commands Array
```typescript
const COMMANDS = ['test', 'run', 'evaluate', 'compare', 'report', 'sync'] as const;
```

#### Add Case in Switch
```typescript
case 'test':
  await testCommand(args);
  break;
```

#### Full Updated File
```typescript
#!/usr/bin/env tsx
/**
 * Prompt Testing CLI
 *
 * Usage:
 *   pnpm bench test --template <slug> --batch <file> [options]  # Unified pipeline
 *   pnpm bench run --template <slug> --batch <file> [options]
 *   pnpm bench evaluate --label <batch-label>
 *   pnpm bench compare --baseline <label> --candidate <label>
 *   pnpm bench report --label <batch-label>
 *   pnpm bench sync
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

import { testCommand } from './commands/test';
import { runCommand } from './commands/run';
import { evaluateCommand } from './commands/evaluate';
import { compareCommand } from './commands/compare';
import { reportCommand } from './commands/report';
import { syncCommand } from './commands/sync';

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
    case 'test':
      await testCommand(args);
      break;
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
```

### 2. `src/lib/prompts/index.ts`

#### Add Exports
```typescript
// Orchestrator (for unified CLI)
export { runPipeline, generateBatchLabel } from './orchestrator';
export type { PipelineOptions, PipelineResult, ProgressCallback } from './orchestrator';
```

## Verification

After wiring up, verify with:

```bash
# Should show 'test' in available commands
pnpm bench

# Should run the unified pipeline
pnpm bench test --template ecommerce-base --batch tests/fixtures/products-mix.json --dry-run
```

## Acceptance Criteria
- [ ] `pnpm bench test` routes to testCommand
- [ ] Help text updated with test command usage
- [ ] Orchestrator types exported from prompts module
- [ ] Existing commands still work unchanged
- [ ] TypeScript compilation passes
