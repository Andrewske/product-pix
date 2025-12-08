# Task 05: Create Convergence Detection Module

## Objective
Implement stopping conditions to detect when iteration should stop.

## File to Create
`prompt-bench/core/convergence.ts`

## Context
- Uses types from `prompt-bench/core/iteration-types.ts`
- Analyzes score history to detect convergence
- Multiple stopping conditions

## Types to Define

```typescript
export type ConvergenceReason =
  | 'max_generations'      // Hit generation limit
  | 'stddev_threshold'     // Population converged (low variance)
  | 'plateau'              // No improvement for N generations
  | 'target_reached';      // Hit target score

export interface ConvergenceResult {
  converged: boolean;
  reason?: ConvergenceReason;
  details: string;
  stats: {
    currentGeneration: number;
    bestScore: number;
    recentImprovement: number;  // Improvement over last 3 generations
    populationStdDev: number;
  };
}
```

## Required Functions

### 1. Check Convergence
```typescript
export const checkConvergence = (
  state: IterationState,
  targetScore?: number  // optional target to stop at
): ConvergenceResult
```

Check conditions in order:
1. **Max Generations**: `generations.length >= config.maxGenerations`
2. **Target Reached**: `lastGeneration.bestScore >= targetScore` (if provided)
3. **StdDev Threshold**: `lastGeneration.stdDev < config.convergenceThreshold`
4. **Plateau Detection**: No improvement in best score for 3 consecutive generations

### 2. Calculate Improvement Rate
```typescript
export const calculateImprovementRate = (
  scoreHistory: IterationState['scoreHistory'],
  windowSize?: number  // default 3
): number
```
- Calculate average improvement per generation over window
- Returns 0 if insufficient history
- Negative means regression

### 3. Estimate Generations to Target
```typescript
export const estimateGenerationsToTarget = (
  state: IterationState,
  targetScore: number
): number | null
```
- Based on current improvement rate
- Return null if converging away from target
- Useful for user feedback

### 4. Get Convergence Summary
```typescript
export const getConvergenceSummary = (
  state: IterationState
): string
```
- Human-readable summary of convergence status
- Include: current gen, best score, improvement trend, estimated remaining

## Implementation Details

### Plateau Detection Logic
```typescript
const detectPlateau = (
  history: ScoreHistoryEntry[],
  windowSize: number = 3
): boolean => {
  if (history.length < windowSize + 1) return false;

  const recent = history.slice(-windowSize);
  const previous = history[history.length - windowSize - 1];

  // Check if best score improved at all
  const bestImproved = recent.some(g => g.best > previous.best);
  return !bestImproved;
};
```

### StdDev Threshold Logic
```typescript
const checkStdDevConvergence = (
  history: ScoreHistoryEntry[],
  threshold: number
): boolean => {
  if (history.length === 0) return false;
  const last = history[history.length - 1];
  return last.stdDev < threshold;
};
```

## Example Output
```typescript
{
  converged: false,
  stats: {
    currentGeneration: 4,
    bestScore: 8.7,
    recentImprovement: 0.15,
    populationStdDev: 0.42
  },
  details: "Generation 4/10. Best: 8.7. Improving at 0.15/gen. ~4 generations to 9.5 target."
}
```

```typescript
{
  converged: true,
  reason: 'plateau',
  stats: {
    currentGeneration: 7,
    bestScore: 9.1,
    recentImprovement: 0.0,
    populationStdDev: 0.08
  },
  details: "Converged after 7 generations. Best score 9.1 with no improvement in 3 generations."
}
```
