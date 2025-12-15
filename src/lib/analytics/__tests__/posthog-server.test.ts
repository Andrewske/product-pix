import { describe, it, expect, mock } from 'bun:test';

// Mock PostHog
const mockPostHogClient = {
  shutdown: mock(() => {}),
};

// Mock the PostHog constructor
const MockPostHog = mock(() => mockPostHogClient);

// Mock the module
mock.module('posthog-node', () => ({
  PostHog: MockPostHog,
}));

// Mock createServerConfig
const mockServerConfig = {
  host: 'https://us.posthog.com',
  flushAt: 20,
  flushInterval: 10000,
};

mock.module('../config', () => ({
  createServerConfig: mock(() => mockServerConfig),
}));

describe('PostHog Server', () => {
  describe('getPostHogServer', () => {
    it('returns client when API key is present', () => {
      // Mock env with API key
      mock.module('@/lib/env', () => ({
        env: {
          POSTHOG_API_KEY: 'test-api-key',
          NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
        },
      }));

      // Force module re-initialization by clearing require cache
      const modulePath = require.resolve('../posthog-server');
      delete require.cache[modulePath];

      // Dynamic import to test fresh module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPostHogServer: freshGetPostHogServer } = require('../posthog-server');

      const client = freshGetPostHogServer();

      expect(client).toBe(mockPostHogClient);
      expect(MockPostHog).toHaveBeenCalledWith('test-api-key', mockServerConfig);
    });

    it('returns null when API key is missing', () => {
      // Mock env without API key - test the conditional logic
      mock.module('@/lib/env', () => ({
        env: {
          POSTHOG_API_KEY: undefined,
          NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
        },
      }));

      // Reset mock to check if constructor would be called
      MockPostHog.mockClear();

      // Force module re-initialization
      const modulePath = require.resolve('../posthog-server');
      delete require.cache[modulePath];

      // Dynamic import to test fresh module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPostHogServer: freshGetPostHogServer } = require('../posthog-server');

      const client = freshGetPostHogServer();

      // The module-level initialization should not create a client
      // when POSTHOG_API_KEY is undefined
      expect(MockPostHog).not.toHaveBeenCalled();
      expect(client).toBeNull();
    });
  });
});