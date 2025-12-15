import {
  POSITIVE_FEEDBACK_REASONS,
  NEGATIVE_FEEDBACK_REASONS,
  type PositiveFeedbackReason,
  type NegativeFeedbackReason,
  type FeedbackReason,
  type FeedbackType
} from '@/types/feedback';

export function isPositiveFeedbackReason(value: unknown): value is PositiveFeedbackReason {
  return (
    typeof value === 'string' &&
    POSITIVE_FEEDBACK_REASONS.includes(value as PositiveFeedbackReason)
  );
}

export function isNegativeFeedbackReason(value: unknown): value is NegativeFeedbackReason {
  return (
    typeof value === 'string' &&
    NEGATIVE_FEEDBACK_REASONS.includes(value as NegativeFeedbackReason)
  );
}

export function areValidReasonsForType(
  reasons: unknown[],
  feedbackType: FeedbackType
): reasons is FeedbackReason[] {
  if (!Array.isArray(reasons)) return false;

  // Runtime validation: ensure feedbackType is valid before type assertions
  if (feedbackType !== 'positive' && feedbackType !== 'negative') {
    return false;
  }

  const validator = feedbackType === 'positive'
    ? isPositiveFeedbackReason
    : isNegativeFeedbackReason;

  return reasons.every(validator);
}