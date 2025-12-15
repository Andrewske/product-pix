import { describe, it, expect, mock } from 'bun:test';
import { createClientConfig, createServerConfig } from '../config';

// Mock environment variables
mock.module('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
  },
}));

describe('Analytics Config', () => {
  describe('createClientConfig', () => {
    it('returns valid PostHog client config with privacy settings', () => {
      const config = createClientConfig();

      expect(config).toEqual({
        api_host: 'https://us.posthog.com',
        loaded: expect.any(Function),
        capture_pageview: false,
        capture_pageleave: true,
        mask_all_inputs: true,
        mask_all_text: true,
        mask_all_element_attributes: true,
        person_profiles: 'identified_only',
        session_recording: {
          maskTextSelector: '*',
          maskAllInputs: true,
        },
      });
    });

    it('loaded callback disables autocapture', () => {
      const config = createClientConfig();
      const mockPosthog = { __autocapture: true } as any;

      config.loaded(mockPosthog);

      expect(mockPosthog.__autocapture).toBe(false);
    });
  });

  describe('createServerConfig', () => {
    it('returns valid PostHog server config with batching enabled', () => {
      const config = createServerConfig();

      expect(config).toEqual({
        host: 'https://us.posthog.com',
        flushAt: 20,
        flushInterval: 10000,
      });
    });
  });
});