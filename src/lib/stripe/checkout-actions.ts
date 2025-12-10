import { getPricing, type PricingPack } from '@/lib/pricing/actions';

/**
 * Server action to get pricing data for the insufficient credits modal
 */
export async function getPricingForModal(): Promise<Record<string, PricingPack>> {
  const pricing = await getPricing();
  return pricing.packs;
}

/**
 * Server action to create a checkout session for a credit pack
 * This calls the existing API route from the server side
 */
export async function createPackCheckout(packId: string): Promise<{ url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'pack', packId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create checkout session: ${error}`);
  }

  const { url } = await response.json();
  return { url };
}