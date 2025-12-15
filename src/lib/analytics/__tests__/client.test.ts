import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { trackEvent, identifyUser, resetUser, isUserIdentified, setPostHogClientForTesting, resetUserIdentificationState } from '../client';
import type { GenerationStartedEvent } from '../events';

// Mock PostHog
const mockPostHog = {
  capture: mock(() => {}),
  identify: mock(() => {}),
  reset: mock(() => {}),
  __loaded: true,
};

// Set up PostHog client for testing
setPostHogClientForTesting(mockPostHog);

// Mock validateAnalyticsEvent
const mockValidateAnalyticsEvent = mock(() => true);
mock.module('../events', () => ({
  validateAnalyticsEvent: mockValidateAnalyticsEvent,
}));

describe('Analytics Client', () => {
  beforeEach(() => {
    // Reset mocks
    mockPostHog.capture.mockClear();
    mockPostHog.identify.mockClear();
    mockPostHog.reset.mockClear();
    mockValidateAnalyticsEvent.mockClear();

    // Reset the global identified user state
    resetUserIdentificationState();
  });

  describe('trackEvent', () => {
    it('validates event before capturing', async () => {
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

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockValidateAnalyticsEvent).toHaveBeenCalledWith(validEvent);
      expect(mockPostHog.capture).toHaveBeenCalledWith('generation_started', validEvent.properties);
    });

    it('rejects invalid events', async () => {
      const invalidEvent = {
        event: 'invalid_event',
        properties: {},
      } as any;

      // Mock validation failure
      mockValidateAnalyticsEvent.mockReturnValueOnce(false);

      const consoleSpy = mock(() => {});
      const originalConsole = console.warn;
      console.warn = consoleSpy;

      trackEvent(invalidEvent);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockValidateAnalyticsEvent).toHaveBeenCalledWith(invalidEvent);
      expect(mockPostHog.capture).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics event:', invalidEvent);

      console.warn = originalConsole;
    });
  });

  describe('identifyUser', () => {
    it('calls posthog.identify with user ID', async () => {
      const userId = 'user-123';
      const properties = { email: 'test@example.com' };

      identifyUser(userId, properties);

      // Wait for dynamic import to resolve
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockPostHog.identify).toHaveBeenCalledWith(userId, properties);
    });

    it('prevents duplicate identification', async () => {
      const userId = 'user-123';

      // First call
      identifyUser(userId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Second call with same user ID
      identifyUser(userId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should only be called once
      expect(mockPostHog.identify).toHaveBeenCalledTimes(1);
      expect(mockPostHog.identify).toHaveBeenCalledWith(userId, undefined);
    });

    it('allows re-identification after reset', async () => {
      const userId = 'user-123';

      identifyUser(userId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      resetUser();
      await new Promise((resolve) => setTimeout(resolve, 0));

      identifyUser(userId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHog.identify).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetUser', () => {
    it('calls posthog.reset', async () => {
      resetUser();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHog.reset).toHaveBeenCalled();
    });

    it('clears identified user state', () => {
      identifyUser('user-123');
      expect(isUserIdentified()).toBe(true);

      resetUser();
      expect(isUserIdentified()).toBe(false);
    });
  });

  describe('isUserIdentified', () => {
    it('returns false initially', () => {
      expect(isUserIdentified()).toBe(false);
    });

    it('returns true after identifying user', () => {
      identifyUser('user-123');
      expect(isUserIdentified()).toBe(true);
    });

    it('returns false after reset', () => {
      identifyUser('user-123');
      expect(isUserIdentified()).toBe(true);

      resetUser();
      expect(isUserIdentified()).toBe(false);
    });
  });
});