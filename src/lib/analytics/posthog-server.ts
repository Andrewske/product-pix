import { PostHog } from 'posthog-node';
import { env } from '@/lib/env';
import { createServerConfig } from './config';

let client: PostHog | null = null;

// Only initialize PostHog if observability is enabled and API key is present
if (env.OBSERVABILITY_ENABLED === 'true' && env.POSTHOG_API_KEY) {
  client = new PostHog(env.POSTHOG_API_KEY, createServerConfig());

  process.on('SIGTERM', () => client?.shutdown());
  process.on('SIGINT', () => client?.shutdown());
}

/**
 * Returns the PostHog server client instance
 */
export function getPostHogServer(): PostHog | null {
  return client;
}