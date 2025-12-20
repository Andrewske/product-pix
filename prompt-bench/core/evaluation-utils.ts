/**
 * Utility functions for evaluation data processing
 */

import type { ProductScore, EvaluationBreakdown } from './improvement-types';

/**
 * Type guard to check if evaluation details contain a valid breakdown structure
 */
export const hasBreakdown = (details: Record<string, unknown>): details is EvaluationBreakdown & Record<string, unknown> => {
  return (
    typeof details.composition === 'number' &&
    typeof details.lighting === 'number' &&
    typeof details.productVisibility === 'number' &&
    typeof details.backgroundQuality === 'number' &&
    typeof details.professionalQuality === 'number' &&
    typeof details.promptAdherence === 'number'
  );
};

/**
 * Maps evaluation data to ProductScore array
 */
export const mapEvaluationsToProductScores = (
  evaluations: Array<{
    score: number;
    details?: Record<string, unknown> | null;
  }>
): ProductScore[] => {
  return evaluations.map((evaluation, idx) => {
    const details = evaluation.details;

    return {
      productId: `product-${idx}`,
      score: evaluation.score,
      breakdown: details && hasBreakdown(details) ? {
        composition: details.composition,
        lighting: details.lighting,
        productVisibility: details.productVisibility,
        backgroundQuality: details.backgroundQuality,
        professionalQuality: details.professionalQuality,
        promptAdherence: details.promptAdherence,
      } : undefined,
      reasoning: typeof details?.reasoning === 'string' ? details.reasoning : undefined,
      suggestions: Array.isArray(details?.suggestions) ? details.suggestions as string[] : undefined,
    };
  });
};