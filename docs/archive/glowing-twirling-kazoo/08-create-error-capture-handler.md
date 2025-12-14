# Create Error Capture Handler with Three-Tier Fallback

## Files to Modify/Create
- `src/lib/observability/capture-error.ts` (new)
- `src/lib/observability/index.ts` (new - barrel export)

## Implementation Details

Create central error capture handler with three-tier storage strategy. PostHog is called directly (library handles batching/retries), not via database queue.

```typescript
import { ProductPixError } from '@/lib/errors';
import { logger } from '@/lib/logging';
import { saveCriticalError } from '@/lib/db/critical-errors';
import { saveObservabilityFailure } from '@/lib/db/observability-failures';
import { getPostHogServer, sanitizeForPostHog } from '@/lib/posthog';
import { env } from '@/lib/env';

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
```

### Barrel Export

Create `src/lib/observability/index.ts`:

```typescript
export { captureError } from './capture-error';
```

## Three-Tier Strategy

1. **Vercel Logs** (Tier 1): All errors - structured JSON with requestId auto-added by logger
2. **Database** (Tier 2): Critical errors only - full context + PII, under your control
3. **PostHog** (Tier 3): All errors - sanitized (no PII), called directly via posthog-node

**Why no queue?** PostHog-node already handles:
- Batching (flushAt: 20 events)
- Periodic flushing (flushInterval: 10000ms)
- Retries on failure
- Graceful shutdown

## Acceptance Criteria
- [ ] captureError() accepts ProductPixError and optional route
- [ ] Tier 1: Always calls logger.error() with full context
- [ ] Tier 2: Critical errors saved to database
- [ ] Tier 3: All errors sent to PostHog directly (when enabled)
- [ ] PII sanitized before PostHog
- [ ] Fallback to observability_failures on failure
- [ ] Graceful degradation (logs if everything else fails)
- [ ] No database queue for PostHog events
- [ ] Barrel export created

## Dependencies
- Task 02 (error classes)
- Task 04 (logger with context injection)
- Task 06 (database functions)
- Task 07 (PostHog + sanitization)
