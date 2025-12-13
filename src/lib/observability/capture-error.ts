import type { ProductPixError } from '@/lib/errors';

import { env } from '@/lib/env';
import { saveCriticalError } from '@/lib/db/critical-errors';
import { saveObservabilityFailure } from '@/lib/db/observability-failures';
import { logger } from '@/lib/logging';
import { getPostHogServer, sanitizeForPostHog } from '@/lib/posthog';

export async function captureError(
  error: ProductPixError,
  options?: { route?: string }
): Promise<void> {
  const isCritical = error.severity === 'critical';

  try {
    // Tier 1: Always log to Vercel (structured JSON with requestId auto-added)
    logger.error(error.message, {
      errorCode: error.errorCode,
      severity: error.severity,
      domain: error.domain,
      stack: error.stack,
      ...error.context,
    });

    // Tier 2: Database for critical errors (full context + PII)
    if (isCritical) {
      await saveCriticalError({
        userId: error.userId,
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.errorCode,
        errorStack: error.stack,
        severity: error.severity,
        domain: error.domain,
        route: options?.route,
        context: error.context,
      });
    }

    // Tier 3: PostHog directly (sanitized, no PII)
    // Library handles batching (flushAt: 20, flushInterval: 10000) and retries
    if (env.OBSERVABILITY_ENABLED) {
      const posthog = getPostHogServer();
      if (posthog) {
        const sanitizedContext = sanitizeForPostHog(error.context);

        posthog.capture({
          distinctId: error.userId || 'anonymous',
          event: 'error_occurred',
          properties: {
            error_name: error.name,
            error_message: error.message,
            error_code: error.errorCode,
            severity: error.severity,
            domain: error.domain,
            route: options?.route,
            retryable: error.retryable,
            ...sanitizedContext,
          },
        });
      }
    }

  } catch (captureFailure) {
    // Fallback: Log observability failure
    logger.error('OBSERVABILITY_FAILURE', {
      originalError: error.name,
      captureError: captureFailure instanceof Error ? captureFailure.message : 'Unknown',
    });

    try {
      await saveObservabilityFailure({
        errorData: {
          name: error.name,
          message: error.message,
          context: error.context,
          stack: error.stack,
        },
        failureReason: captureFailure instanceof Error ? captureFailure.message : 'Unknown',
        occurredAt: new Date().toISOString(),
      });
    } catch (failureError) {
      // Even failure table failed - only logs remain
      logger.error('OBSERVABILITY_FAILURE_TABLE_FAILED', {
        failureError: failureError instanceof Error ? failureError.message : 'Unknown',
      });
    }
  }
}