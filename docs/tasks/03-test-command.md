# Task 3: Create Test Command

## Objective
Create the unified `test` CLI command that wraps the orchestrator with argument parsing and progress display.

## File to Create
`scripts/commands/test.ts`

## Dependencies
- `@/lib/prompts/orchestrator` - runPipeline, generateBatchLabel
- `./progress` - createProgressBar, displayPipelineSummary

## CLI Interface

```bash
pnpm bench test --template <slug> --batch <file> [options]

# Required
--template, -t    Template slug (e.g., "ecommerce-base")
--batch, -b       Batch file path (e.g., "tests/fixtures/products-mix.json")

# Optional
--label, -l       Batch label (auto-generated if not provided)
--version, -v     Template version (default: "latest")
--no-sync         Skip template sync step
--no-eval         Skip evaluation step
--no-report       Skip report step
--dry-run         Validate only, no generation
--json            Output results as JSON (no progress bars)
--quiet, -q       Minimal output (errors only)
--eval-model      Evaluator model (default: "claude-sonnet-4-20250514")
```

## Implementation

### Argument Parsing
```typescript
import { parseArgs } from 'node:util';

interface TestOptions {
  template: string;
  version: number | 'latest';
  batchFile: string;
  label?: string;
  skipSync: boolean;
  skipEval: boolean;
  skipReport: boolean;
  dryRun: boolean;
  quiet: boolean;
  json: boolean;
  evalModel: string;
}

const parseTestOptions = (args: string[]): TestOptions => {
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
      'eval-model': { type: 'string', default: 'claude-sonnet-4-20250514' },
    },
  });

  // Validation
  if (!values.template) {
    console.error('Error: --template is required');
    process.exit(1);
  }
  if (!values.batch) {
    console.error('Error: --batch is required');
    process.exit(1);
  }

  return {
    template: values.template,
    version: values.version === 'latest' ? 'latest' : parseInt(values.version, 10),
    batchFile: values.batch,
    label: values.label,
    skipSync: values['no-sync'] ?? false,
    skipEval: values['no-eval'] ?? false,
    skipReport: values['no-report'] ?? false,
    dryRun: values['dry-run'] ?? false,
    quiet: values.quiet ?? false,
    json: values.json ?? false,
    evalModel: values['eval-model'] ?? 'claude-sonnet-4-20250514',
  };
};
```

### Main Command
```typescript
export const testCommand = async (args: string[]): Promise<void> => {
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
  const bars = new Map<string, ProgressBar>();
  const onProgress = options.quiet || options.json
    ? undefined
    : (phase: string, current: number, total: number, message: string) => {
        if (!bars.has(phase)) {
          bars.set(phase, createProgressBar(phase));
        }
        const bar = bars.get(phase)!;
        if (current === total) {
          bar.complete(message);
        } else {
          bar.update(current, total, message);
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
  }, onProgress);

  // Handle result
  if (!result.ok) {
    if (options.json) {
      console.log(JSON.stringify({ error: result.error }, null, 2));
    } else {
      console.error(`\n❌ Pipeline failed: ${result.error.message}`);
      if (result.error.context) {
        console.error(`   Context: ${JSON.stringify(result.error.context)}`);
      }
    }
    process.exit(1);
  }

  // Output
  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else if (!options.quiet) {
    displayPipelineSummary(result.data);
  }
};
```

## Export
```typescript
export { testCommand };
```

## Acceptance Criteria
- [ ] All CLI flags parsed correctly
- [ ] Required flags validated with helpful error messages
- [ ] Auto-generated label when not provided
- [ ] Progress bars shown for each phase (unless quiet/json)
- [ ] JSON output mode works correctly
- [ ] Pipeline errors displayed with context
- [ ] Exit code 1 on failure, 0 on success
