import { describe, it, expect } from 'bun:test';
import { PaymentErrorContextSchema } from '../schemas';

describe('PaymentErrorContextSchema', () => {
  it('requires amount field', () => {
    expect(() => PaymentErrorContextSchema.parse({})).toThrow();
  });

  it('sets default currency to usd', () => {
    const result = PaymentErrorContextSchema.parse({ amount: 100 });
    expect(result.currency).toBe('usd');
  });

  it('accepts custom currency', () => {
    const result = PaymentErrorContextSchema.parse({ amount: 100, currency: 'eur' });
    expect(result.currency).toBe('eur');
  });

  it('accepts optional fields', () => {
    const result = PaymentErrorContextSchema.parse({
      amount: 100,
      paymentIntentId: 'pi_123',
      stripeErrorCode: 'card_declined'
    });
    expect(result.amount).toBe(100);
    expect(result.paymentIntentId).toBe('pi_123');
    expect(result.stripeErrorCode).toBe('card_declined');
  });

  it('validates currency length', () => {
    expect(() => PaymentErrorContextSchema.parse({ amount: 100, currency: 'us' })).toThrow();
    expect(() => PaymentErrorContextSchema.parse({ amount: 100, currency: 'usdd' })).toThrow();
  });

  it('validates amount is non-negative', () => {
    expect(() => PaymentErrorContextSchema.parse({ amount: -100 })).toThrow();
    const result = PaymentErrorContextSchema.parse({ amount: 0 });
    expect(result.amount).toBe(0);
  });
});