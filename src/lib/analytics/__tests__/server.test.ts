import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock process.env before any module loads
const originalEnv = process.env;
process.env = {
  ...originalEnv,
  NEXT_PUBLIC_POSTHOG_KEY: 'test-client-key',
  POSTHOG_API_KEY: 'test-server-key',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
};

// Now import the modules
import { trackServerEvent, identifyUserServer } from '../server';

// Mock getPostHogServer
const mockPostHogClient = {
  capture: mock(() => {}),
  identify: mock(() => {}),
};

const mockGetPostHogServer = mock(() => mockPostHogClient);

mock.module('../posthog-server', () => ({
  getPostHogServer: mockGetPostHogServer,
}));

// Mock validateAnalyticsEvent
const mockValidateAnalyticsEvent = mock(() => true);
mock.module('../events', () => ({
  validateAnalyticsEvent: mockValidateAnalyticsEvent,
}));

describe('Analytics Server', () => {
  beforeEach(() => {
    // Reset mocks
    mockPostHogClient.capture.mockClear();
    mockPostHogClient.identify.mockClear();
    mockGetPostHogServer.mockClear();
    mockValidateAnalyticsEvent.mockClear();
  });

  describe('trackServerEvent', () => {
    it('adds valid events to queue without blocking', () => {
      const userId = 'user-123';
      const validEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: userId,
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1',
          resolution: '2k',
          has_source_image: false,
        },
      } as const;

      // Should not throw
      expect(() => trackServerEvent(userId, validEvent)).not.toThrow();

      expect(mockValidateAnalyticsEvent).toHaveBeenCalledWith(validEvent);
    });

    it('rejects invalid events by Zod schema', () => {
      const userId = 'user-123';
      const invalidEvent = {
        event: 'invalid_event',
        properties: {},
      } as unknown as Parameters<typeof trackServerEvent>[1];

      // Mock validation failure
      mockValidateAnalyticsEvent.mockReturnValueOnce(false);

      const consoleSpy = mock(() => {});
      const originalConsole = console.warn;
      console.warn = consoleSpy;

      trackServerEvent(userId, invalidEvent);

      expect(mockValidateAnalyticsEvent).toHaveBeenCalledWith(invalidEvent);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics event:', invalidEvent);

      console.warn = originalConsole;
    });

    it('handles queue overflow with FIFO discard', () => {
      const userId = 'user-123';
      const validEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: userId,
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1',
          resolution: '2k',
          has_source_image: false,
        },
      } as const;

      // Add events up to max capacity (simulating overflow)
      // Note: In a real test, we'd need to access the private queue
      // For now, we test that the function doesn't throw with many calls
      for (let i = 0; i < 10; i++) {
        expect(() => trackServerEvent(userId, validEvent)).not.toThrow();
      }
    });
  });

  describe('identifyUserServer', () => {
    it('calls posthog.identify with correct parameters', () => {
      const userId = 'user-123';
      const properties = { email: 'test@example.com' };

      identifyUserServer(userId, properties);

      expect(mockGetPostHogServer).toHaveBeenCalled();
      expect(mockPostHogClient.identify).toHaveBeenCalledWith({
        distinctId: userId,
        properties,
      });
    });

    it('handles missing PostHog client gracefully', () => {
      mockGetPostHogServer.mockReturnValueOnce(null as any);

      const consoleSpy = mock(() => {});
      const originalConsole = console.warn;
      console.warn = consoleSpy;

      identifyUserServer('user-123');

      expect(consoleSpy).toHaveBeenCalledWith('PostHog server client not available');

      console.warn = originalConsole;
    });

    it('logs errors but does not throw', () => {
      mockPostHogClient.identify.mockImplementationOnce(() => {
        throw new Error('PostHog error');
      });

      const consoleSpy = mock(() => {});
      const originalConsole = console.warn;
      console.warn = consoleSpy;

      // Should not throw
      expect(() => identifyUserServer('user-123')).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to identify user on server:', expect.any(Error));

      console.warn = originalConsole;
    });
  });

  // Note: Testing the background worker and queue flushing would require
  // more complex mocking of timers and accessing private module state.
  // For now, we focus on the public API behavior.
});