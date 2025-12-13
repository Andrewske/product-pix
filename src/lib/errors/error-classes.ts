import type { z } from 'zod';

import { getRequestContext } from '@/lib/request';
import { ErrorCodes, type ErrorCode } from './codes';

import {
  AuthErrorContextSchema,
  CreditErrorContextSchema,
  GenerationErrorContextSchema,
  PaymentErrorContextSchema,
  RateLimitErrorContextSchema,
  ValidationErrorContextSchema,
} from './schemas';

export type ErrorDomain = 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

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
    const context = getRequestContext();
    this.name = 'ProductPixError';
    this.userId = opts.userId ?? context?.userId;
    this.requestId = opts.requestId ?? context?.requestId;
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
    severity: parsed.severity ?? (parsed.creditsConsumed > 0 ? 'critical' : 'high'),
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