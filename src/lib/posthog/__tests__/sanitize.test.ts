import { describe, it, expect } from 'bun:test';
import { sanitizeForPostHog } from '../sanitize';

describe('sanitizeForPostHog', () => {
  it('should blocklist sensitive field names', () => {
    const input = {
      email: 'user@example.com',
      password: 'secret123',
      token: 'abc123',
      safeField: 'this is safe',
    };

    const result = sanitizeForPostHog(input);

    expect(result).toEqual({
      safeField: 'this is safe',
    });
  });

  it('should redact PII patterns in string values', () => {
    const input = {
      message: 'Contact user@example.com or call 192.168.1.1 for support. Card: 1234-5678-9012-3456',
      safeField: 'this is safe',
    };

    const result = sanitizeForPostHog(input);

    expect(result).toEqual({
      message: 'Contact [EMAIL] or call [IP] for support. Card: [CARD]',
      safeField: 'this is safe',
    });
  });

  it('should preserve UUIDs in string values', () => {
    const input = {
      message: 'Request ID: 550e8400-e29b-41d4-a716-446655440000 and token: abcdef1234567890abcdef1234567890',
    };

    const result = sanitizeForPostHog(input);

    expect(result).toEqual({
      message: 'Request ID: 550e8400-e29b-41d4-a716-446655440000 and token: [TOKEN]',
    });
  });

  it('should recursively sanitize nested objects and arrays', () => {
    const input = {
      user: {
        email: 'user@example.com',
        details: {
          phone: '555-1234',
          address: '123 Main St',
        },
      },
      logs: [
        'Error with token abcdef1234567890abcdef1234567890abcdef',
        { message: 'IP 192.168.1.1 connected' },
      ],
      safe: 'this is safe',
    };

    const result = sanitizeForPostHog(input);

    expect(result).toEqual({
      user: {
        details: {},
      },
      logs: [
        'Error with token [TOKEN]',
        { message: 'IP [IP] connected' },
      ],
      safe: 'this is safe',
    });
  });
});