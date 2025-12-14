# Create Error Schemas, Codes Registry, and Factory Functions

## Files to Modify/Create
- `src/lib/errors/codes.ts` (new)
- `src/lib/errors/schemas.ts` (new)
- `src/lib/errors/error-classes.ts` (new)
- `src/lib/errors/index.ts` (new - barrel export)

## Implementation Details

### Error Code Registry

Create `src/lib/errors/codes.ts` with predefined error codes per domain:

```typescript
export const ErrorCodes = {
  // Payment domain
  PAYMENT_INTENT_FAILED: 'PAYMENT_INTENT_FAILED',
  PAYMENT_WEBHOOK_INVALID: 'PAYMENT_WEBHOOK_INVALID',
  PAYMENT_REFUND_FAILED: 'PAYMENT_REFUND_FAILED',

  // Credit domain
  CREDIT_INSUFFICIENT: 'CREDIT_INSUFFICIENT',
  CREDIT_CONSUME_FAILED: 'CREDIT_CONSUME_FAILED',
  CREDIT_REFUND_FAILED: 'CREDIT_REFUND_FAILED',

  // Generation domain
  GENERATION_FAILED: 'GENERATION_FAILED',
  GENERATION_TIMEOUT: 'GENERATION_TIMEOUT',
  GENERATION_INVALID_INPUT: 'GENERATION_INVALID_INPUT',

  // Auth domain
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // Rate limit
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // System
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

### Error Context Schemas

Define Zod schemas for error contexts in `schemas.ts`:

- `BaseErrorContextSchema` - userId, requestId, route, method, statusCode, duration, tags, environment
- `PaymentErrorContextSchema` - extends base + amount (required), currency (default 'usd'), paymentIntentId, stripeErrorCode
- `CreditErrorContextSchema` - extends base + amount (required), operation (required), balanceBefore, balanceAfter
- `GenerationErrorContextSchema` - extends base + templateSlug (required), creditsConsumed (required), creditAmount, retryable
- `AuthErrorContextSchema` - extends base + authMethod (required), provider, emailDomain (sanitized)
- `RateLimitErrorContextSchema` - extends base + limit (required), remaining (required), resetAt (required)
- `ValidationErrorContextSchema` - extends base + field (required), validationRule (required)

### Base Error Class

Create `ProductPixError` base class in `error-classes.ts`:

```typescript
type ErrorDomain = 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface ProductPixErrorOptions {
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
  severity: Severity;
  domain: ErrorDomain;
  errorCode: ErrorCode;
  retryable?: boolean;
}

export class ProductPixError extends Error {
  readonly userId?: string;
  readonly requestId?: string;
  readonly context: Record<string, unknown>;
  readonly severity: Severity;
  readonly domain: ErrorDomain;
  readonly errorCode: ErrorCode;
  readonly timestamp: string;
  readonly retryable: boolean;

  constructor(message: string, opts: ProductPixErrorOptions) {
    super(message);
    this.name = 'ProductPixError';
    this.userId = opts.userId;
    this.requestId = opts.requestId;
    this.context = opts.context ?? {};
    this.severity = opts.severity;
    this.domain = opts.domain;
    this.errorCode = opts.errorCode;
    this.timestamp = new Date().toISOString();
    this.retryable = opts.retryable ?? false;
  }

  get isCritical(): boolean {
    return this.severity === 'critical';
  }
}
```

### Factory Functions with Zod Validation

Create factory functions that validate THEN construct:

```typescript
import { ErrorCodes, type ErrorCode } from './codes';

export function createPaymentError(
  code: ErrorCode,
  message: string,
  context: z.input<typeof PaymentErrorContextSchema>
): ProductPixError {
  const parsed = PaymentErrorContextSchema.parse(context);

  return new ProductPixError(message, {
    domain: 'payment',
    severity: parsed.severity ?? 'critical',
    errorCode: code,
    context: parsed,
    userId: parsed.userId,
    requestId: parsed.requestId,
    retryable: false,
  });
}

export function createCreditError(
  code: ErrorCode,
  message: string,
  context: z.input<typeof CreditErrorContextSchema>
): ProductPixError {
  const parsed = CreditErrorContextSchema.parse(context);

  return new ProductPixError(message, {
    domain: 'credit',
    severity: parsed.severity ?? 'critical',
    errorCode: code,
    context: parsed,
    userId: parsed.userId,
    requestId: parsed.requestId,
    retryable: false,
  });
}

export function createGenerationError(
  code: ErrorCode,
  message: string,
  context: z.input<typeof GenerationErrorContextSchema>
): ProductPixError {
  const parsed = GenerationErrorContextSchema.parse(context);

  return new ProductPixError(message, {
    domain: 'generation',
    severity: parsed.creditsConsumed ? (parsed.severity ?? 'critical') : (parsed.severity ?? 'high'),
    errorCode: code,
    context: parsed,
    userId: parsed.userId,
    requestId: parsed.requestId,
    retryable: parsed.retryable ?? false,
  });
}

export function createAuthError(
  code: ErrorCode,
  message: string,
  context: z.input<typeof AuthErrorContextSchema>
): ProductPixError {
  const parsed = AuthErrorContextSchema.parse(context);

  return new ProductPixError(message, {
    domain: 'auth',
    severity: parsed.severity ?? 'critical',
    errorCode: code,
    context: parsed,
    userId: parsed.userId,
    requestId: parsed.requestId,
    retryable: false,
  });
}

export function createRateLimitError(
  message: string,
  context: z.input<typeof RateLimitErrorContextSchema>
): ProductPixError {
  const parsed = RateLimitErrorContextSchema.parse(context);

  return new ProductPixError(message, {
    domain: 'rate-limit',
    severity: 'low',
    errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED,
    context: parsed,
    userId: parsed.userId,
    requestId: parsed.requestId,
    retryable: true,
  });
}

export function createValidationError(
  message: string,
  context: z.input<typeof ValidationErrorContextSchema>
): ProductPixError {
  const parsed = ValidationErrorContextSchema.parse(context);

  return new ProductPixError(message, {
    domain: 'validation',
    severity: 'low',
    errorCode: ErrorCodes.VALIDATION_FAILED,
    context: parsed,
    userId: parsed.userId,
    requestId: parsed.requestId,
    retryable: false,
  });
}
```

### Default Severity Levels
- PaymentError: 'critical'
- CreditError: 'critical'
- GenerationError: 'critical' if creditsConsumed, 'high' otherwise
- AuthError: 'critical'
- RateLimitError: 'low'
- ValidationError: 'low'

### Barrel Export

Create `index.ts` to export all error classes, schemas, codes, and factory functions.

## Acceptance Criteria
- [ ] Error code registry created with all domain codes
- [ ] All Zod schemas defined with proper extends and defaults
- [ ] ProductPixError base class created (always constructable)
- [ ] All 6 factory functions created (createPaymentError, etc.)
- [ ] Zod validation runs in factory functions BEFORE construction
- [ ] Factory functions require explicit error code from registry
- [ ] Default severity levels correct per domain
- [ ] Barrel export includes all exports

## Dependencies
- Task 01 (dependencies installed)
