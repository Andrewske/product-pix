import posthog from 'posthog-js';

export { posthog };

export function getPostHog(): typeof posthog | null {
  if (typeof window === 'undefined') return null;
  return posthog;
}