# Task 08: Update Exports and Integration

## Objective
Update barrel exports and integrate all new modules into the prompt-bench system.

## Files to Modify

### 1. prompt-bench/core/index.ts

Add exports for new modules:

```typescript
// Existing exports...
export * from './types';
export * from './errors';
export * from './compiler';
export * from './evaluator';
export * from './statistics';
export * from './source-image';
export * from './orchestrator';

// NEW: Iteration system exports
export * from './iteration-types';
export * from './state';
export * from './evolution';
export * from './convergence';
```

### 2. prompt-bench/commands/index.ts (if exists)

Add exports for new commands:

```typescript
export * from './run';
export * from './evaluate';
export * from './compare';
export * from './report';
export * from './sync';
export * from './test';
export * from './insights';
export * from './iterate';  // NEW
```

### 3. prompt-bench/index.ts

Ensure main barrel export includes new modules:

```typescript
// Re-export everything from core
export * from './core';

// Re-export commands (if needed externally)
export { iterateCommand } from './commands/iterate';
export { generateStructuredInsights } from './commands/insights';
```

### 4. prompt-bench/cli.ts

Update to include iterate command:

```typescript
// Add import
import { iterateCommand } from '@bench/commands/iterate';

// Update COMMANDS array
const COMMANDS = [
  'test',
  'run',
  'evaluate',
  'compare',
  'report',
  'sync',
  'open-last-report',
  'iterate'  // NEW
] as const;

// Update help text in showHelp()
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
  iterate          Evolutionary prompt optimization (NEW)

Examples:
  bun bench test --template product-photo --batch ./batches/test.csv
  bun bench iterate --template ecommerce-base --batch ./fixtures/images-batch.json
  bun bench iterate --session <id> --status
  bun bench iterate --list

Run 'bun bench <command> --help' for command-specific options.
`);
};

// Add to switch statement in main()
case 'iterate':
  await iterateCommand(args);
  break;
```

### 5. .gitignore

Add sessions directory exception:

```gitignore
# Existing entries...

# Iteration sessions (keep .gitkeep, ignore session files)
prompt-bench/sessions/*.json
!prompt-bench/sessions/.gitkeep
```

### 6. Create sessions directory

```bash
mkdir -p prompt-bench/sessions
touch prompt-bench/sessions/.gitkeep
```

### 7. Create .claude/commands directory

```bash
mkdir -p .claude/commands
```

## Verification Steps

After completing integration:

1. **Type checking**: `bun tsc --noEmit`
2. **Import test**: Create a test file that imports from `@bench/core`:
   ```typescript
   import {
     IterationState,
     evolvePopulation,
     checkConvergence,
     createSession
   } from '@bench/core';
   ```
3. **CLI test**: `bun bench --help` shows iterate command
4. **Command test**: `bun bench iterate --help` shows iterate options

## Dependency Order

The modules must be created/integrated in this order due to dependencies:

1. `iteration-types.ts` (no dependencies)
2. `state.ts` (depends on iteration-types)
3. `convergence.ts` (depends on iteration-types)
4. `evolution.ts` (depends on iteration-types, uses Anthropic)
5. `insights.ts` updates (depends on iteration-types)
6. `iterate.ts` command (depends on all above)
7. Integration (depends on all above)
