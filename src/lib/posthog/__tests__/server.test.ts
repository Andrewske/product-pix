import { describe, it, expect, mock } from 'bun:test';

// Mock the env module
mock.module('@/lib/env', () => ({
  env: {
    OBSERVABILITY_ENABLED: 'true',
    POSTHOG_API_KEY: 'test-key',
    POSTHOG_HOST: 'https://app.posthog.com',
  },
}));

describe('getPostHogServer', () => {
  it('should return null when OBSERVABILITY_ENABLED is not "true"', async () => {
    mock.module('@/lib/env', () => ({
      env: { OBSERVABILITY_ENABLED: 'false', POSTHOG_API_KEY: 'test-key' },
    }));

    const { getPostHogServer: getServer } = await import('../server');
    const result = getServer();
    expect(result).toBeNull();
  });

  it('should return null when POSTHOG_API_KEY is missing', async () => {
    mock.module('@/lib/env', () => ({
      env: { OBSERVABILITY_ENABLED: 'true' },
    }));

    const { getPostHogServer: getServer } = await import('../server');
    const result = getServer();
    expect(result).toBeNull();
  });

  it('should return a PostHog client when enabled and key is present', async () => {
    mock.module('@/lib/env', () => ({
      env: { OBSERVABILITY_ENABLED: 'true', POSTHOG_API_KEY: 'test-key' },
    }));

    const { getPostHogServer: getServer } = await import('../server');
    const result = getServer();
    expect(result).not.toBeNull();
  });

  it('should return the same client instance on multiple calls', async () => {
    mock.module('@/lib/env', () => ({
      env: { OBSERVABILITY_ENABLED: 'true', POSTHOG_API_KEY: 'test-key' },
    }));

    const { getPostHogServer: getServer } = await import('../server');
    const result1 = getServer();
    const result2 = getServer();
    expect(result1).toBe(result2);
  });
});