import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { sendEmail } from '../resend';

const mockEmailsSend = mock(() => Promise.resolve({
  data: { id: 'email-123' } as any,
  error: null as any,
}));

const mockResendInstance = {
  emails: { send: mockEmailsSend },
};

const mockResendConstructor = mock(() => mockResendInstance);

mock.module('resend', () => ({
  Resend: mockResendConstructor,
}));

mock.module('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM_EMAIL: 'test@example.com',
    EMAIL_ENABLED: 'true',
  },
}));

const mockLoggerInfo = mock(() => {});
const mockLoggerError = mock(() => {});

mock.module('@/lib/logging', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
  },
}));

describe('sendEmail', () => {
  beforeEach(() => {
    mockEmailsSend.mockClear();
    mockResendConstructor.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
  });

  it('sends email successfully', async () => {
    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('email-123');
    expect(result.error).toBeUndefined();

    expect(mockEmailsSend).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(mockLoggerInfo).toHaveBeenCalledWith('Email sent successfully', {
      emailId: 'email-123',
      to: 'recipient@example.com',
      subject: 'Test Subject',
    });
  });

  it('handles multiple recipients', async () => {
    const result = await sendEmail({
      to: ['recipient1@example.com', 'recipient2@example.com'],
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(mockEmailsSend).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: ['recipient1@example.com', 'recipient2@example.com'],
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });
  });

  it('includes replyTo if provided', async () => {
    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
      replyTo: 'reply@example.com',
    });

    expect(result.success).toBe(true);
    expect(mockEmailsSend).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Subject',
      html: '<p>Test content</p>',
      replyTo: 'reply@example.com',
    });
  });

  it('returns error when Resend API fails', async () => {
    mockEmailsSend.mockResolvedValueOnce({
      data: null as any,
      error: { message: 'API rate limit exceeded' } as any,
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('API rate limit exceeded');
    expect(result.emailId).toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith('Failed to send email via Resend', {
      location: 'lib/email/resend.ts:sendEmail',
      cause: 'API rate limit exceeded',
      state: { to: 'recipient@example.com', subject: 'Test Subject' },
    });
  });

  it('skips sending when EMAIL_ENABLED is false', async () => {
    mock.module('@/lib/env', () => ({
      env: {
        RESEND_API_KEY: 're_test_key',
        RESEND_FROM_EMAIL: 'test@example.com',
        EMAIL_ENABLED: 'false',
      },
    }));

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('dev-mode');
    expect(mockEmailsSend).not.toHaveBeenCalled();

    expect(mockLoggerInfo).toHaveBeenCalledWith('Email sending disabled (dev mode)', {
      to: 'recipient@example.com',
      subject: 'Test Subject'
    });
  });



  it('handles missing API configuration', async () => {
    mock.module('@/lib/env', () => ({
      env: {
        RESEND_API_KEY: undefined,
        RESEND_FROM_EMAIL: 'test@example.com',
        EMAIL_ENABLED: 'true',
      },
    }));

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email service not configured');

    expect(mockLoggerError).toHaveBeenCalledWith('Email service not configured', {
      location: 'lib/email/resend.ts:sendEmail',
      cause: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL',
    });
  });
});