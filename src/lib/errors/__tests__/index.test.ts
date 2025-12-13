import { describe, it, expect } from 'bun:test';

import {
  createAuthError,
  createCreditError,
  createGenerationError,
  createPaymentError,
  createRateLimitError,
  createValidationError,
  ErrorCodes,
  ProductPixError,
} from '../index';

describe('Error Handling', () => {
  describe('ProductPixError class', () => {
    it('creates error with correct properties', () => {
      const error = new ProductPixError('Test error', {
        domain: 'system',
        severity: 'high',
        errorCode: ErrorCodes.SYSTEM_ERROR,
        userId: 'user123',
        requestId: 'req456',
        context: { key: 'value' },
        retryable: true,
      });

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ProductPixError');
      expect(error.domain).toBe('system');
      expect(error.severity).toBe('high');
      expect(error.errorCode).toBe(ErrorCodes.SYSTEM_ERROR);
      expect(error.userId).toBe('user123');
      expect(error.requestId).toBe('req456');
      expect(error.context).toEqual({ key: 'value' });
      expect(error.retryable).toBe(true);
      expect(error.isCritical).toBe(false);
      expect(typeof error.timestamp).toBe('string');
    });

    it('defaults retryable to false', () => {
      const error = new ProductPixError('Test error', {
        domain: 'system',
        severity: 'high',
        errorCode: ErrorCodes.SYSTEM_ERROR,
      });

      expect(error.retryable).toBe(false);
    });

    it('identifies critical errors', () => {
      const criticalError = new ProductPixError('Critical error', {
        domain: 'system',
        severity: 'critical',
        errorCode: ErrorCodes.SYSTEM_ERROR,
      });

      const highError = new ProductPixError('High error', {
        domain: 'system',
        severity: 'high',
        errorCode: ErrorCodes.SYSTEM_ERROR,
      });

      expect(criticalError.isCritical).toBe(true);
      expect(highError.isCritical).toBe(false);
    });
  });

  describe('Validation failures', () => {
    it('throws on invalid payment amount', () => {
      expect(() => createPaymentError(
        ErrorCodes.PAYMENT_INTENT_FAILED,
        'Test',
        { amount: 'invalid' as any, currency: 'usd' }
      )).toThrow();
    });

    it('throws on negative payment amount', () => {
      expect(() => createPaymentError(
        ErrorCodes.PAYMENT_INTENT_FAILED,
        'Test',
        { amount: -100, currency: 'usd' }
      )).toThrow();
    });

    it('throws on invalid currency code', () => {
      expect(() => createPaymentError(
        ErrorCodes.PAYMENT_INTENT_FAILED,
        'Test',
        { amount: 100, currency: 'invalid-currency' }
      )).toThrow();
    });

    it('throws on missing required credit fields', () => {
      expect(() => createCreditError(
        ErrorCodes.CREDIT_INSUFFICIENT,
        'Test',
        {} as any
      )).toThrow();
    });

    it('throws on negative credit amount', () => {
      expect(() => createCreditError(
        ErrorCodes.CREDIT_INSUFFICIENT,
        'Test',
        { amount: -50, operation: 'consume' }
      )).toThrow();
    });

    it('throws on invalid credit operation', () => {
      expect(() => createCreditError(
        ErrorCodes.CREDIT_INSUFFICIENT,
        'Test',
        { amount: 50, operation: 'invalid-operation' as any }
      )).toThrow();
    });

    it('throws on negative creditsConsumed', () => {
      expect(() => createGenerationError(
        ErrorCodes.GENERATION_FAILED,
        'Test',
        { templateSlug: 'test', creditsConsumed: -10 }
      )).toThrow();
    });

    it('throws on invalid authMethod', () => {
      expect(() => createAuthError(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Test',
        { authMethod: 'invalid-method' as any }
      )).toThrow();
    });

    it('throws on invalid provider', () => {
      expect(() => createAuthError(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Test',
        { authMethod: 'oauth', provider: 'invalid-provider' as any }
      )).toThrow();
    });

    it('throws on invalid severity value', () => {
      expect(() => createPaymentError(
        ErrorCodes.PAYMENT_INTENT_FAILED,
        'Test',
        { amount: 100, severity: 'invalid' as any }
      )).toThrow();
    });

    it('throws on invalid resetAt datetime format', () => {
      expect(() => createRateLimitError(
        'Test',
        { limit: 100, remaining: 0, resetAt: 'invalid-date' }
      )).toThrow();
    });
  });

  describe('Factory functions', () => {
    it('creates payment error with validation', () => {
      const error = createPaymentError(
        ErrorCodes.PAYMENT_INTENT_FAILED,
        'Payment failed',
        {
          amount: 100,
          currency: 'usd',
          paymentIntentId: 'pi_123',
          userId: 'user123',
          requestId: 'req456',
        }
      );

      expect(error.message).toBe('Payment failed');
      expect(error.domain).toBe('payment');
      expect(error.severity).toBe('critical');
      expect(error.errorCode).toBe(ErrorCodes.PAYMENT_INTENT_FAILED);
      expect(error.context.amount).toBe(100);
      expect(error.context.currency).toBe('usd');
      expect(error.context.paymentIntentId).toBe('pi_123');
      expect(error.userId).toBe('user123');
      expect(error.requestId).toBe('req456');
      expect(error.retryable).toBe(false);
    });

    it('creates credit error with validation', () => {
      const error = createCreditError(
        ErrorCodes.CREDIT_INSUFFICIENT,
        'Insufficient credits',
        {
          amount: 50,
          operation: 'consume',
          balanceBefore: 25,
          balanceAfter: 25,
          userId: 'user123',
        }
      );

      expect(error.domain).toBe('credit');
      expect(error.severity).toBe('critical');
      expect(error.errorCode).toBe(ErrorCodes.CREDIT_INSUFFICIENT);
      expect(error.context.amount).toBe(50);
      expect(error.context.operation).toBe('consume');
      expect(error.context.balanceBefore).toBe(25);
      expect(error.context.balanceAfter).toBe(25);
    });

    it('creates generation error with dynamic severity', () => {
      const errorWithCredits = createGenerationError(
        ErrorCodes.GENERATION_FAILED,
        'Generation failed',
        {
          templateSlug: 'ecommerce-base',
          creditsConsumed: 10,
          creditAmount: 100,
          userId: 'user123',
        }
      );

      const errorWithoutCredits = createGenerationError(
        ErrorCodes.GENERATION_TIMEOUT,
        'Generation timeout',
        {
          templateSlug: 'ecommerce-base',
          creditsConsumed: 0,
          userId: 'user123',
        }
      );

      expect(errorWithCredits.severity).toBe('critical');
      expect(errorWithoutCredits.severity).toBe('high');
      expect(errorWithCredits.retryable).toBe(false);
      expect(errorWithoutCredits.retryable).toBe(false);
    });

    it('creates auth error', () => {
      const error = createAuthError(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Unauthorized access',
        {
          authMethod: 'oauth',
          provider: 'google',
          emailDomain: 'example.com',
          userId: 'user123',
        }
      );

      expect(error.domain).toBe('auth');
      expect(error.severity).toBe('critical');
      expect(error.errorCode).toBe(ErrorCodes.AUTH_UNAUTHORIZED);
      expect(error.context.authMethod).toBe('oauth');
      expect(error.context.provider).toBe('google');
      expect(error.context.emailDomain).toBe('example.com');
    });

    it('creates rate limit error', () => {
      const error = createRateLimitError(
        'Rate limit exceeded',
        {
          limit: 100,
          remaining: 0,
          resetAt: '2024-01-01T00:00:00Z',
          userId: 'user123',
        }
      );

      expect(error.domain).toBe('rate-limit');
      expect(error.severity).toBe('low');
      expect(error.errorCode).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(error.context.limit).toBe(100);
      expect(error.context.remaining).toBe(0);
      expect(error.context.resetAt).toBe('2024-01-01T00:00:00Z');
      expect(error.retryable).toBe(true);
    });

    it('creates validation error', () => {
      const error = createValidationError(
        'Invalid input',
        {
          field: 'email',
          validationRule: 'email-format',
          userId: 'user123',
        }
      );

      expect(error.domain).toBe('validation');
      expect(error.severity).toBe('low');
      expect(error.errorCode).toBe(ErrorCodes.VALIDATION_FAILED);
      expect(error.context.field).toBe('email');
      expect(error.context.validationRule).toBe('email-format');
      expect(error.retryable).toBe(false);
    });
  });
});
