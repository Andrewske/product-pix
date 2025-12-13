// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateObservabilityConfig } = await import('@/lib/observability/validate-config');
    validateObservabilityConfig();
  }
}