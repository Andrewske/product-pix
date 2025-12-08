/**
 * Convergence detection for prompt iteration system
 */

import type { IterationState, ScoreHistoryEntry } from '@bench/core/iteration-types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Minimum generations before convergence checks apply
 * Prevents premature convergence during initial population building
 */
const MIN_GENERATIONS_BEFORE_CONVERGENCE = 3;

// =============================================================================
// Types
// =============================================================================

/**
 * Reasons why iteration might converge
 */
export type ConvergenceReason =
  | 'max_generations'      // Hit generation limit
  | 'stddev_threshold'     // Population converged (low variance)
  | 'plateau'              // No improvement for N generations
  | 'target_reached';      // Hit target score

/**
 * Result of convergence check
 */
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

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Check if iteration should converge based on multiple criteria
 */
export const checkConvergence = (
  state: IterationState,
  targetScore?: number  // optional target to stop at
): ConvergenceResult => {
  const currentGen = state.generations.length;
  const lastHistory = state.scoreHistory[state.scoreHistory.length - 1];

  // Default stats
  const stats = {
    currentGeneration: currentGen,
    bestScore: lastHistory?.best ?? 0,
    recentImprovement: calculateImprovementRate(state.scoreHistory),
    populationStdDev: lastHistory?.stdDev ?? 0,
  };

  // Skip convergence checks for early generations to allow population building
  if (currentGen < MIN_GENERATIONS_BEFORE_CONVERGENCE) {
    return {
      converged: false,
      details: `Building population (gen ${currentGen}/${MIN_GENERATIONS_BEFORE_CONVERGENCE} minimum)`,
      stats,
    };
  }

  // Check conditions in order of priority

  // 1. Max generations reached
  if (currentGen >= state.config.maxGenerations) {
    return {
      converged: true,
      reason: 'max_generations',
      details: `Reached maximum generations (${state.config.maxGenerations})`,
      stats,
    };
  }

  // 2. Target score reached (if specified)
  if (targetScore && lastHistory && lastHistory.best >= targetScore) {
    return {
      converged: true,
      reason: 'target_reached',
      details: `Target score ${targetScore} reached with ${lastHistory.best.toFixed(2)}`,
      stats,
    };
  }

  // 3. Population standard deviation below threshold
  if (lastHistory && lastHistory.stdDev < state.config.convergenceThreshold) {
    return {
      converged: true,
      reason: 'stddev_threshold',
      details: `Population converged (stdDev ${lastHistory.stdDev.toFixed(3)} < ${state.config.convergenceThreshold})`,
      stats,
    };
  }

  // 4. Plateau detection (no improvement for 3 consecutive generations)
  if (detectPlateau(state.scoreHistory)) {
    return {
      converged: true,
      reason: 'plateau',
      details: 'No improvement in best score for 3 consecutive generations',
      stats,
    };
  }

  // Not converged
  return {
    converged: false,
    details: getConvergenceSummary(state),
    stats,
  };
};

/**
 * Calculate average improvement rate over recent generations
 */
export const calculateImprovementRate = (
  scoreHistory: ScoreHistoryEntry[],
  windowSize: number = 3
): number => {
  if (scoreHistory.length < windowSize + 1) {
    return 0;
  }

  const recent = scoreHistory.slice(-windowSize);
  const previous = scoreHistory[scoreHistory.length - windowSize - 1];

  // Calculate total improvement over the window
  const totalImprovement = recent.reduce((sum, gen) => sum + gen.best, 0) - (previous.best * windowSize);
  const avgImprovement = totalImprovement / windowSize;

  return avgImprovement;
};

/**
 * Estimate generations needed to reach target score
 */
export const estimateGenerationsToTarget = (
  state: IterationState,
  targetScore: number
): number | null => {
  const improvementRate = calculateImprovementRate(state.scoreHistory);

  // If not improving or regressing, can't estimate
  if (improvementRate <= 0) {
    return null;
  }

  const lastHistory = state.scoreHistory[state.scoreHistory.length - 1];
  if (!lastHistory) {
    return null;
  }

  const remainingImprovement = targetScore - lastHistory.best;
  const generationsNeeded = Math.ceil(remainingImprovement / improvementRate);

  return generationsNeeded > 0 ? generationsNeeded : null;
};

/**
 * Generate human-readable convergence status summary
 */
export const getConvergenceSummary = (
  state: IterationState
): string => {
  const currentGen = state.generations.length;
  const lastHistory = state.scoreHistory[state.scoreHistory.length - 1];

  if (!lastHistory) {
    return `Generation ${currentGen}/${state.config.maxGenerations}. No evaluation data yet.`;
  }

  const improvementRate = calculateImprovementRate(state.scoreHistory);
  const targetEstimate = estimateGenerationsToTarget(state, 9.5); // Default target

  let summary = `Generation ${currentGen}/${state.config.maxGenerations}. Best: ${lastHistory.best.toFixed(2)}. `;

  if (improvementRate > 0) {
    summary += `Improving at ${improvementRate.toFixed(2)}/gen. `;
    if (targetEstimate) {
      summary += `~${targetEstimate} generations to 9.5 target.`;
    }
  } else if (improvementRate < 0) {
    summary += `Regressing at ${Math.abs(improvementRate).toFixed(2)}/gen.`;
  } else {
    summary += 'No recent improvement.';
  }

  return summary;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Detect if there's been no improvement in best score for the specified window
 */
const detectPlateau = (
  history: ScoreHistoryEntry[],
  windowSize: number = 3
): boolean => {
  if (history.length < windowSize + 1) {
    return false;
  }

  const recent = history.slice(-windowSize);
  const previous = history[history.length - windowSize - 1];

  // Check if best score improved at all in the recent window
  const bestImproved = recent.some(gen => gen.best > previous.best);
  return !bestImproved;
};