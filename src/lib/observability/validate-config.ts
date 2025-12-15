import { env } from '@/lib/env';

export function validateObservabilityConfig(): void {
  // Only validate in production when observability is enabled
  if (process.env.NODE_ENV !== 'production') return;
  if (!env.OBSERVABILITY_ENABLED) return;

  const errors: string[] = [];

  if (!env.POSTHOG_API_KEY) {
    errors.push('POSTHOG_API_KEY required in production when OBSERVABILITY_ENABLED=true');
  }

  if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
    errors.push('NEXT_PUBLIC_POSTHOG_KEY required in production when OBSERVABILITY_ENABLED=true');
  }

  if (errors.length > 0) {
    throw new Error(`Observability configuration errors:\n${errors.join('\n')}`);
  }
}