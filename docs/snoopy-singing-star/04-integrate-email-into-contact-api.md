# Integrate Email Into Contact API Route

## Overview
Add email sending to the contact form API - send admin notification and user acknowledgment after successful DB insert.

## Files to Modify/Create
- `src/app/api/contact/route.ts` (modify)

## Implementation Details

### Add Imports (at top of file)

```typescript
import {
  sendEmail,
  renderContactAdminNotification,
  renderContactUserAcknowledgment,
} from '@/lib/email';
import { env } from '@/lib/env';
```

### Replace Lines 71-80 (success response section)

**Current code:**
```typescript
    // 6. Success response
    logger.info('Contact message submitted successfully', {
      messageId: result.messageId,
      email: parsed.data.email,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
```

**New code:**
```typescript
    // 6. Send emails (non-blocking)
    const adminEmailResult = await sendEmail({
      to: env.ADMIN_EMAIL,
      subject: `New Contact: ${parsed.data.name}`,
      html: renderContactAdminNotification({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        submittedAt: new Date().toISOString(),
      }),
      replyTo: parsed.data.email,
    });

    if (!adminEmailResult.success) {
      logger.warn('Admin notification email failed (submission still succeeded)', {
        messageId: result.messageId,
        error: adminEmailResult.error,
      });
    }

    const userEmailResult = await sendEmail({
      to: parsed.data.email,
      subject: 'Thanks for contacting ProductPix',
      html: renderContactUserAcknowledgment({
        name: parsed.data.name,
      }),
    });

    if (!userEmailResult.success) {
      logger.warn('User acknowledgment email failed (submission still succeeded)', {
        messageId: result.messageId,
        error: userEmailResult.error,
      });
    }

    // 7. Success response
    logger.info('Contact message submitted successfully', {
      messageId: result.messageId,
      email: parsed.data.email,
      adminEmailSent: adminEmailResult.success,
      userEmailSent: userEmailResult.success,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
```

## Acceptance Criteria
- ✓ Contact form still works if Resend is down
- ✓ Both emails sent when `EMAIL_ENABLED=true`
- ✓ No emails sent (but logged) when `EMAIL_ENABLED=false`
- ✓ Email failures logged as `warn` not `error`
- ✓ Return success to user even if emails fail (DB record exists)
- ✓ Reply-To on admin email enables one-click response
- ✓ Success log includes email send status

## Dependencies
- Task 01: Install dependencies and setup environment variables
- Task 02: Create email service module
- Task 03: Create email templates

## Key Design Decisions
- Email failures are **non-blocking** - user always sees success if DB insert succeeds
- Admin email includes `replyTo` field pointing to user's email
- Both email results logged for debugging
- Failures logged as `warn` level (not `error`) because submission succeeded
