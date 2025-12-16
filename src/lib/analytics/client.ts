'use client';

import { validateAnalyticsEvent, type AnalyticsEvent } from './events';

// Global PostHog client for testing
let posthogClient: {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  __loaded: boolean;
} | null = null;

// Set PostHog client for testing
export function setPostHogClientForTesting(client: {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  __loaded: boolean;
}): void {
  posthogClient = client;
}

// Helper function for PostHog access
async function getPostHogClient(): Promise<{
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  __loaded: boolean;
}> {
  if (posthogClient) {
    return posthogClient; // For testing
  }
  const posthog = await import('posthog-js');

  // Initialize PostHog if not already initialized
  if (!posthog.default.__loaded && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    const { createClientConfig } = await import('./config');
    // @ts-expect-error - PostHog library typing issue with loaded callback
    posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, createClientConfig());

    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      posthog.default.debug();
    }
  }

  return posthog.default;
}

/**
 * Tracks an analytics event with type-safe validation
 */
export function trackEvent<T extends AnalyticsEvent>(event: T): void {
  // Dynamic import to avoid SSR issues
  import('@/lib/logging').then(({ logger }) => {
    // Validate event against Zod schemas
    if (!validateAnalyticsEvent(event)) {
      logger.warn('Invalid analytics event', { event });
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      getPostHogClient().then((posthog) => {
        if (posthog.__loaded) {
          posthog.capture(event.event, event.properties);
        }
      }).catch((error) => {
        logger.warn('Failed to track analytics event', { error });
      });
    } catch (error) {
      logger.warn('Failed to track analytics event', { error });
    }
  });
}

let identifiedUserId: string | null = null;

/**
 * Identifies a user with optional properties, preventing duplicate identification
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  // Prevent duplicate identification
  if (identifiedUserId === userId) {
    return;
  }

  identifiedUserId = userId;

  // Dynamic import to avoid SSR issues
  import('@/lib/logging').then(({ logger }) => {
    try {
      // Dynamic import to avoid SSR issues
      getPostHogClient().then((posthog) => {
        if (posthog.__loaded) {
          posthog.identify(userId, properties);
        }
      }).catch((error) => {
        logger.warn('Failed to identify user', { error });
      });
    } catch (error) {
      logger.warn('Failed to identify user', { error });
    }
  });
}

/**
 * Resets the current user identification
 */
export function resetUser(): void {
  identifiedUserId = null;

  // Dynamic import to avoid SSR issues
  import('@/lib/logging').then(({ logger }) => {
    try {
      // Dynamic import to avoid SSR issues
      getPostHogClient().then((posthog) => {
        if (posthog.__loaded) {
          posthog.reset();
        }
      }).catch((error) => {
        logger.warn('Failed to reset user', { error });
      });
    } catch (error) {
      logger.warn('Failed to reset user', { error });
    }
  });
}

/**
 * Checks if a user is currently identified
 */
export function isUserIdentified(): boolean {
  return identifiedUserId !== null;
}

/**
 * Reset user identification state (for testing)
 */
export function resetUserIdentificationState(): void {
  identifiedUserId = null;
}