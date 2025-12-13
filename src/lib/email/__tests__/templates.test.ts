import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { renderContactAdminNotification, renderContactUserAcknowledgment } from '../templates';

mock.module('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://productpix.com',
  },
}));

describe('Email Templates', () => {
  describe('renderContactAdminNotification', () => {
    it('renders admin notification with all details', async () => {
      const html = await renderContactAdminNotification({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message',
        submittedAt: '2025-01-15T10:30:00Z',
      });

      expect(html).toContain('New Contact Submission');
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('This is a test message');
      expect(html).toContain('January 15, 2025');
      expect(html).toContain('mailto:john@example.com');
    });

    it('escapes HTML in message', async () => {
      const html = await renderContactAdminNotification({
        name: 'Test',
        email: 'test@example.com',
        message: '<script>alert("XSS")</script>',
        submittedAt: '2025-01-15T10:30:00Z',
      });

      // Should NOT contain raw script tag
      expect(html).not.toContain('<script>alert("XSS")</script>');
      // Should contain escaped version (JSX email escapes < characters)
      expect(html).toContain('&#x3C;script>alert("XSS")&#x3C;/script>');
    });
  });

  describe('renderContactUserAcknowledgment', () => {
    it('renders user acknowledgment with name', async () => {
      const html = await renderContactUserAcknowledgment({
        name: 'Jane Smith',
      });

      expect(html).toContain('Thanks for reaching out!');
      expect(html).toContain('Hi Jane Smith,');
      expect(html).toContain('We\'ve received your message');
      expect(html).toContain('ProductPix');
      expect(html).toContain('https://productpix.com');
    });

    it('includes app URL from environment', async () => {
      const html = await renderContactUserAcknowledgment({
        name: 'Test User',
      });

      expect(html).toContain('https://productpix.com');
      expect(html).toContain('<a href="https://productpix.com"');
    });
  });
});