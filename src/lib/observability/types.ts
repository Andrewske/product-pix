import type { ProductPixError } from '@/lib/errors';
import { sanitizeForPostHog } from '@/lib/posthog/sanitize';

export interface CaptureErrorOptions {
  route?: string;
}

export interface PostHogErrorProperties {
  error_name: string;
  error_message: string;
  error_code: string;
  severity: string;
  domain: string;
  route?: string;
  retryable: boolean;
  [key: string]: unknown;
}

/**
 * Creates sanitized properties object for PostHog capture
 * Shared between client and server capture implementations
 */
export function createPostHogErrorProperties(
  error: ProductPixError,
  route?: string
): PostHogErrorProperties {
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
