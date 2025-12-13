# Error & Logging Observability System Implementation Plan

## Overview

Implement comprehensive error tracking and user activity timeline using PostHog as primary observability platform with database safety net for critical errors. Replace custom toast system with react-toastify and build admin dashboard for viewing user timelines.

**Architecture Decision:** PostHog-primary approach
- PostHog: All events (errors, user actions, analytics)
- Database: Critical errors only (payments, credits, auth, fatal generation errors)
- Admin Dashboard: Unified timeline merging both sources

## Key Decisions Validated

1. **Two-Tier Context Storage (PII Protection):**
   - **PostHog**: Sanitized context only - no PII (emails, IPs, payment details, stack traces)
   - **Database**: Full context including PII - under your control, GDPR-compliant deletion
   - **Rationale**: Keep analytics clean and shareable while preserving full forensics in database

2. **Error Classification:**
   - **All errors** use `ProductPixError` classes with `severity` and `domain` fields
   - **Severity levels**: critical, high, medium, low - determines urgency and DB persistence
   - **Domains**: payment, credit, generation, auth, validation, rate-limit - enables filtering

3. **Critical Paths** (severity: 'critical', persisted to DB):
   - Payment/checkout flows → `PaymentError`
   - Credit consumption/refunds → `CreditError`
   - Image generation (if credits consumed) → `GenerationError`
   - Auth flows → `AuthError`

## Architecture Diagram

```
Frontend/Backend Errors
         |
         v
Error Classification & Context Builder
         |
         +------------------+
         |                  |
    PostHog            Database
   (Primary)          (Critical Only)
         |                  |
         +--------+---------+
                  |
          Admin Dashboard
        (Unified Timeline)
```

## Phase 1: Core Infrastructure

### 1.1 Install Dependencies

```bash
bun add posthog-js posthog-node react-toastify @tanstack/react-query
bun add -d @types/react-toastify
```

**Note:** We'll use the built-in React integration from `posthog-js` (no need for separate package - it's included in posthog-js).

### 1.2 Error Classes

**Create:** `src/lib/errors/error-classes.ts`

Define base `ProductPixError` class with:
- `userId?: string`
- `requestId?: string` - correlation ID for distributed tracing
- `context: ErrorContext` - standardized context object (see below)
- `severity: 'critical' | 'high' | 'medium' | 'low'`
- `domain: 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system'`
- `errorCode: string`
- `timestamp: string`
- `retryable?: boolean` - whether the operation can be retried

**Helper getter:**
- `get isCritical(): boolean` - returns `severity === 'critical'` for backward compatibility

**Standardized Error Context:**

```typescript
/**
 * Base context fields available for all errors
 */
interface BaseErrorContext {
  // Request context
  route?: string;
  method?: string; // 'GET', 'POST', etc.
  statusCode?: number;
  requestId?: string; // Correlation ID for distributed tracing

  // User context
  userId?: string;
  sessionId?: string;
  userAgent?: string;

  // Resource identifiers
  jobId?: string;
  templateId?: string;
  imageId?: string;
  orderId?: string;

  // Timing
  duration?: number; // milliseconds
  retryCount?: number;
  retryable?: boolean;

  // Metadata
  tags?: string[]; // For grouping/filtering
  environment?: 'production' | 'staging' | 'development';
}

/**
 * Domain-specific context extensions
 */
interface PaymentErrorContext extends BaseErrorContext {
  amount?: number;
  currency?: string;
  paymentIntentId?: string;
  customerId?: string;
  paymentMethod?: string; // e.g., 'card', 'bank_transfer'
  stripeErrorCode?: string;
}

interface CreditErrorContext extends BaseErrorContext {
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  operation?: 'consume' | 'add' | 'refund';
  reason?: string;
}

interface GenerationErrorContext extends BaseErrorContext {
  templateSlug?: string;
  creditsConsumed?: boolean;
  creditAmount?: number;
  modelUsed?: string;
  generationParams?: Record<string, unknown>;
  retryable?: boolean;
}

interface AuthErrorContext extends BaseErrorContext {
  authMethod?: 'password' | 'oauth' | 'magic_link';
  provider?: string; // e.g., 'google', 'github'
  emailDomain?: string; // Sanitized - domain only, not full email
}

interface ValidationErrorContext extends BaseErrorContext {
  field?: string;
  expectedType?: string;
  receivedType?: string;
  validationRule?: string;
}

interface RateLimitErrorContext extends BaseErrorContext {
  limit?: number;
  remaining?: number;
  resetAt?: string; // ISO timestamp
  endpoint?: string;
}

/**
 * Union type for all error contexts
 */
type ErrorContext =
  | BaseErrorContext
  | PaymentErrorContext
  | CreditErrorContext
  | GenerationErrorContext
  | AuthErrorContext
  | ValidationErrorContext
  | RateLimitErrorContext;
```

**Context Builder Utility:**

```typescript
/**
 * Helper to build error context with type safety
 */
export const ErrorContextBuilder = {
  base: (context: BaseErrorContext = {}): BaseErrorContext => ({
    environment: process.env.NODE_ENV as 'production' | 'staging' | 'development',
    ...context,
  }),

  payment: (context: PaymentErrorContext = {}): PaymentErrorContext => ({
    ...ErrorContextBuilder.base(context),
    currency: context.currency || 'usd',
    ...context,
  }),

  credit: (context: CreditErrorContext = {}): CreditErrorContext => ({
    ...ErrorContextBuilder.base(context),
    ...context,
  }),

  generation: (context: GenerationErrorContext = {}): GenerationErrorContext => ({
    ...ErrorContextBuilder.base(context),
    retryable: context.retryable ?? false,
    ...context,
  }),

  auth: (context: AuthErrorContext = {}): AuthErrorContext => ({
    ...ErrorContextBuilder.base(context),
    ...context,
  }),

  validation: (context: ValidationErrorContext = {}): ValidationErrorContext => ({
    ...ErrorContextBuilder.base(context),
    ...context,
  }),

  rateLimit: (context: RateLimitErrorContext = {}): RateLimitErrorContext => ({
    ...ErrorContextBuilder.base(context),
    ...context,
  }),
};
```

**Usage example:**

```typescript
// Before (ad-hoc context)
throw new PaymentError('Payment failed', {
  severity: 'critical',
  user_id: 'user-123',       // Inconsistent naming
  amt: 1000,                 // Abbreviated field
  stripe_err: 'card_declined', // Non-standard
});

// After (standardized context)
throw new PaymentError('Payment failed', {
  severity: 'critical',
  ...ErrorContextBuilder.payment({
    userId: 'user-123',       // Consistent naming
    amount: 1000,             // Full field name
    stripeErrorCode: 'card_declined', // Standardized field
    paymentIntentId: 'pi_123',
    currency: 'usd',
  }),
});
```

Define domain-specific error classes (all extend ProductPixError):

```typescript
class PaymentError extends ProductPixError {
  constructor(
    message: string,
    context: PaymentErrorContext & { severity?: 'critical' | 'high' | 'medium' | 'low' }
  ) {
    super(message);
    this.domain = 'payment';
    this.severity = context.severity ?? 'critical'; // Default critical
    this.context = ErrorContextBuilder.payment(context);
  }
}

class CreditError extends ProductPixError {
  constructor(
    message: string,
    context: CreditErrorContext & { severity?: 'critical' | 'high' | 'medium' | 'low' }
  ) {
    super(message);
    this.domain = 'credit';
    this.severity = context.severity ?? 'critical'; // Default critical
    this.context = ErrorContextBuilder.credit(context);
  }
}

class GenerationError extends ProductPixError {
  constructor(
    message: string,
    context: GenerationErrorContext & { severity?: 'critical' | 'high' | 'medium' | 'low' }
  ) {
    super(message);
    this.domain = 'generation';
    this.severity = context.severity ?? 'high'; // Default high (not all gen errors are critical)
    this.retryable = context.retryable ?? false;
    this.context = ErrorContextBuilder.generation(context);
  }
}

class AuthError extends ProductPixError {
  constructor(
    message: string,
    context: AuthErrorContext & { severity?: 'critical' | 'high' | 'medium' | 'low' }
  ) {
    super(message);
    this.domain = 'auth';
    this.severity = context.severity ?? 'critical'; // Default critical
    this.context = ErrorContextBuilder.auth(context);
  }
}

class RateLimitError extends ProductPixError {
  constructor(
    message: string,
    context: RateLimitErrorContext & { severity?: 'critical' | 'high' | 'medium' | 'low' }
  ) {
    super(message);
    this.domain = 'rate-limit';
    this.severity = context.severity ?? 'low'; // Default low
    this.retryable = true;
    this.context = ErrorContextBuilder.rateLimit(context);
  }
}

class ValidationError extends ProductPixError {
  constructor(
    message: string,
    context: ValidationErrorContext & { severity?: 'critical' | 'high' | 'medium' | 'low' }
  ) {
    super(message);
    this.domain = 'validation';
    this.severity = context.severity ?? 'low'; // Default low
    this.context = ErrorContextBuilder.validation(context);
  }
}
```

**Severity guidelines:**
- **critical**: Data loss, payment failures, auth breaches, system down - requires immediate attention
- **high**: Feature broken, incorrect behavior, user blocked - needs investigation
- **medium**: Degraded functionality, non-blocking issues - monitor and fix
- **low**: Validation errors, rate limits, expected failures - informational

**Context Field Naming Conventions:**
- Use camelCase for all field names (userId, not user_id)
- Use full field names, avoid abbreviations (amount, not amt; customerId, not cust_id)
- Use consistent terminology:
  - IDs end with "Id": userId, jobId, templateId
  - Amounts are numeric: amount, balanceBefore, balanceAfter
  - Timestamps are ISO strings: resetAt, createdAt
  - Booleans use "is", "has", "can": retryable, creditsConsumed
- Domain-specific prefixes only when needed for clarity: stripeErrorCode, paymentIntentId

**Required Context Fields by Domain:**

- **PaymentError**: MUST include amount, currency
- **CreditError**: MUST include amount, operation
- **GenerationError**: MUST include templateSlug, creditsConsumed
- **AuthError**: MUST include authMethod
- **RateLimitError**: MUST include limit, remaining, resetAt
- **ValidationError**: MUST include field, validationRule

**Recommended Context Fields (all domains):**
- Always include: userId (if available), route, requestId (if available)
- Include for debugging: duration, retryCount
- Include for grouping: tags, environment (auto-added by builder)

**Note:** For user-facing form validation (e.g., "Email is required"), use plain strings with `toast.error("message")`. ValidationError class is only for API-level validation failures worth tracking (e.g., malformed request payloads, schema violations).

### 1.3 Request ID Middleware (Correlation IDs)

**Purpose:** Generate unique IDs for each request to enable distributed tracing across API → DB → PostHog → logs.

**Create:** `src/middleware.ts` (or update existing)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

export function middleware(request: NextRequest) {
  // Generate unique request ID
  const requestId = randomUUID();

  // Create response
  const response = NextResponse.next();

  // Add request ID to response headers (visible to client)
  response.headers.set('x-request-id', requestId);

  // Store in request for use in route handlers
  // Note: Next.js middleware can't directly modify request object
  // Route handlers will need to extract from headers
  request.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Create:** `src/lib/request/get-request-id.ts`

Helper to extract request ID in route handlers and Server Actions:

```typescript
import { headers } from 'next/headers';

/**
 * Get the current request ID from headers
 * Returns undefined if not in request context (e.g., client-side)
 */
export async function getRequestId(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get('x-request-id') || undefined;
  } catch {
    // Not in request context (client-side or static rendering)
    return undefined;
  }
}

/**
 * Get request ID synchronously (for use in error handlers)
 * Use this when you can't await (e.g., catch blocks)
 */
export function getRequestIdSync(): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: try to get from response headers of last request
    return undefined;
  }
  // Server-side: This is tricky - prefer async version
  return undefined;
}
```

**Update ErrorContextBuilder:**

```typescript
export const ErrorContextBuilder = {
  base: async (context: BaseErrorContext = {}): Promise<BaseErrorContext> => ({
    environment: process.env.NODE_ENV as 'production' | 'staging' | 'development',
    requestId: context.requestId || await getRequestId(), // Auto-add requestId if available
    ...context,
  }),

  payment: async (context: PaymentErrorContext = {}): Promise<PaymentErrorContext> => ({
    ...await ErrorContextBuilder.base(context),
    currency: context.currency || 'usd',
    ...context,
  }),

  // ... other builders updated to use async base()
};
```

**Alternative: Synchronous version (if async is problematic):**

If async context builders are too cumbersome, use synchronous version with explicit passing:

```typescript
// In route handler
const requestId = await getRequestId();

throw new PaymentError('Payment failed', {
  severity: 'critical',
  requestId, // Explicitly pass
  amount: 1000,
});
```

**Usage in API routes:**

```typescript
// src/app/api/generate/route.ts
import { getRequestId } from '@/lib/request/get-request-id';

export async function POST(request: Request) {
  const requestId = await getRequestId();

  try {
    // ... generation logic
  } catch (error) {
    const generationError = new GenerationError('Generation failed', {
      severity: 'critical',
      requestId, // Include in error context
      templateSlug,
      creditsConsumed: true,
    });

    await captureError(generationError);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

**Logging integration:**

```typescript
// src/lib/logging/index.ts
import { getRequestId } from '@/lib/request/get-request-id';

export const logger = {
  error: async (message: string, meta?: Record<string, unknown>) => {
    const requestId = await getRequestId();
    console.error(JSON.stringify({
      level: 'error',
      message,
      requestId, // Include in all logs
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },

  // ... other log methods
};
```

**Benefits:**
- **Trace requests end-to-end:** Follow a single user action through API → DB → PostHog → logs
- **Debug distributed issues:** Link errors in PostHog to database entries and log lines
- **Performance analysis:** Measure total request duration across all components
- **Customer support:** User reports issue → search by requestId → see entire flow

**Querying by request ID:**

```bash
# Search PostHog
# Go to PostHog → Events → Filter by property: requestId = "uuid-here"

# Search database
SELECT * FROM critical_errors WHERE context->>'requestId' = 'uuid-here';

# Search logs
grep "uuid-here" /var/log/app.log

# Search PostHog queue
SELECT * FROM posthog_event_queue WHERE properties->>'requestId' = 'uuid-here';
```

### 1.4 PostHog Setup

**Create:** `src/lib/posthog/client.ts`

Simple re-export for accessing PostHog client:
```typescript
import posthog from 'posthog-js';

export { posthog };

// Helper to get PostHog instance (for use outside React components)
export function getPostHog() {
  if (typeof window === 'undefined') {
    return null;
  }
  return posthog;
}
```

**Note:** Initialization happens in `PostHogProvider` (Phase 6). This file just provides convenient access to the client.

**Create:** `src/lib/posthog/server.ts`
- Server-side PostHog client with `posthog-node`
- Flush settings: `flushAt: 20`, `flushInterval: 10000`
- Shutdown handler for graceful cleanup

**Create:** `src/lib/posthog/identify.ts`

```typescript
import { posthog } from './client';
import { posthogServer } from './server';
import { sanitizeEmail } from './sanitize';

export function identifyUser(
  userId: string,
  properties: {
    email?: string;
    is_admin?: boolean;
    credit_balance?: number;
    created_at?: string;
  }
) {
  const sanitizedProps: Record<string, unknown> = {
    is_admin: properties.is_admin,
    credit_balance: properties.credit_balance,
    created_at: properties.created_at,
  };

  // Sanitize email to domain only
  if (properties.email) {
    const { domain } = sanitizeEmail(properties.email);
    sanitizedProps.email_domain = domain;
  }

  // Client-side (if in browser)
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, sanitizedProps);
  }

  // Server-side (if in Node.js)
  if (typeof window === 'undefined' && posthogServer) {
    posthogServer.identify({
      distinctId: userId,
      properties: sanitizedProps,
    });
  }
}

export function resetUser() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset();
  }
}
```

**Key points:**
- Works in both client and server contexts
- Sanitizes PII before sending (email → domain only)
- No IP addresses, payment details, or credentials sent to PostHog
- Can also use `usePostHog()` hook in React components for direct access

**Create:** `src/lib/posthog/events.ts`

Define event constants: `ERROR_OCCURRED`, `ERROR_BOUNDARY_TRIGGERED`, etc.

Define `ErrorEventProperties` interface:
```typescript
interface ErrorEventProperties {
  // Standard fields (always included)
  error_name: string;
  error_message: string;
  error_code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  domain: 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system';
  requestId?: string; // Correlation ID for distributed tracing
  route?: string;
  user_agent?: string;

  // Rich context (critical paths only)
  request_payload?: Record<string, unknown>;
  state_snapshot?: Record<string, unknown>;
  recent_actions?: string[];
  session_info?: Record<string, unknown>;

  // Additional context from error.context
  [key: string]: unknown;
}
```

**PostHog event structure:**
- Event name: `error_occurred`
- Properties: Include `severity`, `domain`, and `requestId` for filtering/grouping/tracing
- Person properties: Updated with latest user context on identification

### 1.5 PII Scrubbing Utility

**Create:** `src/lib/posthog/sanitize.ts`

Two-tier context storage strategy:
- **PostHog**: Analytics-safe data only (patterns, trends, debugging metadata)
- **Database**: Full context including PII (under your control, GDPR-compliant deletion)

**Core function:** `sanitizeForPostHog(context: Record<string, unknown>): Record<string, unknown>`

**Allowlist approach - only these field patterns are safe:**
```typescript
const SAFE_FIELD_PATTERNS = [
  // IDs and codes (pseudonymous)
  /^(id|.*Id|.*_id)$/i,  // userId, jobId, templateId, etc.
  /^(code|.*Code|.*_code)$/i,  // errorCode, stripeCode, etc.

  // Numeric values
  /^(amount|balance|count|total|limit|retry|attempt)$/i,

  // Enum/categorical values
  /^(status|state|type|severity|domain|environment)$/i,

  // Safe metadata
  /^(route|path|method|statusCode|duration|timestamp)$/i,
  /^(country|region|timezone)$/i,  // Geographic (not city/IP)

  // Boolean flags
  /^(is|has|can|should|retryable).*$/i,
];

const UNSAFE_PATTERNS = [
  /email/i,
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /card/i,
  /cvv/i,
  /ssn/i,
  /address/i,
  /phone/i,
  /ip/i,
  /stack/i,
  /trace/i,
];
```

**Implementation:**
```typescript
export function sanitizeForPostHog(context: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip if unsafe field name
    if (UNSAFE_PATTERNS.some(pattern => pattern.test(key))) {
      continue;
    }

    // Only include if matches safe pattern
    if (SAFE_FIELD_PATTERNS.some(pattern => pattern.test(key))) {
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact email patterns
    value = value.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

    // Redact IP addresses
    value = value.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]');

    // Redact credit card patterns
    value = value.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]');

    // Redact tokens (long alphanumeric strings)
    value = value.replace(/\b[a-zA-Z0-9_-]{32,}\b/g, '[TOKEN_REDACTED]');
  }

  // Recursively sanitize objects and arrays
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeForPostHog(value as Record<string, unknown>);
  }

  return value;
}
```

**Special handling for common fields:**
```typescript
export function sanitizeEmail(email: string): { domain: string } {
  const domain = email.split('@')[1] || 'unknown';
  return { domain };
}

export function sanitizeIpAddress(ip: string): { country?: string } {
  // Use a geo-IP library or service to extract country code
  // Return only country, never the IP
  return { country: getCountryFromIp(ip) }; // Implementation needed
}
```

**GDPR Considerations:**
- PostHog data contains only pseudonymous `userId` (UUID) - not directly identifiable
- User can be deleted from database (including `critical_errors` table) - removes PII
- PostHog data retention: Configure in PostHog settings (30-90 days recommended)
- Right-to-erasure: Document that PostHog data auto-expires, DB data can be deleted on request

### 1.6 Error Capture Utility

**Create:** `src/lib/posthog/capture-error.ts`

Core function: `captureError(error, options)`

**Three-tier fallback strategy to prevent observability blind spots:**

**For critical errors (`ProductPixError` with `isCritical: true`):**
```typescript
import { sanitizeForPostHog } from '@/lib/posthog/sanitize';
import { env } from '@/lib/env';

async function captureError(error: ProductPixError, options?: CaptureOptions) {
  const observabilityEnabled = env.OBSERVABILITY_ENABLED ?? true;

  // Tier 1: Try database (source of truth for critical errors)
  // FULL context including PII - under your control
  try {
    await saveCriticalError({
      userId: error.userId,
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.errorCode,
      errorStack: error.stack,  // Full stack trace in DB
      severity: error.severity,
      domain: error.domain,
      route: options?.route,
      context: error.context,  // Full context including PII
    });

    // Tier 2: Queue for PostHog (async, best-effort)
    // SANITIZED context - no PII
    // Skip if observability disabled
    if (observabilityEnabled) {
      try {
        // Sanitize context before sending to PostHog
        const sanitizedContext = sanitizeForPostHog(error.context);

        await enqueuePostHogEvent('error_occurred', error.userId, {
          error_name: error.name,
          error_message: error.message,  // Safe - just error type message
          error_code: error.errorCode,
          severity: error.severity,
          domain: error.domain,
          route: options?.route,
          ...sanitizedContext,  // Only safe fields from context
          // NO stack trace, NO PII
        });
      } catch (queueError) {
        logger.warn('PostHog queue failed', { queueError, originalError: error });
      }
    }

    // Always log
    logger.error(error.message, { error, context: error.context });

  } catch (dbError) {
    // Tier 3: Database failed - use observability_failures table
    logger.error('CRITICAL_OBSERVABILITY_FAILURE', {
      error_type: error.name,
      error_message: error.message,
      error_context: error.context,
      db_error: dbError,
      timestamp: new Date().toISOString(),
    });

    // Try to save failure record (best effort)
    try {
      await saveObservabilityFailure({
        error_data: JSON.stringify({
          name: error.name,
          message: error.message,
          context: error.context,
          stack: error.stack,
        }),
        failure_reason: dbError instanceof Error ? dbError.message : 'Unknown',
        occurred_at: new Date().toISOString(),
      });
    } catch (failureError) {
      // Even failure table failed - only structured logs remain
      logger.error('OBSERVABILITY_FAILURE_TABLE_FAILED', { failureError });
    }

    // Re-throw for critical errors so caller knows tracking failed
    throw dbError;
  }
}
```

**For non-critical errors:**
1. Queue to PostHog (async, best-effort)
2. Log to stdout/stderr via existing logger
3. If PostHog queue fails, log warning but don't throw
4. If queue AND logging fail, errors are lost (acceptable for non-critical)

**Architecture:** Three-tier fallback ensures critical errors are always captured somewhere, even during infrastructure failures. Two-tier context storage keeps PII out of PostHog while preserving full forensic data in database.

### 1.7 Database Safety Net

**Create migration:** `supabase/migrations/00033_create_critical_errors.sql`

Table: `critical_errors`
- `id` (UUID, PK)
- `user_id` (UUID, nullable FK to users) - nullable for unauthenticated errors
- `error_name` (TEXT)
- `error_message` (TEXT)
- `error_code` (TEXT)
- `error_stack` (TEXT, nullable)
- `severity` (TEXT) - 'critical', 'high', 'medium', 'low'
- `domain` (TEXT) - 'payment', 'credit', 'generation', etc.
- `route` (TEXT, nullable)
- `context` (JSONB, default `{}`)
- `created_at` (TIMESTAMPTZ)
- `resolved_at` (TIMESTAMPTZ, nullable)
- `resolved_by` (UUID, nullable FK to users)

Indexes:
- `user_id` (supports NULL)
- `created_at DESC`
- `error_code`
- `severity` - for filtering by severity
- `domain` - for filtering by domain
- Partial index on unresolved critical errors (WHERE resolved_at IS NULL AND severity = 'critical')

RLS:
- Admins can view all
- Users can view their own

**Create:** `src/lib/db/critical-errors.ts`
- `saveCriticalError(data)` - insert error record
- `getCriticalErrors(userId?, options?)` - fetch with filters:
  ```typescript
  {
    limit?: number;
    beforeDate?: string;  // cursor for pagination
    afterDate?: string;   // date range start
    severity?: 'critical' | 'high' | 'medium' | 'low';
    domain?: 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system';
    resolved?: 'true' | 'false' | 'all';  // default: 'all'
  }
  ```
- `resolveCriticalError(errorId, resolvedBy)` - mark as resolved (set resolved_at to now, resolved_by to adminId)
- `unresolveCriticalError(errorId)` - mark as unresolved (set resolved_at and resolved_by to null)

### 1.8 Observability Failures Table

**Create migration:** `supabase/migrations/00035_create_observability_failures.sql`

Table: `observability_failures`
- `id` (UUID, PK)
- `error_data` (JSONB) - serialized error (name, message, context, stack)
- `failure_reason` (TEXT) - why tracking failed (DB error message)
- `occurred_at` (TIMESTAMPTZ) - when original error happened
- `created_at` (TIMESTAMPTZ) - when failure was recorded
- `reviewed_at` (TIMESTAMPTZ, nullable) - when admin reviewed
- `reviewed_by` (UUID, nullable FK to users)

Indexes:
- `occurred_at DESC`
- `created_at DESC`
- Partial index on unreviewed failures (WHERE reviewed_at IS NULL)

RLS:
- Admins can view all
- Regular users: no access (these are infrastructure failures)

**Create:** `src/lib/db/observability-failures.ts`
- `saveObservabilityFailure(data)` - insert failure record (best effort, may throw)
- `getObservabilityFailures(limit?, reviewed?)` - fetch failures for admin review
- `markFailureReviewed(failureId, reviewedBy)` - mark as reviewed

**Purpose:** Last-resort fallback when both PostHog queue AND critical_errors table fail. Allows admins to discover errors that fell through the cracks.

**Future consideration:** When the app has revenue and scale, consider upgrading to dedicated observability services:
- **Sentry** - Purpose-built error tracking with alerts, grouping, and release tracking ($26-80+/month)
- **Axiom** - High-performance logging with generous free tier, then pay-as-you-go
- **Better Stack (Logtail)** - Affordable logging with alerting ($5-29+/month)

These services provide features this system doesn't: automatic error grouping, smart alerts, source maps, release tracking, and guaranteed uptime. Worth investing in once you're generating revenue.

### 1.9 PostHog Event Queue

**Create migration:** `supabase/migrations/00034_create_posthog_event_queue.sql`

Table: `posthog_event_queue`
- `id` (UUID, PK)
- `event_name` (TEXT)
- `distinct_id` (TEXT) - PostHog user identifier
- `properties` (JSONB) - event properties
- `timestamp` (TIMESTAMPTZ) - when event occurred
- `retry_count` (INTEGER, default 0)
- `last_error` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)
- `processed_at` (TIMESTAMPTZ, nullable)

Indexes:
- `processed_at` (partial index WHERE processed_at IS NULL) - unprocessed events
- `created_at DESC`

**Create:** `src/lib/posthog/queue.ts`
- `enqueuePostHogEvent(eventName, distinctId, properties)` - add event to queue
- `processEventQueue(batchSize = 50)` - fetch unprocessed events, send to PostHog, mark processed
- Retry logic: max 3 retries with exponential backoff, then mark as failed (store error)

**Create:** `src/lib/workers/posthog-worker.ts`
- Background worker that runs `processEventQueue()` every 30 seconds
- Can be triggered by Next.js API route (`/api/cron/posthog-sync`) or standalone process
- Graceful shutdown handler to finish processing current batch

**Deployment options:**
- **Option A (Simple):** Next.js API route `/api/cron/posthog-sync` called by external cron (Vercel Cron, GitHub Actions, etc.)
- **Option B (Self-contained):** Long-running process using `setInterval` in separate worker file
- **Option C (Supabase):** Use pg_cron extension to call database function that invokes Edge Function

### 1.10 Environment Variables

**Add to `src/lib/env.ts`:**
```typescript
// Observability control (server)
OBSERVABILITY_ENABLED: z
  .string()
  .optional()
  .default('true')
  .transform(val => val === 'true')

// Observability control (client)
NEXT_PUBLIC_OBSERVABILITY_ENABLED: z
  .string()
  .optional()
  .default('true')
  .transform(val => val === 'true')

// PostHog client (browser)
NEXT_PUBLIC_POSTHOG_API_KEY: z.string().refine(
  (val) => {
    const enabled = process.env.OBSERVABILITY_ENABLED !== 'false';
    const isProduction = process.env.NODE_ENV === 'production';

    // Required in production when observability enabled
    if (enabled && isProduction && !val) {
      throw new Error('NEXT_PUBLIC_POSTHOG_API_KEY is required in production when OBSERVABILITY_ENABLED=true');
    }

    // Validate format if provided
    if (val && !val.startsWith('phc_')) {
      throw new Error('NEXT_PUBLIC_POSTHOG_API_KEY must start with "phc_"');
    }

    return true;
  }
).optional()

NEXT_PUBLIC_POSTHOG_HOST: z.string().url().refine(
  (val) => {
    const enabled = process.env.OBSERVABILITY_ENABLED !== 'false';
    const isProduction = process.env.NODE_ENV === 'production';

    // Required in production when observability enabled
    if (enabled && isProduction && !val) {
      throw new Error('NEXT_PUBLIC_POSTHOG_HOST is required in production when OBSERVABILITY_ENABLED=true');
    }

    return true;
  }
).optional()

// PostHog server (Node.js)
POSTHOG_API_KEY: z.string().refine(
  (val) => {
    const enabled = process.env.OBSERVABILITY_ENABLED !== 'false';
    const isProduction = process.env.NODE_ENV === 'production';

    // Required in production when observability enabled
    if (enabled && isProduction && !val) {
      throw new Error('POSTHOG_API_KEY is required in production when OBSERVABILITY_ENABLED=true');
    }

    // Validate format if provided
    if (val && !val.startsWith('phx_')) {
      throw new Error('POSTHOG_API_KEY must start with "phx_"');
    }

    return true;
  }
).optional()

POSTHOG_PROJECT_ID: z.string().refine(
  (val) => {
    const enabled = process.env.OBSERVABILITY_ENABLED !== 'false';
    const isProduction = process.env.NODE_ENV === 'production';

    // Required in production when observability enabled
    if (enabled && isProduction && !val) {
      throw new Error('POSTHOG_PROJECT_ID is required in production when OBSERVABILITY_ENABLED=true');
    }

    // Validate format if provided (numeric string)
    if (val && !/^\d+$/.test(val)) {
      throw new Error('POSTHOG_PROJECT_ID must be numeric');
    }

    return true;
  }
).optional()
```

**Add to `.env.example`:**
```bash
# Observability control (set to 'false' to disable PostHog in local dev)
OBSERVABILITY_ENABLED=true
NEXT_PUBLIC_OBSERVABILITY_ENABLED=true

# PostHog (required in production when OBSERVABILITY_ENABLED=true)
NEXT_PUBLIC_POSTHOG_API_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_API_KEY=phx_xxxxx
POSTHOG_PROJECT_ID=12345
```

**Validation behavior:**
- **Production + OBSERVABILITY_ENABLED=true**: All PostHog vars required, fail fast on boot if missing/invalid
- **Production + OBSERVABILITY_ENABLED=false**: PostHog vars optional, observability gracefully disabled
- **Development**: PostHog vars optional by default (OBSERVABILITY_ENABLED defaults to 'true' but validation is permissive)
- **Format validation**: API keys must start with `phc_` (client) or `phx_` (server), project ID must be numeric

**Rationale:** Fail-fast prevents production from running with broken observability. Setting `OBSERVABILITY_ENABLED=false` in local dev allows developers to work without PostHog credentials.

## Phase 2: React-Toastify Migration

### 2.1 Toast Provider

**Create:** `src/components/providers/toast-provider.tsx`
- Wrap `ToastContainer` with config: `position: 'bottom-right'`, `limit: 3`
- Import CSS: `'react-toastify/dist/ReactToastify.css'`

**Update:** `src/app/layout.tsx`
- Add `<ToastProvider />` to root layout
- Wrap app in TanStack Query provider:
  ```typescript
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  });

  // In layout component
  <QueryClientProvider client={queryClient}>
    <ToastProvider />
    {children}
  </QueryClientProvider>
  ```

### 2.2 Toast Utility

**Create:** `src/lib/toast/index.ts`

Export `toast` object with methods:
- `success(message, options)` → `toastify.success()`
- `info(message, options)` → `toastify.info()`
- `warning(message, options)` → `toastify.warning()`
- `error(message | Error, options)` → Display toast + conditionally capture to PostHog
- `dismiss(toastId?)` → `toastify.dismiss()`

**Auto-tracking logic (safe by default):**
```typescript
export const toast = {
  error: (messageOrError: string | Error, options?: ToastOptions) => {
    // Display toast regardless
    const message = messageOrError instanceof Error
      ? messageOrError.message
      : messageOrError;
    toastify.error(message, options);

    // Only track if it's a ProductPixError (intentional error with context)
    if (messageOrError instanceof ProductPixError) {
      captureError(messageOrError).catch(console.error);
    }

    // Plain strings and generic Errors are NOT tracked
    // Forces developers to use error classes for trackable errors
  }
};
```

**Rationale:** Safe by default prevents validation errors and user-facing messages from polluting error tracking. Only domain errors (ProductPixError subclasses) with proper context are tracked.

### 2.3 Migration Strategy

#### Pre-Migration Compatibility Analysis

**Step 1: Audit Current Toast Implementation**

Search for all toast usages to understand current patterns:

```bash
# Find all toast imports
grep -r "useToast" src/

# Find all toast method calls
grep -r "toast({" src/

# Find all toast variants
grep -r "toast.error\|toast.success\|toast.warning\|toast.info" src/
```

**Expected current usage patterns:**

```typescript
// Pattern 1: Hook-based usage
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Success', description: 'Action completed' });

// Pattern 2: Variant methods (if exists)
toast.error('Failed to save');
toast.success('Saved successfully');

// Pattern 3: With actions/buttons (if exists)
toast({
  title: 'Confirm',
  description: 'Are you sure?',
  action: <Button onClick={handleConfirm}>Confirm</Button>
});

// Pattern 4: Programmatic dismiss (if exists)
const { dismiss } = useToast();
const toastId = toast({ ... });
dismiss(toastId);
```

**Step 2: Feature Comparison Matrix**

| Feature | Current Implementation | react-toastify | Migration Strategy |
|---------|----------------------|----------------|-------------------|
| Basic notifications | `toast({ title, description })` | `toast.error(message)` | Map to simple message |
| Variants (error/success/info) | Check if exists | ✅ Built-in | Direct mapping |
| Programmatic dismiss | Check if exists | ✅ `toast.dismiss(id)` | Direct mapping |
| Custom JSX content | Check if exists | ✅ Supports JSX | Migrate to JSX |
| Action buttons | Check if exists | ⚠️ Requires custom render | Custom toastify component |
| Auto-close timing | Check if exists | ✅ `autoClose` prop | Direct mapping |
| Position | Check if exists | ✅ `position` prop | Direct mapping |
| Max toasts | Check if exists | ✅ `limit` prop | Direct mapping |

**Step 3: Identify Breaking Changes**

Potential compatibility issues:

1. **API shape change:**
   - Current: `toast({ title: 'X', description: 'Y' })`
   - New: `toast.error('Y')` or `toast.error(<CustomContent />)`
   - **Impact:** All toast calls need updating

2. **Hook vs import:**
   - Current: `const { toast } = useToast();` (React hook)
   - New: `import { toast } from '@/lib/toast';` (direct import)
   - **Impact:** No hooks needed, can use in non-React code

3. **Custom action buttons:**
   - Current: May support action prop
   - New: Requires custom toast content
   - **Impact:** Need to refactor action buttons into JSX

4. **Styling:**
   - Current: Custom CSS/Tailwind
   - New: react-toastify CSS + custom overrides
   - **Impact:** Visual differences, may need CSS tweaks

**Step 4: Migration Checklist**

Before starting migration:

- [ ] **Audit complete:** Run grep commands, document all usage patterns
- [ ] **Count total usages:** `grep -r "useToast" src/ | wc -l`
- [ ] **Identify custom features:** Check for action buttons, custom JSX, special variants
- [ ] **Feature parity confirmed:** Verify react-toastify supports all current features
- [ ] **Fallback plan:** Keep old implementation available during migration
- [ ] **Visual approval:** Get design sign-off on react-toastify default styles

**Step 5: Migration Execution**

```bash
# 1. Find all files using toast
grep -rl "useToast" src/ > toast-migration-files.txt

# 2. Count total files to migrate
wc -l toast-migration-files.txt

# 3. Migrate one file at a time, test, commit
# Start with least critical files (e.g., admin pages)
```

**Migration pattern by usage type:**

```typescript
// Pattern 1: Simple notifications
// BEFORE:
toast({ title: 'Success', description: 'Item saved' });

// AFTER:
toast.success('Item saved');

// Pattern 2: Error with details
// BEFORE:
toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' });

// AFTER:
toast.error('Failed to save item');

// Pattern 3: With custom content
// BEFORE:
toast({
  title: 'Upload Complete',
  description: <div>File uploaded: {filename}</div>
});

// AFTER:
toast.success(<div>Upload Complete<br/>File: {filename}</div>);

// Pattern 4: With action button (complex)
// BEFORE:
toast({
  title: 'Confirm Delete',
  description: 'Are you sure?',
  action: <Button onClick={handleDelete}>Delete</Button>
});

// AFTER (create custom toast component):
const ConfirmToast = ({ onConfirm, onClose }) => (
  <div>
    <p>Are you sure?</p>
    <button onClick={() => { onConfirm(); onClose(); }}>Delete</button>
  </div>
);
toast.warning(<ConfirmToast onConfirm={handleDelete} onClose={() => toast.dismiss()} />);
```

**Step 6: Validation**

After migration complete:

```bash
# Verify no old toast imports remain
grep -r "useToast" src/
# Expected: Only in __tests__ or old files marked for deletion

# Verify new toast imports present
grep -r "from '@/lib/toast'" src/
# Expected: All migrated files

# Check for orphaned toast calls
grep -r "toast({" src/
# Expected: None (all should use toast.error, toast.success, etc.)
```

**Step 7: Testing Strategy**

Manual testing checklist:

- [ ] Success toast displays correctly
- [ ] Error toast displays correctly (including ProductPixError auto-tracking)
- [ ] Warning toast displays correctly
- [ ] Info toast displays correctly
- [ ] Toasts auto-dismiss after timeout
- [ ] Multiple toasts stack correctly (limit: 3)
- [ ] Position is correct (bottom-right)
- [ ] Toasts are accessible (screen reader support)
- [ ] Custom JSX content renders correctly
- [ ] No visual regressions from old implementation

**Rollback Plan**

If migration has issues:

1. Keep `src/hooks/use-toast.ts` file in codebase during migration
2. Use feature flag to toggle between old and new toast systems
3. If critical issue found, revert to old system:
   ```typescript
   // In src/lib/toast/index.ts
   export { useToast as toast } from '@/hooks/use-toast'; // Temporary rollback
   ```

**Search and replace pattern (after audit):**
```typescript
// OLD
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Error', description: 'Something failed' });

// NEW
import { toast } from '@/lib/toast';
toast.error('Something failed');
```

**Files to migrate:** All components using `useToast` hook (search for `from '@/hooks/use-toast'`)

**Keep old hook temporarily** - Delete after all migrations complete and tested

**Migration order (least to most critical):**
1. Admin pages (low user traffic)
2. Settings/profile pages
3. Dashboard components
4. Core user flows (generation, upload)
5. Payment flows (most critical - test thoroughly)

## Phase 3: API Route Error Migration

### 3.1 Error Classification Pattern

**All API routes should use error classes with appropriate severity:**

**Critical paths (severity: 'critical'):**
- `/api/generate` → `GenerationError` (severity: 'critical' for payment-consuming failures, 'high' for retryable)
- `/api/webhooks/stripe` → `PaymentError` (severity: 'critical')
- `/api/refunds/*` → `CreditError` (severity: 'critical')
- Auth routes → `AuthError` (severity: 'critical')

**Non-critical paths (severity: 'low' or 'medium'):**
- Validation errors → `ValidationError` (severity: 'low')
- Rate limits → `RateLimitError` (severity: 'low')
- Upload errors → `GenerationError` (severity: 'medium' if user data not lost)

**Key principle:** Use error classes everywhere. Severity determines how urgent the error is, domain enables filtering in PostHog.

### 3.2 Migration Example

**Current pattern** (`src/app/api/generate/route.ts:154`):
```typescript
catch (error) {
  console.error('Generate error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

**New pattern (with standardized context):**
```typescript
import { captureError } from '@/lib/posthog/capture-error';
import { GenerationError } from '@/lib/errors/error-classes';

catch (error) {
  // Determine severity based on whether this consumed user credits
  const severity = creditsConsumed ? 'critical' : 'high';

  const generationError = new GenerationError(
    'Image generation failed',
    {
      severity,
      // Required fields for GenerationError
      templateSlug,
      creditsConsumed,

      // Standardized context fields
      userId: request.user.id,
      jobId: jobResult?.job_id,
      creditAmount: 100,
      retryable: false,
      route: '/api/generate',
      method: 'POST',
      duration: Date.now() - startTime,

      // Domain-specific fields (will be sanitized)
      generationParams: {
        prompt: sanitizedPrompt, // Don't include raw user prompts
        model: 'gemini-2.0-flash-exp',
      },

      // Optional debugging context
      tags: ['image-generation', 'api'],
    }
  );

  // captureError will:
  // - Save FULL context to database
  // - Send SANITIZED context (only safe fields) to PostHog
  // - Auto-add environment field via ErrorContextBuilder
  await captureError(generationError);

  return NextResponse.json(
    { error: 'Internal server error', jobId: jobResult?.job_id },
    { status: 500 }
  );
}
```

**Benefits of standardized context:**
- TypeScript autocomplete for context fields
- Compile-time errors for typos (userId vs user_id)
- Consistent field naming across codebase
- Easy to query in PostHog (all payment errors have same field names)
- Self-documenting - context interface shows what fields are available

### 3.3 Routes to Migrate

**Priority 1 (Critical paths - severity: 'critical'):**
1. `src/app/api/generate/route.ts` → `GenerationError` (critical if credits consumed, high if retryable)
2. `src/app/api/webhooks/stripe/route.ts` → `PaymentError` (severity: 'critical')
3. `src/app/api/refunds/image/[id]/approve/route.ts` → `CreditError` (severity: 'critical')
4. `src/app/api/refunds/cash/[id]/approve/route.ts` → `CreditError` (severity: 'critical')

**Priority 2 (Non-critical paths - severity: 'low' or 'medium'):**
5. `src/app/api/upload/presign/route.ts` → `GenerationError` or `ValidationError` (severity: 'medium' or 'low')
6. Rate-limited routes → `RateLimitError` (severity: 'low')
7. All other API routes with `console.error` → Use appropriate error class with severity

**Migration approach:**
- Search codebase for `console.error` in API routes
- Replace with appropriate error class + `captureError()`
- Choose severity based on impact (data loss = critical, user blocked = high, degraded = medium, expected = low)
- Keep existing `logger.error()` calls - they provide structured logs to stdout/stderr (complementary to PostHog)

## Phase 4: Error Capture (Client & Server)

### 4.1 Client-Side Error Boundary

**Update:** `src/components/ui/error-boundary.tsx`

In `componentDidCatch`:
```typescript
import { captureError } from '@/lib/posthog/capture-error';

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('Error boundary caught:', error, errorInfo);

  captureError(error, {
    route: window.location.pathname,
    additionalContext: {
      componentStack: errorInfo.componentStack,
    },
  }).catch(console.error);
}
```

### 4.2 Global Error Page (Client & Server Errors)

**Update:** `src/app/error.tsx`

Handles both client-side runtime errors and some server errors:
```typescript
'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/posthog/capture-error';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    captureError(error, {
      route: window.location.pathname,
    }).catch(console.error);
  }, [error]);

  // ... existing UI
}
```

**Note:** `error.tsx` catches errors from Server Components during rendering, but NOT errors from Server Actions or data fetching utilities. Those need explicit handling.

### 4.3 Server Actions Error Handling

**Pattern:** Server Actions should use try/catch and return error state to client (don't throw unless using error.tsx boundary).

**Create:** `src/lib/server-actions/with-error-handler.ts`

```typescript
import { captureError } from '@/lib/posthog/capture-error';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wraps server actions with error handling and tracking.
 * Returns Result type instead of throwing.
 */
export function withErrorHandler<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>,
  actionName: string
) {
  return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
    try {
      const data = await action(...args);
      return { success: true, data };
    } catch (error) {
      // Capture to observability
      if (error instanceof ProductPixError) {
        await captureError(error);
      } else {
        // Wrap unexpected errors
        const wrappedError = new Error(`Server action ${actionName} failed`);
        console.error(wrappedError, error);
      }

      // Return user-friendly error message
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  };
}
```

**Usage example:**
```typescript
'use server';

import { withErrorHandler } from '@/lib/server-actions/with-error-handler';

async function updateUserProfileImpl(userId: string, data: ProfileData) {
  // Validation
  if (!data.email) {
    throw new ValidationError("Email is required");
  }

  // Critical operation
  const result = await updateProfile(userId, data);
  if (!result) {
    throw new Error("Profile update failed");
  }

  return result;
}

export const updateUserProfile = withErrorHandler(
  updateUserProfileImpl,
  'updateUserProfile'
);
```

**Alternative pattern (for critical actions):** If the action is critical and errors should bubble to error.tsx:
```typescript
'use server';

import { captureError } from '@/lib/posthog/capture-error';

export async function createPaymentIntent(amount: number) {
  try {
    const intent = await stripe.paymentIntents.create({ amount });
    return intent;
  } catch (error) {
    const paymentError = new PaymentError('Failed to create payment intent', {
      amount,
      cause: error instanceof Error ? error : undefined,
    });

    await captureError(paymentError);
    throw paymentError; // Let error.tsx handle UI
  }
}
```

### 4.4 Server Component Error Handling

**Pattern:** Server Components should use error.tsx boundaries for rendering errors. For data fetching, use explicit try/catch.

```typescript
// app/dashboard/page.tsx
import { captureError } from '@/lib/posthog/capture-error';

export default async function DashboardPage() {
  let userData;

  try {
    userData = await fetchUserData();
  } catch (error) {
    // Log error for observability
    if (error instanceof ProductPixError) {
      await captureError(error);
    }

    // Return error UI (or throw to let error.tsx handle it)
    return <ErrorState message="Failed to load dashboard" />;
  }

  return <Dashboard data={userData} />;
}
```

**When to use error.tsx vs explicit try/catch:**
- **error.tsx**: Unexpected errors, critical failures that should show full error page
- **try/catch with error state**: Expected failures, partial page errors, degraded UI

### 4.5 Middleware Error Handling

**Create:** `src/middleware.ts` (if not exists) or update existing

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { captureError } from '@/lib/posthog/capture-error';

export async function middleware(request: NextRequest) {
  try {
    // Your middleware logic (auth, rate limiting, etc.)
    return NextResponse.next();
  } catch (error) {
    // Capture middleware errors
    console.error('Middleware error:', error);

    // Don't use ProductPixError here (middleware runs before app context)
    // Just log to structured logger

    // Return 500 or allow request to continue
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Note:** Middleware runs in Edge Runtime with limitations. Heavy error tracking should be deferred to API routes or page handlers.

### 4.6 Form Error Handling

Pattern for user-facing forms (example: `src/components/contact/contact-form.tsx`):

```typescript
// Validation errors - just strings, not tracked
if (!email) {
  toast.error("Email is required");  // ✅ Shows toast, NOT tracked
  return;
}

// Server errors - wrap in error class if worth tracking
try {
  await submitForm(data);
} catch (error) {
  // Generic user message - not tracked
  toast.error("Failed to submit form. Please try again.");  // ✅ NOT tracked

  // But still log for debugging (if needed)
  console.error("Form submission failed:", error);

  // OR if this is a critical error worth tracking:
  const submissionError = new Error("Contact form submission failed");
  if (submissionError instanceof ProductPixError) {
    captureError(submissionError);  // ✅ Tracked with context
  }
  toast.error("Failed to submit form. Please try again.");
}
```

**Key principle:** User-facing validation messages and generic error messages are NOT tracked. Only wrap errors in ProductPixError classes when you need observability with context (rare for forms).

## Phase 5: Admin Dashboard Enhancement

### 5.1 PostHog API Integration

**Create:** `src/lib/posthog/api.ts`

Function: `getPostHogEvents(userId, options)`

Options interface:
```typescript
{
  limit?: number;           // default 50
  beforeDate?: string;      // ISO timestamp cursor
  afterDate?: string;       // start of date range
  eventType?: string;       // filter by event name pattern
  severity?: 'critical' | 'high' | 'medium' | 'low';  // filter by severity
  domain?: string;          // filter by domain (payment, credit, etc.)
}
```

Implementation:
- Fetch from PostHog API: `/api/projects/{projectId}/events`
- Query params: `person_id={userId}&after={afterDate}&before={beforeDate}&limit={limit}`
- Filter results client-side by `severity` and `domain` in event properties (PostHog API doesn't support property filtering in URL)
- Return `PostHogEvent[]` interface with fields: `id`, `event`, `timestamp`, `properties`, `distinct_id`
- Handle errors gracefully (return empty array if API fails, log error)
- Include exponential backoff for rate limit responses (429)

**Note:** PostHog API filtering is limited - fetch events and filter by properties.severity and properties.domain in your code.

### 5.2 Timeline API Endpoint

**Create:** `src/app/api/admin/users/[userId]/timeline/route.ts`

GET handler with query parameters:
- `limit` (default: 50, max: 200) - events per page
- `cursor` (optional) - ISO timestamp for pagination (events before this time)
- `days` (default: 30, max: 365) - date range filter
- `severity` (optional: 'critical' | 'high' | 'medium' | 'low') - filter by severity
- `domain` (optional: 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit') - filter by error domain
- `eventType` (optional: 'error' | 'action' | 'system') - filter by event category
- `source` (optional: 'posthog' | 'database') - filter by data source
- `resolved` (optional: 'true' | 'false' | 'all', default: 'all') - filter by resolution status

**Implementation flow:**
1. Verify admin authentication (401 if not admin)
2. Validate and parse query parameters (400 if invalid)
3. Calculate date range: `endDate = cursor || now()`, `startDate = endDate - days`
4. **Fetch from both sources in parallel:**
   - DB: `getCriticalErrors(userId, { limit, beforeDate: cursor, afterDate: startDate, severity, domain, resolved })`
   - PostHog: `getPostHogEvents(userId, { limit, beforeDate: cursor, afterDate: startDate, eventType, severity, domain })`
   - Note: PostHog events don't have resolution status (only DB errors do)
5. **Merge results:**
   - Combine arrays and sort by timestamp descending
   - Take first `limit` events (respects limit even when both sources return full results)
   - Determine `nextCursor`: timestamp of last event (null if fewer than limit events)
6. **Map to unified interface:** `TimelineEvent[]` with fields:
   - `id`, `type`, `timestamp`, `title`, `description`, `severity`, `metadata`, `source`
   - `resolvedAt` (nullable, ISO timestamp) - when error was resolved (DB errors only)
   - `resolvedBy` (nullable, UUID) - admin who resolved error (DB errors only)
   - `resolvedByName` (nullable, string) - admin name for display
7. **Return JSON:**
   ```typescript
   {
     events: TimelineEvent[],
     nextCursor: string | null,
     hasMore: boolean,
     total: number // approximate, may be expensive to calculate exactly
   }
   ```

**PostHog API considerations:**
- PostHog rate limit: ~100 requests/min (verify with your plan)
- PostHog events endpoint: `/api/projects/{projectId}/events?person_id={userId}&after={ISO}&before={ISO}&limit={N}`
- Cache PostHog responses for 5 minutes to reduce API calls for same user

### 5.3 Error Resolution API

**Create:** `src/app/api/admin/errors/[errorId]/resolve/route.ts`

POST handler to mark error as resolved:

```typescript
import { getUser } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/admin';
import { resolveCriticalError } from '@/lib/db/critical-errors';

export async function POST(
  request: Request,
  { params }: { params: { errorId: string } }
) {
  // Verify admin authentication
  const user = await getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { errorId } = params;

  try {
    // Mark error as resolved
    const resolvedError = await resolveCriticalError(errorId, user.id);

    return NextResponse.json({
      success: true,
      error: resolvedError,
    });
  } catch (error) {
    console.error('Failed to resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve error' },
      { status: 500 }
    );
  }
}
```

**Delete handler to unresolve error:**

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { errorId: string } }
) {
  // Verify admin authentication
  const user = await getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { errorId } = params;

  try {
    // Mark error as unresolved (set resolved_at and resolved_by to null)
    const unresolvedError = await unresolveCriticalError(errorId);

    return NextResponse.json({
      success: true,
      error: unresolvedError,
    });
  } catch (error) {
    console.error('Failed to unresolve error:', error);
    return NextResponse.json(
      { error: 'Failed to unresolve error' },
      { status: 500 }
    );
  }
}
```

### 5.4 User Detail Page

**Create:** `src/app/admin/users/[userId]/page.tsx`

Layout:
- Left column: User stats (existing user data from `users` table)
- Right column: `<UserTimeline userId={userId} />`

Server component:
- Verify admin auth
- Fetch user data from Supabase
- Redirect if not admin or user not found

### 5.5 Timeline Component

**Create:** `src/components/admin/user-timeline.tsx`

Client component using TanStack Query infinite scroll:

```typescript
'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TimelineFilters {
  severity?: 'critical' | 'high' | 'medium' | 'low';
  domain?: 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit';
  eventType?: 'error' | 'action' | 'system';
  source?: 'posthog' | 'database';
  resolved?: 'true' | 'false' | 'all';
  days?: number;
}

export function UserTimeline({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TimelineFilters>({ resolved: 'all' });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['user-timeline', userId, filters],
    queryFn: ({ pageParam }) =>
      fetchTimeline(userId, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  // Mutation to resolve error
  const resolveErrorMutation = useMutation({
    mutationFn: (errorId: string) =>
      fetch(`/api/admin/errors/${errorId}/resolve`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      // Invalidate and refetch timeline
      queryClient.invalidateQueries({ queryKey: ['user-timeline', userId] });
    },
  });

  // Mutation to unresolve error
  const unresolveErrorMutation = useMutation({
    mutationFn: (errorId: string) =>
      fetch(`/api/admin/errors/${errorId}/resolve`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', userId] });
    },
  });

  // Flatten pages into single array
  const events = data?.pages.flatMap(page => page.events) ?? [];

  return (
    <div>
      <TimelineFilters filters={filters} onChange={setFilters} />
      <TimelineEventList
        events={events}
        onResolve={(errorId) => resolveErrorMutation.mutate(errorId)}
        onUnresolve={(errorId) => unresolveErrorMutation.mutate(errorId)}
      />
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

**Components:**
- `<TimelineFilters>` - Dropdown filters for:
  - Severity: critical, high, medium, low
  - Domain: payment, credit, generation, auth, validation, rate-limit
  - Event type: error, action, system
  - Source: posthog, database
  - Resolution status: all | unresolved only | resolved only (defaults to "all")
  - Date range: last 7/30/90 days
- `<TimelineEventList>` - Virtualized list of events (consider react-virtual for performance)
- `<TimelineEventCard>` - Individual event display:
  - Badge with domain and severity color (critical=red, high=orange, medium=yellow, low=gray)
  - Title and relative timestamp
  - Description (if present)
  - Expandable metadata (JSON viewer)
  - Source label (PostHog vs Database)
  - **Resolution status (DB errors only):**
    - If unresolved: "Resolve" button (calls onResolve callback)
    - If resolved: ✓ checkmark badge with "Resolved by {adminName} on {date}" + "Unresolve" button
  - **Note:** PostHog events don't have resolution status (resolution workflow is DB-only)

**Optimizations:**
- Use `staleTime: 5 * 60 * 1000` (5 min) to cache timeline data
- Implement intersection observer for automatic infinite scroll (alternative to "Load More" button)
- Consider `react-virtual` for rendering 1000+ events efficiently

### 5.6 User Stats Component

**Create:** `src/components/admin/user-stats.tsx`

Display user info:
- Email, tier, credit balance
- Account created date
- Total generations count
- Recent activity summary
- **Error stats:**
  - Unresolved critical errors count (badge with red if > 0)
  - Unresolved high severity errors count
  - Total errors last 30 days

**Implementation:**
```typescript
// Fetch unresolved error counts
const { data: errorStats } = useQuery({
  queryKey: ['user-error-stats', userId],
  queryFn: async () => {
    const [critical, high, total] = await Promise.all([
      fetch(`/api/admin/users/${userId}/timeline?severity=critical&resolved=false&limit=1`).then(r => r.json()),
      fetch(`/api/admin/users/${userId}/timeline?severity=high&resolved=false&limit=1`).then(r => r.json()),
      fetch(`/api/admin/users/${userId}/timeline?days=30&limit=1`).then(r => r.json()),
    ]);
    return {
      unresolvedCritical: critical.total || 0,
      unresolvedHigh: high.total || 0,
      totalLast30Days: total.total || 0,
    };
  },
});
```

### 5.7 Navigation Update

**Update:** `src/components/admin/admin-nav.tsx`

Add "Users" navigation item pointing to `/admin/users` (list view)

**Create:** `src/app/admin/users/page.tsx` (future: user list page)

## Phase 6: PostHog Initialization

### 6.1 Client Initialization with PostHog Provider

**Create:** `src/components/providers/posthog-provider.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consentGiven, setConsentGiven] = useState(false);

  const observabilityEnabled = process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED !== 'false';
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;

  useEffect(() => {
    // Check for existing consent from cookie banner
    const hasConsent = checkAnalyticsConsent(); // Implementation provided by cookie banner
    setConsentGiven(hasConsent);

    // Listen for consent changes from cookie banner
    const handleConsentChange = (event: CustomEvent) => {
      setConsentGiven(event.detail.analytics);

      // If consent given and PostHog loaded, enable session recording
      if (event.detail.analytics && posthog.__loaded) {
        posthog.startSessionRecording();
      } else if (!event.detail.analytics && posthog.__loaded) {
        posthog.stopSessionRecording();
      }
    };

    window.addEventListener('cookieConsentChange', handleConsentChange as EventListener);
    return () => {
      window.removeEventListener('cookieConsentChange', handleConsentChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // Skip initialization if observability disabled or no API key
    if (!observabilityEnabled || !apiKey) {
      return;
    }

    // Initialize PostHog once on client mount
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(apiKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We'll capture manually
        capture_pageleave: true,
        // Session recording DISABLED by default - only enabled with consent
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '*',
        },
        disable_session_recording: !consentGiven, // Controlled by consent
      });

      // If consent already given, start recording
      if (consentGiven) {
        posthog.startSessionRecording();
      }
    }
  }, [observabilityEnabled, apiKey, consentGiven]);

  useEffect(() => {
    // Skip if observability disabled
    if (!observabilityEnabled || !apiKey) {
      return;
    }

    // Track page views on route change
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, observabilityEnabled, apiKey]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/**
 * Check if user has given analytics consent via cookie banner
 * This function should be implemented by your cookie banner solution
 */
function checkAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;

  // Example implementation - adjust based on your cookie banner
  const consent = localStorage.getItem('cookie_consent');
  if (!consent) return false;

  try {
    const parsed = JSON.parse(consent);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}
```

**Cookie Banner Integration:**

Your cookie banner implementation should:

1. **Emit consent change event:**
   ```typescript
   // When user updates preferences
   window.dispatchEvent(new CustomEvent('cookieConsentChange', {
     detail: {
       analytics: true, // or false based on user choice
       necessary: true,
       marketing: false,
     }
   }));
   ```

2. **Store consent in localStorage:**
   ```typescript
   localStorage.setItem('cookie_consent', JSON.stringify({
     analytics: true,
     necessary: true,
     marketing: false,
     timestamp: new Date().toISOString(),
   }));
   ```

3. **Default to no consent:**
   - Session recording disabled by default
   - Only enabled when user explicitly accepts analytics cookies
   - Pageview tracking and error tracking still work (essential functionality)

**Privacy implications:**
- **Without consent:** Error tracking + pageview tracking (essential for functionality)
- **With consent:** Session recording enabled (helps debug user issues)
- **Session recording settings:**
  - `maskAllInputs: true` - All form inputs masked by default
  - `maskTextSelector: '*'` - All text content masked
  - Only interactions (clicks, scrolls) and structure visible
  - No sensitive data recorded even with consent
```

**Update:** `src/app/layout.tsx`

Wrap app with PostHogProvider:
```typescript
import { PostHogProvider } from '@/components/providers/posthog-provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/providers/toast-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <PostHogProvider>
            <ToastProvider />
            {children}
          </PostHogProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

**Benefits of PostHog React integration:**
- ✅ Guaranteed single initialization (no re-init on route changes)
- ✅ Automatic pageview tracking on navigation
- ✅ Access to `usePostHog()` hook throughout app
- ✅ Proper cleanup on unmount
- ✅ Session recording configured centrally

### 6.2 User Identification on Auth

**Update:** Auth callback or user session initialization

When user logs in/session established:
```typescript
import { identifyUser } from '@/lib/posthog/identify';

identifyUser(user.id, {
  email: user.email,
  is_admin: user.is_admin,
  credit_balance: user.credit_balance,
  created_at: user.created_at,
});
```

When user logs out:
```typescript
import { resetUser } from '@/lib/posthog/identify';

resetUser();
```

## Testing Strategy

### PostHog Mocking Strategy

**Key principle:** Tests should NEVER make real PostHog API calls. All PostHog interactions must be mocked.

#### Client-Side PostHog Mocking (Browser Tests)

**Mock the PostHog client:**

```typescript
// src/lib/posthog/__mocks__/client.ts
export const posthog = {
  __loaded: true,
  init: mock(() => {}),
  capture: mock(() => {}),
  identify: mock(() => {}),
  reset: mock(() => {}),
};

export const getPostHog = mock(() => posthog);
```

**Usage in tests:**

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { posthog } from '@/lib/posthog/client';

// Mock the module before importing code under test
mock.module('@/lib/posthog/client', () => ({
  posthog: {
    __loaded: true,
    init: mock(() => {}),
    capture: mock(() => {}),
    identify: mock(() => {}),
    reset: mock(() => {}),
  },
}));

describe('error capture client', () => {
  beforeEach(() => {
    // Reset mocks before each test
    posthog.capture.mockClear();
  });

  it('captures error to PostHog', async () => {
    const error = new PaymentError('Payment failed', { severity: 'critical' });

    await captureError(error);

    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('error_occurred', {
      error_name: 'PaymentError',
      error_message: 'Payment failed',
      severity: 'critical',
      domain: 'payment',
      // ... other properties
    });
  });
});
```

#### Server-Side PostHog Mocking (Node.js Tests)

**Mock the PostHog server client:**

```typescript
// src/lib/posthog/__mocks__/server.ts
export const posthogServer = {
  capture: mock(() => {}),
  identify: mock(() => {}),
  shutdown: mock(() => Promise.resolve()),
};
```

**Usage in API route tests:**

```typescript
import { mock } from 'bun:test';

// Mock PostHog server before importing route
mock.module('@/lib/posthog/server', () => ({
  posthogServer: {
    capture: mock(() => {}),
    identify: mock(() => {}),
    shutdown: mock(() => Promise.resolve()),
  },
}));

// Mock database
mock.module('@/lib/db/critical-errors', () => ({
  saveCriticalError: mock(() => Promise.resolve({ id: 'error-123' })),
}));

// Now import and test route
import { POST } from '@/app/api/generate/route';

describe('POST /api/generate', () => {
  it('captures generation error to PostHog on failure', async () => {
    // ... trigger error

    // Verify PostHog queue was called (not direct capture)
    const { enqueuePostHogEvent } = await import('@/lib/posthog/queue');
    expect(enqueuePostHogEvent).toHaveBeenCalled();
  });
});
```

#### Queue System Mocking

**Mock the PostHog event queue:**

```typescript
// src/lib/posthog/__mocks__/queue.ts
export const enqueuePostHogEvent = mock(() => Promise.resolve());
export const processEventQueue = mock(() => Promise.resolve(0));
```

**Usage in tests:**

```typescript
import { mock } from 'bun:test';

mock.module('@/lib/posthog/queue', () => ({
  enqueuePostHogEvent: mock(() => Promise.resolve()),
  processEventQueue: mock(() => Promise.resolve(0)),
}));

describe('error capture', () => {
  it('queues event to PostHog instead of direct capture', async () => {
    const { enqueuePostHogEvent } = await import('@/lib/posthog/queue');
    const error = new PaymentError('Payment failed', { severity: 'critical' });

    await captureError(error);

    expect(enqueuePostHogEvent).toHaveBeenCalledWith(
      'error_occurred',
      expect.any(String), // userId
      expect.objectContaining({
        severity: 'critical',
        domain: 'payment',
      })
    );
  });
});
```

#### Database Mocking

**Mock database functions:**

```typescript
import { mock } from 'bun:test';

mock.module('@/lib/db/critical-errors', () => ({
  saveCriticalError: mock(() => Promise.resolve({ id: 'error-123' })),
  getCriticalErrors: mock(() => Promise.resolve([])),
  resolveCriticalError: mock(() => Promise.resolve({ id: 'error-123', resolved_at: new Date().toISOString() })),
}));
```

#### Environment Variable Mocking for Tests

**Set test environment variables:**

```typescript
// test/setup.ts or in individual test files
process.env.OBSERVABILITY_ENABLED = 'false'; // Disable PostHog in most tests
process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED = 'false';

// For tests that need PostHog enabled:
process.env.OBSERVABILITY_ENABLED = 'true';
process.env.NEXT_PUBLIC_POSTHOG_API_KEY = 'phc_test_key';
process.env.POSTHOG_API_KEY = 'phx_test_key';
process.env.POSTHOG_PROJECT_ID = '12345';
```

#### Verifying PostHog Events

**Pattern for verifying events were captured:**

```typescript
it('captures error with sanitized context', async () => {
  const error = new PaymentError('Payment failed', {
    severity: 'critical',
    userId: 'user-123',
    email: 'user@example.com', // Should be sanitized
    amount: 1000, // Should be included
  });

  await captureError(error);

  const { enqueuePostHogEvent } = await import('@/lib/posthog/queue');

  expect(enqueuePostHogEvent).toHaveBeenCalledWith(
    'error_occurred',
    'user-123',
    expect.objectContaining({
      severity: 'critical',
      domain: 'payment',
      amount: 1000, // Safe field - included
    })
  );

  // Verify PII was NOT sent to PostHog
  const eventProperties = enqueuePostHogEvent.mock.calls[0][2];
  expect(eventProperties).not.toHaveProperty('email');
  expect(eventProperties).not.toHaveProperty('userEmail');
});
```

### Unit Tests

**Test error classification:**
- `src/lib/errors/__tests__/error-classes.test.ts`
- Verify error classes set `severity` correctly (PaymentError defaults to 'critical', RateLimitError to 'low')
- Verify `domain` field set correctly for each error class
- Verify `isCritical` getter returns true for severity === 'critical'
- Verify severity can be overridden in constructor
- Verify context is properly structured with standardized fields

**Test context standardization:**
```typescript
import { describe, it, expect } from 'bun:test';
import { PaymentError, GenerationError, ErrorContextBuilder } from '@/lib/errors/error-classes';

describe('Error Context Standardization', () => {
  it('enforces required fields for PaymentError', () => {
    // TypeScript should enforce amount and currency
    const error = new PaymentError('Payment failed', {
      severity: 'critical',
      amount: 1000,
      currency: 'usd',
      userId: 'user-123',
    });

    expect(error.context.amount).toBe(1000);
    expect(error.context.currency).toBe('usd');
    expect(error.context.environment).toBeDefined(); // Auto-added by builder
  });

  it('uses consistent field naming (camelCase)', () => {
    const error = new GenerationError('Generation failed', {
      severity: 'high',
      templateSlug: 'product-shot',
      creditsConsumed: true,
      userId: 'user-123',
      jobId: 'job-456',
    });

    // Verify camelCase fields exist
    expect(error.context.userId).toBe('user-123');
    expect(error.context.jobId).toBe('job-456');
    expect(error.context.templateSlug).toBe('product-shot');

    // Verify no snake_case fields
    expect(error.context).not.toHaveProperty('user_id');
    expect(error.context).not.toHaveProperty('job_id');
  });

  it('ErrorContextBuilder adds defaults', () => {
    const context = ErrorContextBuilder.payment({
      amount: 1000,
      userId: 'user-123',
    });

    expect(context.currency).toBe('usd'); // Default currency
    expect(context.environment).toBeDefined(); // Auto-added
  });

  it('prevents typos via TypeScript types', () => {
    // This should cause TypeScript compile error:
    // const error = new PaymentError('Payment failed', {
    //   severity: 'critical',
    //   amt: 1000, // ERROR: 'amt' does not exist on PaymentErrorContext
    //   user_id: '123', // ERROR: 'user_id' does not exist
    // });

    // Correct usage:
    const error = new PaymentError('Payment failed', {
      severity: 'critical',
      amount: 1000,
      userId: '123',
    });

    expect(error.context.amount).toBe(1000);
  });
});
```

**Test PII scrubbing:**
- `src/lib/posthog/__tests__/sanitize.test.ts`
- Verify email addresses are redacted: `user@example.com` → `[EMAIL_REDACTED]`
- Verify IP addresses are redacted: `192.168.1.1` → `[IP_REDACTED]`
- Verify credit cards are redacted: `4111111111111111` → `[CARD_REDACTED]`
- Verify tokens are redacted: long alphanumeric strings → `[TOKEN_REDACTED]`
- Verify safe fields pass through: userId, jobId, amount, severity, domain
- Verify unsafe field names are dropped: email, password, token, stack, ipAddress
- Verify nested objects are recursively sanitized
- Verify arrays are sanitized element-by-element
- Verify `sanitizeEmail()` extracts domain: `user@gmail.com` → `{ domain: 'gmail.com' }`

**Test error capture:**
- `src/lib/posthog/__tests__/capture-error.test.ts`

**Full example with PostHog mocking:**

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock all dependencies BEFORE importing code under test
mock.module('@/lib/posthog/queue', () => ({
  enqueuePostHogEvent: mock(() => Promise.resolve()),
}));

mock.module('@/lib/db/critical-errors', () => ({
  saveCriticalError: mock(() => Promise.resolve({ id: 'error-123' })),
}));

mock.module('@/lib/db/observability-failures', () => ({
  saveObservabilityFailure: mock(() => Promise.resolve({ id: 'failure-123' })),
}));

// Now import code under test
import { captureError } from '@/lib/posthog/capture-error';
import { enqueuePostHogEvent } from '@/lib/posthog/queue';
import { saveCriticalError } from '@/lib/db/critical-errors';
import { saveObservabilityFailure } from '@/lib/db/observability-failures';
import { PaymentError } from '@/lib/errors/error-classes';

describe('captureError', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    enqueuePostHogEvent.mockClear();
    saveCriticalError.mockClear();
    saveObservabilityFailure.mockClear();
  });

  it('saves critical error to DB with full context including PII', async () => {
    const error = new PaymentError('Payment failed', {
      severity: 'critical',
      userId: 'user-123',
      email: 'user@example.com',
      amount: 1000,
    });

    await captureError(error);

    expect(saveCriticalError).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        severity: 'critical',
        domain: 'payment',
        context: expect.objectContaining({
          email: 'user@example.com', // Full PII in DB
          amount: 1000,
        }),
      })
    );
  });

  it('queues event to PostHog with sanitized context (no PII)', async () => {
    const error = new PaymentError('Payment failed', {
      severity: 'critical',
      userId: 'user-123',
      email: 'user@example.com', // Should be sanitized
      amount: 1000, // Should be included
    });

    await captureError(error);

    expect(enqueuePostHogEvent).toHaveBeenCalledWith(
      'error_occurred',
      'user-123',
      expect.objectContaining({
        severity: 'critical',
        domain: 'payment',
        amount: 1000, // Safe field
      })
    );

    // Verify PII was NOT sent to PostHog
    const eventProps = enqueuePostHogEvent.mock.calls[0][2];
    expect(eventProps).not.toHaveProperty('email');
  });

  it('skips DB for non-critical errors', async () => {
    const error = new RateLimitError('Rate limit exceeded', {
      severity: 'low',
    });

    await captureError(error);

    expect(saveCriticalError).not.toHaveBeenCalled();
    expect(enqueuePostHogEvent).toHaveBeenCalled();
  });

  it('uses observability_failures table when DB fails', async () => {
    saveCriticalError.mockRejectedValueOnce(new Error('DB connection failed'));

    const error = new PaymentError('Payment failed', { severity: 'critical' });

    await expect(captureError(error)).rejects.toThrow();

    expect(saveObservabilityFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.any(String),
        failure_reason: 'DB connection failed',
      })
    );
  });

  it('gracefully handles PostHog queue failure', async () => {
    enqueuePostHogEvent.mockRejectedValueOnce(new Error('Queue failed'));

    const error = new PaymentError('Payment failed', { severity: 'critical' });

    // Should NOT throw - PostHog queue failure is non-fatal
    await expect(captureError(error)).resolves.not.toThrow();

    // DB should still be called
    expect(saveCriticalError).toHaveBeenCalled();
  });
});
```

**Test toast integration:**
- `src/lib/toast/__tests__/index.test.ts`

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock captureError
mock.module('@/lib/posthog/capture-error', () => ({
  captureError: mock(() => Promise.resolve()),
}));

// Mock react-toastify
mock.module('react-toastify', () => ({
  toast: {
    error: mock(() => {}),
    success: mock(() => {}),
    info: mock(() => {}),
  },
}));

import { toast } from '@/lib/toast';
import { captureError } from '@/lib/posthog/capture-error';
import { PaymentError } from '@/lib/errors/error-classes';

describe('toast.error', () => {
  beforeEach(() => {
    captureError.mockClear();
  });

  it('captures ProductPixError to PostHog', async () => {
    const error = new PaymentError('Payment failed', { severity: 'critical' });

    toast.error(error);

    // Wait for async captureError call
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(captureError).toHaveBeenCalledWith(error);
  });

  it('does NOT capture plain string errors', () => {
    toast.error('Something went wrong');

    expect(captureError).not.toHaveBeenCalled();
  });

  it('does NOT capture generic Error instances', () => {
    toast.error(new Error('Generic error'));

    expect(captureError).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

**Test API routes with PostHog mocking:**

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock all PostHog and DB dependencies
mock.module('@/lib/posthog/queue', () => ({
  enqueuePostHogEvent: mock(() => Promise.resolve()),
}));

mock.module('@/lib/db/critical-errors', () => ({
  saveCriticalError: mock(() => Promise.resolve({ id: 'error-123' })),
}));

import { POST } from '@/app/api/generate/route';
import { enqueuePostHogEvent } from '@/lib/posthog/queue';
import { saveCriticalError } from '@/lib/db/critical-errors';

describe('POST /api/generate', () => {
  beforeEach(() => {
    enqueuePostHogEvent.mockClear();
    saveCriticalError.mockClear();
  });

  it('captures critical generation error when credits consumed', async () => {
    // Mock to trigger error after credits consumed
    // ... setup request that will fail after consuming credits

    const response = await POST(request);

    // Verify DB saved critical error
    expect(saveCriticalError).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'critical',
        domain: 'generation',
      })
    );

    // Verify PostHog queue received event
    expect(enqueuePostHogEvent).toHaveBeenCalledWith(
      'error_occurred',
      expect.any(String),
      expect.objectContaining({
        severity: 'critical',
        domain: 'generation',
      })
    );
  });

  it('captures high severity error when generation fails without consuming credits', async () => {
    // Mock to trigger error before credits consumed

    const response = await POST(request);

    // Verify PostHog queue received event with high severity
    expect(enqueuePostHogEvent).toHaveBeenCalledWith(
      'error_occurred',
      expect.any(String),
      expect.objectContaining({
        severity: 'high', // Not critical - credits not consumed
        domain: 'generation',
      })
    );
  });
});

describe('POST /api/webhooks/stripe', () => {
  it('captures payment error with critical severity', async () => {
    // Mock Stripe webhook that fails

    const response = await POST(request);

    expect(saveCriticalError).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'critical',
        domain: 'payment',
      })
    );
  });
});

describe('Rate limiting', () => {
  it('captures rate limit error with low severity', async () => {
    // Mock rate limit exceeded

    expect(enqueuePostHogEvent).toHaveBeenCalledWith(
      'error_occurred',
      expect.any(String),
      expect.objectContaining({
        severity: 'low',
        domain: 'rate-limit',
      })
    );

    // Verify NOT saved to DB (non-critical)
    expect(saveCriticalError).not.toHaveBeenCalled();
  });
});
```

**Test Server Actions:**

```typescript
import { describe, it, expect, mock } from 'bun:test';

mock.module('@/lib/posthog/capture-error', () => ({
  captureError: mock(() => Promise.resolve()),
}));

import { withErrorHandler } from '@/lib/server-actions/with-error-handler';
import { captureError } from '@/lib/posthog/capture-error';
import { PaymentError } from '@/lib/errors/error-classes';

describe('withErrorHandler', () => {
  it('returns Result type on ProductPixError', async () => {
    const failingAction = async () => {
      throw new PaymentError('Payment failed', { severity: 'critical' });
    };

    const wrappedAction = withErrorHandler(failingAction, 'testAction');
    const result = await wrappedAction();

    expect(result.success).toBe(false);
    expect(captureError).toHaveBeenCalled();
  });

  it('returns success result on successful action', async () => {
    const successAction = async () => ({ userId: '123' });

    const wrappedAction = withErrorHandler(successAction, 'testAction');
    const result = await wrappedAction();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ userId: '123' });
  });
});
```

**Test Server Components:**
- Data fetching error → verify captured and error UI rendered
- Rendering error → verify caught by error.tsx boundary

**Test admin timeline:**

```typescript
import { describe, it, expect, mock } from 'bun:test';

mock.module('@/lib/posthog/api', () => ({
  getPostHogEvents: mock(() => Promise.resolve([])),
}));

mock.module('@/lib/db/critical-errors', () => ({
  getCriticalErrors: mock(() => Promise.resolve([
    {
      id: 'error-1',
      severity: 'critical',
      domain: 'payment',
      created_at: new Date().toISOString(),
    },
  ])),
}));

import { GET } from '@/app/api/admin/users/[userId]/timeline/route';

describe('GET /api/admin/users/[userId]/timeline', () => {
  it('merges events from PostHog and database', async () => {
    const response = await GET(request, { params: { userId: 'user-123' } });
    const data = await response.json();

    expect(data.events).toHaveLength(1);
    expect(data.events[0].source).toBe('database');
  });

  it('gracefully degrades when PostHog credentials missing', async () => {
    // Set OBSERVABILITY_ENABLED=false
    process.env.OBSERVABILITY_ENABLED = 'false';

    const response = await GET(request, { params: { userId: 'user-123' } });
    const data = await response.json();

    // Should still return DB events
    expect(data.events).toHaveLength(1);
  });
});
```

### Testing Best Practices Summary

**Always follow this pattern:**

1. **Mock PostHog BEFORE importing code under test**
   ```typescript
   mock.module('@/lib/posthog/client', () => ({ ... }));
   mock.module('@/lib/posthog/queue', () => ({ ... }));
   // THEN import code that uses PostHog
   import { captureError } from '@/lib/posthog/capture-error';
   ```

2. **Disable observability in test environment by default**
   ```typescript
   // test/setup.ts
   process.env.OBSERVABILITY_ENABLED = 'false';
   process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED = 'false';
   ```

3. **Use test-specific PostHog credentials when needed**
   ```typescript
   process.env.NEXT_PUBLIC_POSTHOG_API_KEY = 'phc_test_key';
   process.env.POSTHOG_API_KEY = 'phx_test_key';
   ```

4. **Verify events were captured, not real API calls**
   ```typescript
   expect(enqueuePostHogEvent).toHaveBeenCalled();
   // NOT: expect(fetch).toHaveBeenCalledWith(posthogUrl)
   ```

5. **Test PII scrubbing explicitly**
   ```typescript
   const eventProps = enqueuePostHogEvent.mock.calls[0][2];
   expect(eventProps).not.toHaveProperty('email');
   ```

6. **Clear mocks before each test**
   ```typescript
   beforeEach(() => {
     posthog.capture.mockClear();
     enqueuePostHogEvent.mockClear();
   });
   ```

7. **Test fallback behavior**
   - DB failure → observability_failures table
   - PostHog queue failure → DB still succeeds
   - OBSERVABILITY_ENABLED=false → graceful degradation

### Manual QA Checklist

**Client-side:**
- [ ] Trigger error in generation flow → verify appears in PostHog
- [ ] Display toast with string message → verify NOT tracked in PostHog
- [ ] Display toast with ProductPixError → verify tracked in PostHog
- [ ] Trigger React error boundary → verify error captured to PostHog
- [ ] Toast notifications display correctly

**Server-side:**
- [ ] Trigger error in Server Action → verify captured to PostHog
- [ ] Server Action with withErrorHandler → verify returns Result type
- [ ] Server Component data fetch error → verify captured and error UI shown
- [ ] API route error → verify ProductPixError tracked
- [ ] Middleware error → verify logged (check server logs)

**Admin Dashboard:**
- [ ] View user in admin dashboard → see timeline with mixed events
- [ ] Filter timeline by severity → verify filtered results
- [ ] Filter timeline by domain (e.g., only payment errors) → verify filtered results
- [ ] Filter by both severity AND domain → verify combined filters work
- [ ] Load more events (pagination) → verify next page loads
- [ ] Timeline with 1000+ events → verify performance acceptable
- [ ] **Error Resolution Workflow:**
  - [ ] Click "Resolve" on unresolved error → verify marked as resolved
  - [ ] Resolved error shows ✓ badge with admin name and timestamp
  - [ ] Click "Unresolve" on resolved error → verify marked as unresolved
  - [ ] Filter timeline to "Unresolved Only" → verify only unresolved errors shown
  - [ ] Filter timeline to "Resolved Only" → verify only resolved errors shown
  - [ ] User stats show correct unresolved error counts
  - [ ] Resolve error as Admin A, verify shows "Resolved by Admin A" when Admin B views

**Observability:**
- [ ] PostHog initializes once on app load (check browser console for `posthog.__loaded`)
- [ ] Navigate between pages → verify PostHog NOT re-initialized
- [ ] Pageview events tracked on navigation (check PostHog dashboard)
- [ ] Critical error → verify appears in DB `critical_errors` table
- [ ] Critical error → verify appears in PostHog (async)
- [ ] **Session recording consent flow:**
  - [ ] Without consent: Session recording DISABLED (check PostHog - no recordings)
  - [ ] Accept analytics cookies → session recording starts immediately
  - [ ] Check PostHog dashboard → verify recording appears
  - [ ] Reject analytics cookies → session recording stops
  - [ ] Reload page without consent → session recording stays disabled
  - [ ] Reload page with consent → session recording auto-starts
  - [ ] Verify `checkAnalyticsConsent()` reads cookie banner consent correctly
- [ ] **Request ID correlation:**
  - [ ] Make API request → verify response has `x-request-id` header
  - [ ] Trigger error → verify error in DB has requestId in context
  - [ ] Same error → verify PostHog event has same requestId
  - [ ] Check logs → grep by requestId → find all related log lines
  - [ ] Search PostHog by requestId → find all events from same request
  - [ ] Verify can trace single request from start to finish across all systems
- [ ] PostHog user identification works (check PostHog dashboard)
- [ ] PostHog event queue processes events (check queue table)
- [ ] Simulate DB failure → verify error appears in `observability_failures` table
- [ ] Check `observability_failures` table periodically (admin workflow)

**PII Protection:**
- [ ] Trigger error with email in context → verify email NOT in PostHog, but IS in DB
- [ ] Trigger error with IP address → verify IP NOT in PostHog, but IS in DB
- [ ] Check PostHog event properties → verify no PII (no emails, IPs, cards, tokens)
- [ ] Check DB critical_errors table → verify full context preserved (including stack traces)
- [ ] Verify user properties in PostHog use domain only (not full email)

## Rollout Checklist

**Pre-launch:**
- [ ] PostHog account created and API keys configured
- [ ] Database migration applied (`00033_create_critical_errors.sql`)
- [ ] Environment variables set in production
- [ ] All API routes migrated from `console.error`
- [ ] **Toast system migration complete:**
  - [ ] Pre-migration audit complete (grep commands run, patterns documented)
  - [ ] Feature comparison matrix validated
  - [ ] All files migrated (verified via grep - no old imports remain)
  - [ ] Visual regression testing passed
  - [ ] Manual testing checklist complete (all toast variants working)
  - [ ] Old `useToast` hook deleted or marked deprecated
- [ ] Admin dashboard timeline tested with real data
- [ ] **Context Standardization:**
  - [ ] All error classes use typed context interfaces
  - [ ] ErrorContextBuilder used for all error instantiation
  - [ ] No ad-hoc context objects (Record<string, unknown>)
  - [ ] Required fields validated for each error domain
  - [ ] Field naming follows camelCase convention throughout
- [ ] **Session Recording Consent:**
  - [ ] Cookie banner implemented and functional
  - [ ] PostHogProvider listens to `cookieConsentChange` event
  - [ ] `checkAnalyticsConsent()` integrated with cookie banner storage
  - [ ] Session recording disabled by default (verify in PostHog)
  - [ ] Session recording only starts with explicit consent
  - [ ] Privacy policy updated to mention session recording
- [ ] **Request ID Correlation:**
  - [ ] Middleware generates unique request IDs for all requests
  - [ ] Request IDs included in all error contexts
  - [ ] Request IDs included in all PostHog events
  - [ ] Request IDs included in all logs
  - [ ] Can trace single request across DB + PostHog + logs

**Launch:**
- [ ] Deploy with feature flag (if available) or gradual rollout
- [ ] Monitor PostHog ingestion (check events arriving)
- [ ] Monitor DB critical_errors table (shouldn't be empty if errors occur)
- [ ] Check admin timeline loads without errors

**Post-launch:**
- [ ] Review error patterns in PostHog
- [ ] Set up PostHog alerts for critical error spikes
- [ ] Document admin workflow for reviewing user timelines
- [ ] Train support team on using timeline for debugging
- [ ] Set up weekly review of `observability_failures` table (cron/reminder)
- [ ] If observability_failures table has entries, investigate infrastructure issues
- [ ] Configure PostHog data retention (30-90 days recommended)
- [ ] Document GDPR compliance: PostHog has pseudonymous data only, DB deletable on request
- [ ] Audit PostHog events for PII (spot check) - should find none

## Critical Files Reference

**New Files:**
- `src/lib/errors/error-classes.ts` (includes ErrorContext types and ErrorContextBuilder)
- `src/lib/request/get-request-id.ts` (request ID extraction helpers)
- `src/lib/posthog/client.ts`
- `src/lib/posthog/server.ts`
- `src/lib/posthog/identify.ts`
- `src/lib/posthog/events.ts`
- `src/lib/posthog/sanitize.ts`
- `src/lib/posthog/capture-error.ts`
- `src/lib/posthog/queue.ts`
- `src/lib/posthog/api.ts`
- `src/lib/db/critical-errors.ts`
- `src/lib/db/observability-failures.ts`
- `src/lib/workers/posthog-worker.ts`
- `src/lib/server-actions/with-error-handler.ts`
- `src/app/api/cron/posthog-sync/route.ts` (if using Option A deployment)
- `src/lib/toast/index.ts`
- `src/components/providers/toast-provider.tsx`
- `src/components/providers/posthog-provider.tsx`
- `src/app/api/admin/users/[userId]/timeline/route.ts`
- `src/app/api/admin/errors/[errorId]/resolve/route.ts`
- `src/app/admin/users/[userId]/page.tsx`
- `src/components/admin/user-timeline.tsx`
- `src/components/admin/user-stats.tsx`
- `supabase/migrations/00033_create_critical_errors.sql`
- `supabase/migrations/00034_create_posthog_event_queue.sql`
- `supabase/migrations/00035_create_observability_failures.sql`

**Files to Modify:**
- `src/app/layout.tsx` (add QueryClientProvider, PostHogProvider, ToastProvider)
- `src/lib/env.ts` (add PostHog env vars)
- `src/components/ui/error-boundary.tsx` (add error capture)
- `src/app/error.tsx` (add error capture)
- `src/middleware.ts` (add request ID generation + error handling, create if not exists)
- `src/app/api/generate/route.ts` (migrate to GenerationError)
- `src/app/api/webhooks/stripe/route.ts` (migrate to PaymentError)
- `src/app/api/refunds/*/route.ts` (migrate to CreditError)
- `src/components/admin/admin-nav.tsx` (add Users nav item)
- All components using `useToast` hook (migrate to react-toastify)
- Server Actions (wrap with withErrorHandler or explicit try/catch)

**Existing Files (Reference):**
- `src/lib/logging/index.ts` (keep as-is, complementary to PostHog)
- `src/hooks/use-toast.ts` (delete after migration complete)
- `src/lib/auth/admin.ts` (use for admin verification)

## Success Metrics

**Week 1:**
- All API routes use error classes with appropriate severity
- Critical errors (severity: 'critical') appearing in DB table
- All errors appearing in PostHog with domain and severity tags
- Can filter PostHog by domain (payment, credit, generation) and severity
- PII scrubbing verified: PostHog events contain no emails, IPs, or sensitive data
- **Context standardization:**
  - All errors use typed context interfaces (no ad-hoc objects)
  - Consistent field naming across all errors (camelCase, full names)
  - Required fields present for each error domain
  - TypeScript catches context field typos at compile time
- **Request ID correlation working:**
  - All API requests generate unique request IDs
  - Request IDs visible in response headers (`x-request-id`)
  - Request IDs present in all error contexts
  - Request IDs present in all PostHog events
  - Request IDs present in all structured logs
  - Can trace individual requests end-to-end across all systems

**Week 2:**
- Client-side errors captured (boundary + global error page)
- Server-side errors captured (Server Actions, Server Components, middleware)
- **Toast migration complete and validated:**
  - All components migrated from useToast to react-toastify
  - No old toast imports remaining (verified via grep)
  - ProductPixError auto-tracking working correctly
  - Visual appearance matches design requirements
  - No user-facing regressions reported
- Zero `console.error` calls outside error handlers

**Week 3:**
- Admin dashboard timeline functional
- Users can be debugged via timeline view
- **Session recording with consent:**
  - Cookie banner integrated and working
  - Session recording disabled by default
  - Only users who consent to analytics have recordings
  - Session replays available for consenting users (helps debug issues)
  - No privacy violations reported
- **Error resolution workflow in use:**
  - Admins marking errors as resolved after investigation
  - Timeline filters working (unresolved only, resolved only)
  - User stats showing accurate unresolved error counts

**Ongoing:**
- Error grouping in PostHog by domain and severity makes pattern identification easy
- Can create PostHog insights filtered by severity (e.g., "critical errors over time")
- Support team uses timeline for troubleshooting
- **Resolution SLAs:**
  - Critical errors (severity: 'critical') resolved within 24 hours
  - High severity errors reviewed within 1 week
  - Medium/low severity errors monitored for patterns
- **Metrics tracked:**
  - Average time to resolution by severity
  - Unresolved error count by user/domain
  - Resolution rate per admin (team performance)
