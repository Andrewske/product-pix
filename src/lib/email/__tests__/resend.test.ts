import { sendEmail } from '@/lib/email';

describe('sendEmail', () => {
  it('returns structured result object without throwing', async () => {
    // Test with invalid params - should not throw
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
  });

  it('handles dev mode correctly', async () => {
    // This test assumes EMAIL_ENABLED is not 'true' in test environment
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('dev-mode');
  });
});