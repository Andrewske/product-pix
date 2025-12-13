# Create Email Templates

## Overview
Build HTML email templates for contact form with XSS protection and brand styling.

## Files to Modify/Create
- `src/lib/email/templates.ts` (create new)

## Implementation Details

### File: `src/lib/email/templates.ts`

```typescript
import { env } from '@/lib/env';

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export interface ContactNotificationParams {
  name: string;
  email: string;
  message: string;
  submittedAt: string;
}

export const renderContactAdminNotification = (
  params: ContactNotificationParams
): string => {
  const { name, email, message, submittedAt } = params;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);
  const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #10b981; margin-bottom: 24px;">New Contact Submission</h1>

  <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${safeName}</p>
    <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #14b8a6;">${safeEmail}</a></p>
    <p style="margin: 0;"><strong>Submitted:</strong> ${formattedDate}</p>
  </div>

  <h2 style="color: #374151; font-size: 18px; margin-bottom: 12px;">Message:</h2>
  <p style="white-space: pre-wrap; background-color: #f9fafb; padding: 16px; border-radius: 8px;">${safeMessage}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="font-size: 14px; color: #6b7280; margin: 0;">
    Sent from ProductPix Contact Form
  </p>
</body>
</html>
  `.trim();
};

export const renderContactUserAcknowledgment = (params: {
  name: string;
}): string => {
  const { name } = params;
  const safeName = escapeHtml(name);
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #10b981; margin-bottom: 24px;">Thanks for reaching out!</h1>

  <p>Hi ${safeName},</p>

  <p>We've received your message and will get back to you as soon as possible. Our team typically responds within 24-48 hours during business days.</p>

  <p>In the meantime, feel free to explore <a href="${appUrl}" style="color: #14b8a6; text-decoration: none;">ProductPix</a> and create stunning product images with AI.</p>

  <p style="margin-top: 32px;">
    Best regards,<br>
    <strong>The ProductPix Team</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="font-size: 14px; color: #6b7280; margin: 0;">
    ProductPix - AI Product Photo Generator<br>
    <a href="${appUrl}" style="color: #14b8a6;">${appUrl}</a>
  </p>
</body>
</html>
  `.trim();
};
```

## Acceptance Criteria
- ✓ Functions return valid HTML strings
- ✓ All user input properly escaped (XSS prevention)
- ✓ Brand colors used: Green (#10b981), Teal (#14b8a6)
- ✓ Responsive design (mobile-friendly with inline CSS)
- ✓ Date formatting works correctly
- ✓ App URL pulled from environment variable

## Dependencies
- Task 01: Install dependencies and setup environment variables

## Testing Notes
- Test with malicious input: `<script>alert('XSS')</script>` should be escaped
- Verify HTML renders correctly in major email clients
- Check mobile responsiveness
