export const NEGATIVE_FEEDBACK_REASONS = [
  'quality_issues',
  'doesnt_match_request',
  'product_not_visible',
  'wrong_style',
  'background_problems',
  'other',
] as const;

export const POSITIVE_FEEDBACK_REASONS = [
  'great_quality',
  'matched_request',
  'fast',
] as const;

export type NegativeFeedbackReason = typeof NEGATIVE_FEEDBACK_REASONS[number];
export type PositiveFeedbackReason = typeof POSITIVE_FEEDBACK_REASONS[number];
export type FeedbackReason = NegativeFeedbackReason | PositiveFeedbackReason;
export type FeedbackType = 'positive' | 'negative';

export const NEGATIVE_REASON_LABELS: Record<NegativeFeedbackReason, string> = {
  quality_issues: 'Quality issues',
  doesnt_match_request: "Doesn't match my request",
  product_not_visible: 'Product not visible/clear',
  wrong_style: 'Wrong style/aesthetic',
  background_problems: 'Background problems',
  other: 'Other',
};

export const POSITIVE_REASON_LABELS: Record<PositiveFeedbackReason, string> = {
  great_quality: 'Great quality',
  matched_request: 'Matched my request',
  fast: 'Fast',
};

export interface ImageFeedback {
  id: string;
  imageId: string;
  userId: string;
  feedbackType: FeedbackType;
  reasons: FeedbackReason[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitFeedbackParams {
  imageId: string;
  feedbackType: FeedbackType;
  reasons: FeedbackReason[];
  comment?: string;
}