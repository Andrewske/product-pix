// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation/contact';
import { createContactMessage } from '@/lib/db/contacts';
import { rateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logging';
import {
  sendEmail,
  renderContactAdminNotification,
  renderContactUserAcknowledgment,
} from '@/lib/email';
import { env } from '@/lib/env';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extract client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ??
                     request.headers.get('x-real-ip') ??
                     request.headers.get('x-forwarded') ??
                     'unknown';

    // 2. Rate limit: 60 requests per minute per IP
    const rateLimit = await rateLimiters.api(clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: 60
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.issues
        },
        { status: 400 }
      );
    }

    // 4. Extract user agent for spam detection
    const userAgent = request.headers.get('user-agent') ?? undefined;

    // 5. Create contact message
    const result = await createContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      userAgent,
      ipAddress: clientIp !== 'unknown' ? clientIp : undefined,
    });

    if (!result.success) {
      logger.error('Failed to create contact message', {
        error: result.error,
        email: parsed.data.email,
      });

      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Send emails (non-blocking)
    let adminEmailResult: { success: boolean; error?: string; emailId?: string } = { success: true };

    if (env.ADMIN_EMAIL) {
      const adminEmailHtml = await renderContactAdminNotification({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        submittedAt: new Date().toISOString(),
      });

      adminEmailResult = await sendEmail({
        to: env.ADMIN_EMAIL,
        subject: `New Contact: ${parsed.data.name}`,
        html: adminEmailHtml,
        replyTo: parsed.data.email,
      });

      if (!adminEmailResult.success) {
        logger.warn('Admin notification email failed (submission still succeeded)', {
          messageId: result.messageId,
          error: adminEmailResult.error,
        });
      }
    }

    const userEmailHtml = await renderContactUserAcknowledgment({
      name: parsed.data.name,
    });

    const userEmailResult = await sendEmail({
      to: parsed.data.email,
      subject: 'Thanks for contacting ProductPix',
      html: userEmailHtml,
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
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Unexpected error in contact API', { error });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}