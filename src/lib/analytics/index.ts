// Client-side exports (browser safe)
export * from './client';

// Server-side exports (Node.js only)
export * from './server';

// Re-export event types
export type {
  AnalyticsEvent,
  UserSignedUpEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  GenerationStartedEvent,
  GenerationCompletedEvent,
  GenerationFailedEvent,
  ImageDownloadedEvent,
  BatchCreatedEvent,
  BatchCompletedEvent,
  BatchCancelledEvent,
  CreditsPurchasedEvent,
  SubscriptionStartedEvent,
  SubscriptionCancelledEvent,
  InsufficientCreditsEvent,
  PricingViewedEvent,
  DashboardViewedEvent,
  TemplateSelectedEvent,
  ABTestExposureEvent,
  ErrorOccurredEvent,
  RateLimitHitEvent,
} from './events';