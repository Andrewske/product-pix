'use server';

import { createClient } from '@/lib/supabase/server';
import type { CreditTransaction } from '@/types/database.helpers';

export interface SubscriptionData {
  status: string;
  tier: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface PurchaseData {
  id: string;
  amount_cents: number;
  credits_granted: number;
  purchase_type: string;
  created_at: string;
}

export async function fetchUserSubscription(): Promise<SubscriptionData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('stripe_subscriptions' as any)
    .select('status, tier, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as unknown as SubscriptionData;
}

export async function fetchUserPurchases(): Promise<PurchaseData[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('stripe_purchases' as any)
    .select('id, amount_cents, credits_granted, purchase_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as PurchaseData[];
}

export async function fetchCreditHistory(): Promise<CreditTransaction[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}
