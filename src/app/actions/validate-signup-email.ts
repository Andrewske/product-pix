'use server';

import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';

export async function validateSignupEmail(email: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Get client IP for rate limiting
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             headersList.get('x-real-ip') ||
             'unknown';

  // Rate limiting: 10 requests per minute per IP
  const rateLimitResult = await rateLimit(`validate-signup-email:${ip}`);

  if (!rateLimitResult.success) {
    return {
      allowed: false,
      reason: 'Too many validation requests. Please try again later.'
    };
  }

  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: blockedEmail } = await supabase
    .from('users')
    .select('id')
    .eq('original_email', email)
    .gt('deleted_at', thirtyDaysAgo)
    .maybeSingle();

  if (blockedEmail) {
    return {
      allowed: false,
      reason: 'This email is temporarily unavailable. Please contact support if you need assistance.'
    };
  }

  return { allowed: true };
}