import type { ProductPixError } from '@/lib/errors';

import { env } from '@/lib/env';
import { saveCriticalError } from '@/lib/db/critical-errors';
import { saveObservabilityFailure } from '@/lib/db/observability-failures';
import { logger } from '@/lib/logging';
import { getPostHogServer, sanitizeForPostHog } from '@/lib/posthog';

/**
 * Logs error to Vercel with structured context (Tier 1)
 */
function logToVercel(error: ProductPixError): void {
  logger.error(error.message, {
    errorCode: error.errorCode,
    severity: error.severity,
    domain: error.domain,
    stack: error.stack,
    ...error.context,
  });
}

/**
 * Saves critical errors to database with full context (Tier 2)
 */
async function saveCriticalToDatabase(
  error: ProductPixError,
  route?: string
): Promise<void> {
  await saveCriticalError({
    userId: error.userId,
    errorName: error.name,
    errorMessage: error.message,
    errorCode: error.errorCode,
    errorStack: error.stack,
    severity: error.severity,
    domain: error.domain,
    route,
    context: error.context,
  });
}

/**
 * Creates sanitized properties object for PostHog capture
 */
function createPostHogProperties(
  error: ProductPixError,
  route?: string
): Record<string, unknown> {
  const sanitizedContext = sanitizeForPostHog(error.context);

  return {
    error_name: error.name,
    error_message: error.message,
    error_code: error.errorCode,
    severity: error.severity,
    domain: error.domain,
    route,
    retryable: error.retryable,
    ...sanitizedContext,
  };
}

/**
 * Sends sanitized error data to PostHog analytics (Tier 3)
 */
async function sendToPostHog(
  error: ProductPixError,
  route?: string
): Promise<void> {
  const posthog = getPostHogServer();
  if (!posthog) return;

  const properties = createPostHogProperties(error, route);

  posthog.capture({
    distinctId: error.userId || 'anonymous',
    event: 'error_occurred',
    properties,
  });
}

/**
 * Logs observability system failure to console
 */
function logObservabilityFailure(
  originalError: ProductPixError,
  captureFailure: unknown
): void {
  logger.error('OBSERVABILITY_FAILURE', {
    originalError: originalError.name,
    captureError: captureFailure instanceof Error ? captureFailure.message : 'Unknown',
  });
}

/**
 * Saves observability failure to database as fallback
 */
async function saveObservabilityFailureToDb(
  originalError: ProductPixError,
  captureFailure: unknown
): Promise<void> {
  await saveObservabilityFailure({
    errorData: {
      name: originalError.name,
      message: originalError.message,
      context: originalError.context,
      stack: originalError.stack,
    },
    failureReason: captureFailure instanceof Error ? captureFailure.message : 'Unknown',
    occurredAt: new Date().toISOString(),
  });
}

/**
 * Handles failures in the observability system itself
 */
async function handleObservabilityFailure(
  originalError: ProductPixError,
  captureFailure: unknown
): Promise<void> {
  logObservabilityFailure(originalError, captureFailure);

  try {
    await saveObservabilityFailureToDb(originalError, captureFailure);
  } catch (failureError) {
    logger.error('OBSERVABILITY_FAILURE_TABLE_FAILED', {
      failureError: failureError instanceof Error ? failureError.message : 'Unknown',
    });
  }
}

/**
 * Performs three-tier error capture: logs → database → analytics
 */
async function performThreeTierCapture(
  error: ProductPixError,
  route?: string
): Promise<void> {
  const isCritical = error.severity === 'critical';

  // Tier 1: Always log to Vercel (structured JSON with requestId auto-added)
  logToVercel(error);

  // Tier 2: Database for critical errors (full context + PII)
  if (isCritical) {
    await saveCriticalToDatabase(error, route);
  }

  // Tier 3: PostHog directly (sanitized, no PII)
  // Library handles batching (flushAt: 20, flushInterval: 10000) and retries
  if (env.OBSERVABILITY_ENABLED) {
    await sendToPostHog(error, route);
  }
}

/**
 * Captures errors with three-tier fallback: Vercel logs → Database → PostHog
 * Implements graceful degradation and observability failure tracking
 */
export async function captureError(
  error: ProductPixError,
  options?: { route?: string }
): Promise<void> {
  try {
    await performThreeTierCapture(error, options?.route);
  } catch (captureFailure) {
    // Fallback: Handle observability system failures
    await handleObservabilityFailure(error, captureFailure);
  }
}