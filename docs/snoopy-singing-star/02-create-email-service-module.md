# Create Email Service Module

## Overview
Implement the core email sending service using Resend SDK with proper error handling, logging, and dev mode support.

## Files to Modify/Create
- `src/lib/email/resend.ts` (create new)
- `src/lib/email/index.ts` (create new - barrel export)

## Implementation Details

### File: `src/lib/email/resend.ts`

```typescript
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { logger } from '@/lib/logging';

const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
  emailId?: string;
}

export const sendEmail = async (
  params: SendEmailParams
): Promise<SendEmailResult> => {
  const { to, subject, html, replyTo } = params;

  if (env.EMAIL_ENABLED !== 'true') {
    logger.info('Email sending disabled (dev mode)', { to, subject });
    return { success: true, emailId: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo && { replyTo }),
    });

    if (error) {
      logger.error('Failed to send email via Resend', {
        location: 'lib/email/resend.ts:sendEmail',
        cause: error.message,
        state: { to, subject },
      });
      return { success: false, error: error.message };
    }

    logger.info('Email sent successfully', {
      emailId: data.id,
      to,
      subject,
    });

    return { success: true, emailId: data.id };
  } catch (error) {
    logger.error('Unexpected error sending email', {
      location: 'lib/email/resend.ts:sendEmail',
      cause: error instanceof Error ? error.message : 'Unknown error',
      state: { to, subject },
    });
    return { success: false, error: 'Internal email service error' };
  }
};
```

### File: `src/lib/email/index.ts`

```typescript
export * from './resend';
export * from './templates';
```

## Acceptance Criteria
- ✓ TypeScript compiles without errors
- ✓ Never throws exceptions (always returns result object)
- ✓ Logs all email attempts (success and failure)
- ✓ Returns structured result object with `success`, `error`, `emailId`
- ✓ Handles dev mode (`EMAIL_ENABLED !== 'true'`) correctly
- ✓ Handles both single recipient (string) and multiple (array)
- ✓ Includes optional `replyTo` field

## Dependencies
- Task 01: Install dependencies and setup environment variables

## Security Notes
- Never throws exceptions to prevent exposing internal errors
- Logs detailed context for debugging without exposing to users
- Validates environment before attempting to send
