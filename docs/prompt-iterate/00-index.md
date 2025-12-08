# Prompt Iteration System - Task Index

## Overview
Evolutionary prompt optimization system for prompt-bench with human-in-the-loop approval.

## Task Sequence

Tasks must be completed in order due to dependencies:

| # | Task | File(s) to Create/Modify | Dependencies |
|---|------|--------------------------|--------------|
| 01 | [Iteration Types](./01-iteration-types.md) | `prompt-bench/core/iteration-types.ts` | None |
| 02 | [State Management](./02-state-management.md) | `prompt-bench/core/state.ts`, `prompt-bench/sessions/.gitkeep` | 01 |
| 03 | [Structured Insights](./03-structured-insights.md) | `prompt-bench/commands/insights.ts` (modify) | 01 |
| 04 | [Evolution Engine](./04-evolution-engine.md) | `prompt-bench/core/evolution.ts` | 01, 03 |
| 05 | [Convergence Detection](./05-convergence.md) | `prompt-bench/core/convergence.ts` | 01 |
| 06 | [CLI Iterate Command](./06-iterate-command.md) | `prompt-bench/commands/iterate.ts`, `prompt-bench/cli.ts` | 01-05 |
| 07 | [Slash Command](./07-slash-command.md) | `.claude/commands/prompt-iterate.md` | 06 |
| 08 | [Exports & Integration](./08-exports-integration.md) | `prompt-bench/core/index.ts`, `prompt-bench/cli.ts` | 01-06 |
| 09 | [Tests](./09-tests.md) | `prompt-bench/__tests__/*.test.ts` | 01-05 |

## Parallel Execution Options

These tasks can be done in parallel:
- **Group A**: 01 (types) - must be first
- **Group B**: 02, 03, 05 (after 01 completes)
- **Group C**: 04 (after 01 and 03 complete)
- **Group D**: 06 (after all core modules)
- **Group E**: 07, 08, 09 (after 06)

## Quick Reference

### Files Created
```
prompt-bench/
├── core/
│   ├── iteration-types.ts   # Task 01
│   ├── state.ts             # Task 02
│   ├── evolution.ts         # Task 04
│   ├── convergence.ts       # Task 05
│   └── index.ts             # Task 08 (modify)
├── commands/
│   ├── insights.ts          # Task 03 (modify)
│   ├── iterate.ts           # Task 06
│   └── index.ts             # Task 08 (modify if exists)
├── sessions/
│   └── .gitkeep             # Task 02
├── __tests__/
│   ├── iteration-types.test.ts  # Task 09
│   ├── state.test.ts            # Task 09
│   ├── convergence.test.ts      # Task 09
│   └── evolution.test.ts        # Task 09
└── cli.ts                   # Task 06, 08 (modify)

.claude/
└── commands/
    └── prompt-iterate.md    # Task 07
```

### Key Types (from Task 01)
- `PromptVariation` - A single prompt variation with rationale
- `StructuredInsight` - Enhanced insights with machine-readable variations
- `IterationState` - Session state persisted between runs
- `IterationConfig` - Configuration for evolution parameters

### Key Functions
- `createSession()`, `loadSession()`, `saveSession()` - State management
- `generateStructuredInsights()` - Enhanced insights with variations
- `evolvePopulation()` - Main evolution function
- `checkConvergence()` - Stopping condition detection
- `iterateCommand()` - CLI entry point

## Verification Checklist

After completing all tasks:

- [ ] `bun tsc --noEmit` passes
- [ ] `bun test` passes
- [ ] `bun bench --help` shows iterate command
- [ ] `bun bench iterate --help` shows options
- [ ] `/prompt-iterate` slash command works in Claude Code
- [ ] Can start new iteration session
- [ ] Can resume existing session
- [ ] Human approval flow works
- [ ] Convergence detection works

## Usage Example

```bash
# Start iteration
bun bench iterate --template ecommerce-base --batch fixtures/images-batch.json

# Or use slash command
/prompt-iterate ecommerce-base
```
