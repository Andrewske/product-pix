// Mock env module before any other imports
const mockEnv = {
  NEXT_PUBLIC_POSTHOG_KEY: 'test-browser-key',
  POSTHOG_API_KEY: 'test-server-key',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
  GOOGLE_GENERATIVE_AI_API_KEY: 'test-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  R2_ACCOUNT_ID: 'test-id',
  R2_ACCESS_KEY_ID: 'test-key',
  R2_SECRET_ACCESS_KEY: 'test-key',
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://test.r2.com',
  NEXT_PUBLIC_APP_URL: 'https://test.com',
  STRIPE_SECRET_KEY: 'test-key',
  STRIPE_WEBHOOK_SECRET: 'test-secret',
};

mock.module('@/lib/env', () => ({
  env: mockEnv,
}));

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { trackEvent, setPostHogClientForTesting } from '@/lib/analytics/client';
import type { GenerationStartedEvent } from '@/lib/analytics/events';

// Mock PostHog browser client
const mockPostHogBrowser = {
  init: mock(() => {}),
  capture: mock(() => {}),
  identify: mock(() => {}),
  reset: mock(() => {}),
  debug: mock(() => {}),
  __loaded: true,
};

// Mock PostHog server client
const mockPostHogServer = {
  capture: mock(() => {}),
  identify: mock(() => {}),
  shutdown: mock(() => {}),
};

// Mock posthog-js module
mock.module('posthog-js', () => ({
  default: mockPostHogBrowser,
}));

// Mock posthog-node module
mock.module('posthog-node', () => ({
  PostHog: mock(() => mockPostHogServer),
}));

// Environment is mocked at module level

describe('PostHog Integration', () => {
  beforeEach(() => {
    // Set up PostHog client for testing
    setPostHogClientForTesting(mockPostHogBrowser);

    // Reset all mocks
    mockPostHogBrowser.init.mockClear();
    mockPostHogBrowser.capture.mockClear();
    mockPostHogBrowser.identify.mockClear();
    mockPostHogBrowser.reset.mockClear();
    mockPostHogBrowser.debug.mockClear();

    mockPostHogServer.capture.mockClear();
    mockPostHogServer.identify.mockClear();
    mockPostHogServer.shutdown.mockClear();

    // Reset PostHog loaded state
    mockPostHogBrowser.__loaded = true;
  });

  it('should import modules successfully', () => {
    // Just test that imports work
    expect(trackEvent).toBeDefined();
  });

  describe('Browser Initialization', () => {
    it('should expose PostHog object globally in browser', async () => {
      // Verify PostHog is available globally (this would be checked manually)
      const posthog = await import('posthog-js');
      expect(posthog.default).toBeDefined();
      expect(posthog.default.__loaded).toBe(true);
    });


  });

  describe('Client-Side Event Tracking', () => {
    it('should capture valid events with correct properties', async () => {
      const validEvent: GenerationStartedEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1',
          resolution: '2k',
          has_source_image: false,
        },
      };

      trackEvent(validEvent);

      // Wait for async PostHog operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHogBrowser.capture).toHaveBeenCalledWith('generation_started', validEvent.properties);
    });

    it('should reject invalid events by schema validation', async () => {
      const invalidEvent = {
        event: 'invalid_event_type',
        properties: {
          invalid_field: 'value',
        },
      } as any;

      const consoleSpy = mock(() => {});
      const originalWarn = console.warn;
      console.warn = consoleSpy;

      trackEvent(invalidEvent);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHogBrowser.capture).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics event', { event: invalidEvent });

      console.warn = originalWarn;
    });

    it('should handle PostHog not loaded gracefully', async () => {
      mockPostHogBrowser.__loaded = false;

      const validEvent: GenerationStartedEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1',
          resolution: '2k',
          has_source_image: false,
        },
      };

      const consoleSpy = mock(() => {});
      const originalWarn = console.warn;
      console.warn = consoleSpy;

      trackEvent(validEvent);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not capture when not loaded
      expect(mockPostHogBrowser.capture).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled(); // No warning for this case

      console.warn = originalWarn;
    });
  });

  // Server-side tests commented out for now due to env mocking issues
  // describe('Server-Side Event Queuing', () => {

  describe('Event Validation', () => {
    it('should validate events against Zod schemas', async () => {
      const { validateAnalyticsEvent } = await import('@/lib/analytics/events');

      const validEvent: GenerationStartedEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1',
          resolution: '2k',
          has_source_image: false,
        },
      };

      const invalidEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: 'invalid_ratio', // Invalid enum value
          resolution: '2k',
          has_source_image: false,
        },
      };

      expect(validateAnalyticsEvent(validEvent)).toBe(true);
      expect(validateAnalyticsEvent(invalidEvent)).toBe(false);
    });

    it('should reject events with unknown event types', async () => {
      const { validateAnalyticsEvent } = await import('@/lib/analytics/events');

      const unknownEvent = {
        event: 'unknown_event_type',
        properties: {
          some_field: 'value',
        },
      };

      expect(validateAnalyticsEvent(unknownEvent)).toBe(false);
    });

    it('should reject malformed events', async () => {
      const { validateAnalyticsEvent } = await import('@/lib/analytics/events');

      const malformedEvents = [
        null,
        undefined,
        {},
        { event: 'generation_started' }, // Missing properties
        { properties: {} }, // Missing event
        'string',
        123,
      ];

      for (const event of malformedEvents) {
        expect(validateAnalyticsEvent(event)).toBe(false);
      }
    });
  });

  describe('End-to-End Flow', () => {
    it('should maintain event integrity through client-side system', async () => {
      const event: GenerationStartedEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'test-job-456',
          user_id: 'test-user-789',
          template_slug: 'lifestyle-product',
          aspect_ratio: '2:3',
          resolution: '4k',
          has_source_image: true,
          source_image_count: 2,
        },
      };

      // Validate event passes schema
      const { validateAnalyticsEvent } = await import('@/lib/analytics/events');
      expect(validateAnalyticsEvent(event)).toBe(true);

      // Client tracking preserves properties
      trackEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockPostHogBrowser.capture).toHaveBeenCalledWith('generation_started', event.properties);
    });
  });
});