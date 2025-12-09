import { stripe } from './client';
import { redis } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Get or create a Stripe customer for a user
 * Follows the pattern from notes-on-stripe.md: always create customer BEFORE checkout
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // 1. Check Redis cache first (long TTL - customer ID rarely changes)
  const cached = await redis?.get(`stripe:user:${userId}`);
  if (cached) return cached as string;

  // 2. Check database
  const { data: user } = await createAdminClient()
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if ((user as any)?.stripe_customer_id) {
    await redis?.set(`stripe:user:${userId}`, (user as any).stripe_customer_id, { ex: 86400 }); // 24h
    return (user as any).stripe_customer_id;
  }

  // 3. Create new customer with userId in metadata (CRITICAL for reverse lookup)
  const customer = await stripe.customers.create({
    email,
    metadata: { userId }, // DO NOT FORGET THIS
  });

  // 4. Store in DB and cache
  await createAdminClient()
    .from('users')
    .update({ stripe_customer_id: customer.id } as any)
    .eq('id', userId);

  await redis?.set(`stripe:user:${userId}`, customer.id, { ex: 86400 });

  return customer.id;
}

/**
 * Get user ID by Stripe customer ID (fallback lookup)
 */
export async function getUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  return data?.id || null;
}

/**
 * Get Stripe customer ID for a user
 */
export async function getUserStripeCustomerId(userId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  return (data as any)?.stripe_customer_id || null;
}
