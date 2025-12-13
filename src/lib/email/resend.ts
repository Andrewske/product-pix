import { Resend } from 'resend';
import { env } from '@/lib/env';
import { logger } from '@/lib/logging';

let resend: Resend | null = null;

const getResend = (): Resend => {
  if (!resend && env.RESEND_API_KEY) {
    resend = new Resend(env.RESEND_API_KEY);
  }
  if (!resend) {
    throw new Error('Resend not initialized - missing API key');
  }
  return resend;
};

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

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    logger.error('Email service not configured', {
      location: 'lib/email/resend.ts:sendEmail',
      cause: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL',
    });
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await getResend().emails.send({
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