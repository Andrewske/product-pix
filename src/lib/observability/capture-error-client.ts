'use client';

import type { ProductPixError } from '@/lib/errors';
import { getPostHog } from '@/lib/posthog/client';
import type { CaptureErrorOptions } from './types';
import { createPostHogErrorProperties } from './types';

/**
 * CLIENT-ONLY: Captures errors in browser using posthog-js
 *
 * Behavior:
 * - Logs to console (always)
 * - Sends to PostHog if initialized (best effort)
 * - Does NOT write to database (no service role access)
 * - Does NOT use logger (server-only)
 *
 * For server-side capture, use: @/lib/observability/capture-error
 */
export async function captureError(
  error: ProductPixError,
  options?: CaptureErrorOptions
): Promise<void> {
  // Always log for debugging
  console.error('[ProductPix Error]', {
    name: error.name,
    message: error.message,
    code: error.errorCode,
    severity: error.severity,
    route: options?.route,
  });

  // Best-effort PostHog capture
  try {
    const posthog = getPostHog();
    if (!posthog) return;

    const properties = createPostHogErrorProperties(error, options?.route);
    posthog.capture('error_occurred', properties);
  } catch (captureFailure) {
    // Fail silently - already in error state
    console.error('[ProductPix] Failed to capture to PostHog:', captureFailure);
  }
}
