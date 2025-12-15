// Re-export PostHogProvider
export { PostHogProvider } from './posthog-provider';

// Re-export client functions
export {
  trackEvent,
  identifyUser,
  resetUser,
  isUserIdentified,
} from './client';

// Re-export server functions
export {
  trackServerEvent,
  identifyUserServer,
} from './server';

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