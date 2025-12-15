import { describe, it, expect } from 'bun:test';
import { createPaymentError, createValidationError } from '../error-classes';
import { ErrorCodes } from '../codes';

describe('createPaymentError', () => {
  it('validates required fields', () => {
    expect(() => createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'test', {} as any)).toThrow();
  });

  it('sets default severity to critical', () => {
    const error = createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'test', { amount: 100 });
    expect(error.severity).toBe('critical');
  });

  it('allows severity override', () => {
    const error = createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'test', { amount: 100, severity: 'high' });
    expect(error.severity).toBe('high');
  });

  it('generates error code from message', () => {
    const error = createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'Payment failed', { amount: 100 });
    expect(error.errorCode).toBe('PAYMENT_INTENT_FAILED');
  });

  it('sets domain to payment', () => {
    const error = createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'test', { amount: 100 });
    expect(error.domain).toBe('payment');
  });

  it('includes context in error', () => {
    const error = createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'test', {
      amount: 100,
      currency: 'eur',
      paymentIntentId: 'pi_123'
    });
    expect(error.context).toEqual({
      amount: 100,
      currency: 'eur',
      paymentIntentId: 'pi_123'
    });
  });

  it('sets default currency to usd', () => {
    const error = createPaymentError(ErrorCodes.PAYMENT_INTENT_FAILED, 'test', { amount: 100 });
    expect(error.context.currency).toBe('usd');
  });
});

describe('createValidationError', () => {
  it('sets severity to low', () => {
    const error = createValidationError('test', { field: 'email', validationRule: 'required' });
    expect(error.severity).toBe('low');
  });

  it('sets domain to validation', () => {
    const error = createValidationError('test', { field: 'email', validationRule: 'required' });
    expect(error.domain).toBe('validation');
  });

  it('sets error code to VALIDATION_FAILED', () => {
    const error = createValidationError('test', { field: 'email', validationRule: 'required' });
    expect(error.errorCode).toBe('VALIDATION_FAILED');
  });

  it('includes validation context', () => {
    const error = createValidationError('test', {
      field: 'email',
      validationRule: 'email_format'
    });
    expect(error.context).toEqual({
      field: 'email',
      validationRule: 'email_format'
    });
  });
});