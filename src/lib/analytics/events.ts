import { z } from 'zod';

// Auth Events
export const userSignedUpSchema = z.object({
  event: z.literal('user_signed_up'),
  properties: z.object({
    user_id: z.string(),
    email: z.string().email(),
    signup_method: z.enum(['email', 'google', 'github']),
  }),
});

export const userLoggedInSchema = z.object({
  event: z.literal('user_logged_in'),
  properties: z.object({
    user_id: z.string(),
    login_method: z.enum(['email', 'google', 'github']),
  }),
});

export const userLoggedOutSchema = z.object({
  event: z.literal('user_logged_out'),
  properties: z.object({
    user_id: z.string(),
    session_duration_seconds: z.number().min(0),
  }),
});

// Generation Events
export const generationStartedSchema = z.object({
  event: z.literal('generation_started'),
  properties: z.object({
    job_id: z.string(),
    user_id: z.string(),
    template_slug: z.string(),
    aspect_ratio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '16:9', '9:16']),
    resolution: z.enum(['1k', '2k', '4k']),
    has_source_image: z.boolean(),
    source_image_count: z.number().min(0).optional(),
  }),
});

export const generationCompletedSchema = z.object({
  event: z.literal('generation_completed'),
  properties: z.object({
    job_id: z.string(),
    user_id: z.string(),
    template_slug: z.string(),
    image_count: z.number().min(1),
    processing_time_seconds: z.number().min(0),
    credits_consumed: z.number().min(0),
  }),
});

export const generationFailedSchema = z.object({
  event: z.literal('generation_failed'),
  properties: z.object({
    job_id: z.string(),
    user_id: z.string(),
    template_slug: z.string(),
    error_type: z.string(),
    error_message: z.string(),
    credits_consumed: z.number().min(0),
  }),
});

export const imageDownloadedSchema = z.object({
  event: z.literal('image_downloaded'),
  properties: z.object({
    image_id: z.string(),
    user_id: z.string(),
    job_id: z.string(),
    template_slug: z.string(),
    download_format: z.enum(['png', 'jpg', 'webp']),
  }),
});

// Batch Events
export const batchCreatedSchema = z.object({
  event: z.literal('batch_created'),
  properties: z.object({
    batch_id: z.string(),
    user_id: z.string(),
    template_slug: z.string(),
    item_count: z.number().min(1),
    estimated_credits: z.number().min(0),
  }),
});

export const batchCompletedSchema = z.object({
  event: z.literal('batch_completed'),
  properties: z.object({
    batch_id: z.string(),
    user_id: z.string(),
    template_slug: z.string(),
    item_count: z.number().min(1),
    total_credits_consumed: z.number().min(0),
    processing_time_seconds: z.number().min(0),
  }),
});

export const batchCancelledSchema = z.object({
  event: z.literal('batch_cancelled'),
  properties: z.object({
    batch_id: z.string(),
    user_id: z.string(),
    template_slug: z.string(),
    reason: z.enum(['user_cancelled', 'insufficient_credits', 'system_error']),
    credits_refunded: z.number().min(0),
  }),
});

// Credits Events
export const creditsPurchasedSchema = z.object({
  event: z.literal('credits_purchased'),
  properties: z.object({
    user_id: z.string(),
    amount: z.number().min(1),
    currency: z.string(),
    payment_method: z.enum(['stripe', 'paypal', 'crypto']),
    transaction_id: z.string(),
  }),
});

export const subscriptionStartedSchema = z.object({
  event: z.literal('subscription_started'),
  properties: z.object({
    user_id: z.string(),
    plan_id: z.string(),
    plan_name: z.string(),
    billing_interval: z.enum(['monthly', 'yearly']),
    amount: z.number().min(0),
    currency: z.string(),
  }),
});

export const subscriptionCancelledSchema = z.object({
  event: z.literal('subscription_cancelled'),
  properties: z.object({
    user_id: z.string(),
    plan_id: z.string(),
    plan_name: z.string(),
    cancellation_reason: z.string().optional(),
    remaining_credits: z.number().min(0),
  }),
});

export const insufficientCreditsSchema = z.object({
  event: z.literal('insufficient_credits'),
  properties: z.object({
    user_id: z.string(),
    required_credits: z.number().min(1),
    available_credits: z.number().min(0),
    operation_type: z.enum(['generation', 'batch']),
  }),
});

// Navigation Events
export const pricingViewedSchema = z.object({
  event: z.literal('pricing_viewed'),
  properties: z.object({
    user_id: z.string().optional(),
    source_page: z.string(),
  }),
});

export const dashboardViewedSchema = z.object({
  event: z.literal('dashboard_viewed'),
  properties: z.object({
    user_id: z.string(),
    session_id: z.string(),
  }),
});

export const templateSelectedSchema = z.object({
  event: z.literal('template_selected'),
  properties: z.object({
    user_id: z.string(),
    template_slug: z.string(),
    source: z.enum(['dashboard', 'batch', 'direct_link']),
  }),
});

// Error Events
export const errorOccurredSchema = z.object({
  event: z.literal('error_occurred'),
  properties: z.object({
    user_id: z.string().optional(),
    error_type: z.string(),
    error_message: z.string(),
    component: z.string(),
    url: z.string(),
    user_agent: z.string().optional(),
  }),
});

export const rateLimitHitSchema = z.object({
  event: z.literal('rate_limit_hit'),
  properties: z.object({
    user_id: z.string().optional(),
    limit_type: z.enum(['generation_per_hour', 'generation_per_day', 'api_requests_per_minute']),
    current_count: z.number().min(0),
    limit: z.number().min(1),
  }),
});

// TypeScript types derived from schemas
export type UserSignedUpEvent = z.infer<typeof userSignedUpSchema>;
export type UserLoggedInEvent = z.infer<typeof userLoggedInSchema>;
export type UserLoggedOutEvent = z.infer<typeof userLoggedOutSchema>;

export type GenerationStartedEvent = z.infer<typeof generationStartedSchema>;
export type GenerationCompletedEvent = z.infer<typeof generationCompletedSchema>;
export type GenerationFailedEvent = z.infer<typeof generationFailedSchema>;
export type ImageDownloadedEvent = z.infer<typeof imageDownloadedSchema>;

export type BatchCreatedEvent = z.infer<typeof batchCreatedSchema>;
export type BatchCompletedEvent = z.infer<typeof batchCompletedSchema>;
export type BatchCancelledEvent = z.infer<typeof batchCancelledSchema>;

export type CreditsPurchasedEvent = z.infer<typeof creditsPurchasedSchema>;
export type SubscriptionStartedEvent = z.infer<typeof subscriptionStartedSchema>;
export type SubscriptionCancelledEvent = z.infer<typeof subscriptionCancelledSchema>;
export type InsufficientCreditsEvent = z.infer<typeof insufficientCreditsSchema>;

export type PricingViewedEvent = z.infer<typeof pricingViewedSchema>;
export type DashboardViewedEvent = z.infer<typeof dashboardViewedSchema>;
export type TemplateSelectedEvent = z.infer<typeof templateSelectedSchema>;

export type ErrorOccurredEvent = z.infer<typeof errorOccurredSchema>;
export type RateLimitHitEvent = z.infer<typeof rateLimitHitSchema>;

// Discriminated union of all event types
export type AnalyticsEvent =
  | UserSignedUpEvent
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | GenerationStartedEvent
  | GenerationCompletedEvent
  | GenerationFailedEvent
  | ImageDownloadedEvent
  | BatchCreatedEvent
  | BatchCompletedEvent
  | BatchCancelledEvent
  | CreditsPurchasedEvent
  | SubscriptionStartedEvent
  | SubscriptionCancelledEvent
  | InsufficientCreditsEvent
  | PricingViewedEvent
  | DashboardViewedEvent
  | TemplateSelectedEvent
  | ErrorOccurredEvent
  | RateLimitHitEvent;

// Schema registry for runtime validation
export const analyticsEventSchemas = {
  user_signed_up: userSignedUpSchema,
  user_logged_in: userLoggedInSchema,
  user_logged_out: userLoggedOutSchema,
  generation_started: generationStartedSchema,
  generation_completed: generationCompletedSchema,
  generation_failed: generationFailedSchema,
  image_downloaded: imageDownloadedSchema,
  batch_created: batchCreatedSchema,
  batch_completed: batchCompletedSchema,
  batch_cancelled: batchCancelledSchema,
  credits_purchased: creditsPurchasedSchema,
  subscription_started: subscriptionStartedSchema,
  subscription_cancelled: subscriptionCancelledSchema,
  insufficient_credits: insufficientCreditsSchema,
  pricing_viewed: pricingViewedSchema,
  dashboard_viewed: dashboardViewedSchema,
  template_selected: templateSelectedSchema,
  error_occurred: errorOccurredSchema,
  rate_limit_hit: rateLimitHitSchema,
} as const;

// Helper function to validate an analytics event
export function validateAnalyticsEvent(event: unknown): event is AnalyticsEvent {
  if (!event || typeof event !== 'object' || !('event' in event)) {
    return false;
  }

  const eventObj = event as Record<string, unknown>;
  const eventType = eventObj.event;

  if (typeof eventType !== 'string') {
    return false;
  }

  const schema = analyticsEventSchemas[eventType as keyof typeof analyticsEventSchemas];

  if (!schema) {
    return false;
  }

  const result = schema.safeParse(event);
  return result.success;
}