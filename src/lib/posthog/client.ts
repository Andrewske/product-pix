export async function getPostHog(): Promise<typeof import('posthog-js') | null> {
  if (typeof window === 'undefined') return null;
  return await import('posthog-js');
}