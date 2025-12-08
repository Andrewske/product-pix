# Task 06: Create CLI Iterate Command

## Objective
Create the main `bun bench iterate` CLI command that orchestrates the iteration workflow.

## File to Create
`prompt-bench/commands/iterate.ts`

## File to Modify
`prompt-bench/cli.ts` - Add 'iterate' to COMMANDS array and switch statement

## Context
- Uses orchestrator from `prompt-bench/core/orchestrator.ts`
- Uses state management from `prompt-bench/core/state.ts`
- Uses evolution from `prompt-bench/core/evolution.ts`
- Uses convergence from `prompt-bench/core/convergence.ts`
- Uses structured insights from `prompt-bench/commands/insights.ts`
- Follows patterns from existing commands (e.g., `test.ts`, `run.ts`)

## CLI Interface

```bash
# Start new iteration session
bun bench iterate --template <slug> --batch <file> [options]

# Resume existing session
bun bench iterate --session <id> [options]

# Show session status
bun bench iterate --session <id> --status

# List all sessions
bun bench iterate --list

# Interactive approval mode (default for new sessions)
bun bench iterate --session <id> --approve
```

## Options Schema

```typescript
interface IterateOptions {
  // Session identification
  template?: string;        // Template slug (for new session)
  batch?: string;          // Initial batch file (for new session)
  session?: string;        // Session ID (for resume)

  // Mode flags
  list?: boolean;          // List all sessions
  status?: boolean;        // Show session status
  approve?: boolean;       // Enter approval mode

  // Configuration overrides
  generations?: number;    // Override max generations
  population?: number;     // Override population size
  target?: number;         // Target score to stop at

  // Output control
  quiet?: boolean;
  json?: boolean;
}
```

## Command Implementation

### parseIterateOptions
```typescript
const parseIterateOptions = (args: string[]): IterateOptions => {
  const { values } = parseArgs({
    args,
    options: {
      template: { type: 'string', short: 't' },
      batch: { type: 'string', short: 'b' },
      session: { type: 'string', short: 's' },
      list: { type: 'boolean' },
      status: { type: 'boolean' },
      approve: { type: 'boolean' },
      generations: { type: 'string' },  // Parse as number
      population: { type: 'string' },
      target: { type: 'string' },
      quiet: { type: 'boolean', short: 'q' },
      json: { type: 'boolean' },
    },
  });
  // ... validation and parsing
};
```

### Main Command Function
```typescript
export const iterateCommand = async (args: string[]): Promise<void> => {
  const options = parseIterateOptions(args);

  // Handle list mode
  if (options.list) {
    return listSessionsCommand(options);
  }

  // Handle status mode
  if (options.status && options.session) {
    return showStatusCommand(options);
  }

  // Load or create session
  const state = options.session
    ? await loadExistingSession(options.session)
    : await createNewSession(options);

  // Main iteration loop
  await runIterationLoop(state, options);
};
```

### Iteration Loop
```typescript
const runIterationLoop = async (
  state: IterationState,
  options: IterateOptions
): Promise<void> => {
  while (true) {
    // 1. Check convergence
    const convergence = checkConvergence(state, options.target);
    if (convergence.converged) {
      displayConvergenceMessage(convergence);
      break;
    }

    // 2. Run current population tests if not evaluated
    if (needsEvaluation(state)) {
      await runAndEvaluatePopulation(state, options);
    }

    // 3. Generate structured insights
    const insights = await generateStructuredInsights(buildSummary(state));
    if (!insights.ok) {
      console.error('Failed to generate insights:', insights.error);
      break;
    }

    // 4. Evolve population (generate new variations)
    const variations = await evolvePopulation(state, insights.data, state.config);
    if (!variations.ok) {
      console.error('Failed to evolve population:', variations.error);
      break;
    }

    // 5. Human approval
    const approved = await promptForApproval(variations.data, state);
    if (approved.length === 0) {
      console.log('No variations approved. Stopping iteration.');
      break;
    }

    // 6. Update state with approved variations
    updateStateWithApproved(state, approved);

    // 7. Save state
    await saveSession(state);

    // 8. Display progress
    displayGenerationSummary(state);
  }

  // Final summary
  displayFinalSummary(state);
};
```

### Human Approval Interface
```typescript
const promptForApproval = async (
  variations: PromptVariation[],
  state: IterationState
): Promise<PromptVariation[]> => {
  console.log('\n## Proposed Variations for Generation', state.generations.length + 1);

  variations.forEach((v, i) => {
    console.log(`\n### [${i + 1}] ${v.source} (${v.mutationType || 'n/a'})`);
    console.log(`Confidence: ${(v.confidence * 100).toFixed(0)}%`);
    console.log(`Rationale: ${v.rationale}`);
    console.log('Template:', JSON.stringify(v.templateData, null, 2));
  });

  // Use readline for interactive input
  const answer = await askQuestion(
    '\nWhich variations to run? (1,2,3 or "all"/"none"/"custom"): '
  );

  if (answer === 'none') return [];
  if (answer === 'all') return variations;
  if (answer === 'custom') return await getCustomVariation(state);

  // Parse comma-separated indices
  const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
  return indices.filter(i => i >= 0 && i < variations.length).map(i => variations[i]);
};
```

### Helper Functions
- `displayConvergenceMessage(result: ConvergenceResult)`
- `displayGenerationSummary(state: IterationState)`
- `displayFinalSummary(state: IterationState)`
- `buildSummary(state: IterationState): BatchSummary`
- `needsEvaluation(state: IterationState): boolean`
- `askQuestion(prompt: string): Promise<string>` - readline wrapper

## Update cli.ts

```typescript
// Add to imports
import { iterateCommand } from '@bench/commands/iterate';

// Update COMMANDS
const COMMANDS = ['test', 'run', 'evaluate', 'compare', 'report', 'sync', 'open-last-report', 'iterate'] as const;

// Add to switch
case 'iterate':
  await iterateCommand(args);
  break;

// Update help text
```

## Output Examples

### Status Output
```
Session: iter-abc123
Template: ecommerce-base v1
Created: 2025-12-07 10:30:00

Generation 3/10
Best Score: 8.7/10
Mean Score: 8.2/10
Population StdDev: 0.42

Score History:
  Gen 1: Best 8.1, Mean 7.8
  Gen 2: Best 8.4, Mean 8.0 (+0.3)
  Gen 3: Best 8.7, Mean 8.2 (+0.2)

Status: Improving (+0.25/gen average)
Estimated generations to 9.5: ~4
```

### Approval Flow
```
## Proposed Variations for Generation 4

### [1] mutation (wording)
Confidence: 80%
Rationale: Simplifying lighting description improved similar prompts
Template: { "subject": "...", "lighting": "soft studio lighting", ... }

### [2] crossover
Confidence: 75%
Rationale: Combining high-scoring background with best lighting settings
Template: { ... }

### [3] wild
Confidence: 60%
Rationale: Testing dramatic rim lighting - unexplored territory
Template: { ... }

Which variations to run? (1,2,3 or "all"/"none"/"custom"): 1,3

Running 2 approved variations...
```
