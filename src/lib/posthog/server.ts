import { PostHog } from 'posthog-node';
import { env } from '@/lib/env';

let _client: PostHog | null = null;
let _shutdownRegistered = false;

export function getPostHogServer(): PostHog | null {
  if (env.OBSERVABILITY_ENABLED !== 'true' || !env.POSTHOG_API_KEY) {
    return null;
  }

  if (!_client) {
    _client = new PostHog(env.POSTHOG_API_KEY, {
      host: env.POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    });

    // Register graceful shutdown handler once
    if (!_shutdownRegistered) {
      _shutdownRegistered = true;
      process.on('SIGTERM', async () => {
        await _client?.shutdown();
      });
      process.on('SIGINT', async () => {
        await _client?.shutdown();
      });
    }
  }

  return _client;
}