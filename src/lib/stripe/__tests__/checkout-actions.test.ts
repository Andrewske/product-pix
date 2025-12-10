import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { User } from '@supabase/supabase-js';

// Create mock functions
const mockRequireAuth = mock(async () => null as User | null);
const mockGetOrCreateStripeCustomer = mock(async (_userId: string, _email: string) => '');
const mockGetPricing = mock(async () => ({
  packs: {},
  subscriptions: {},
  economy: {
    creditsPerResolution: { '1k': 1, '2k': 2, '4k': 4 },
    freeCreditsOnSignup: 10,
  },
}));
const mockStripeSessionsCreate = mock(async () => ({ id: '', url: '' }));

// Mock modules before importing
mock.module('@/lib/auth/server', () => ({
  requireAuth: mockRequireAuth,
}));

mock.module('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockStripeSessionsCreate,
      },
    },
  },
}));

mock.module('@/lib/stripe/customer', () => ({
  getOrCreateStripeCustomer: mockGetOrCreateStripeCustomer,
}));

mock.module('@/lib/stripe/products', () => ({
  CREDIT_PACKS: {
    pack_50: { credits: 50, priceId: 'price_pack_50' },
    pack_200: { credits: 200, priceId: 'price_pack_200' },
    pack_500: { credits: 500, priceId: 'price_pack_500' },
  },
  SUBSCRIPTION_TIERS: {
    pro: { credits: 200, priceId: 'price_pro_monthly' },
    business: { credits: 600, priceId: 'price_business_monthly' },
  },
}));

mock.module('@/lib/pricing/actions', () => ({
  getPricing: mockGetPricing,
}));

// Import after mocking
const { createPackCheckout, createSubscriptionCheckout, getPricingForModal } = await import('../checkout-actions');

describe('Stripe Checkout Actions', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockCustomerId = 'cus_test123';
  const mockSessionUrl = 'https://checkout.stripe.com/test-session';

  beforeEach(() => {
    // Reset all mocks
    mockRequireAuth.mockReset();
    mockGetOrCreateStripeCustomer.mockReset();
    mockGetPricing.mockReset();
    mockStripeSessionsCreate.mockReset();

    // Setup default mocks
    mockRequireAuth.mockResolvedValue(mockUser);
    mockGetOrCreateStripeCustomer.mockResolvedValue(mockCustomerId);
    mockGetPricing.mockResolvedValue({
      packs: {},
      subscriptions: {},
      economy: {
        creditsPerResolution: { '1k': 1, '2k': 2, '4k': 4 },
        freeCreditsOnSignup: 10,
      },
    });

    mockStripeSessionsCreate.mockResolvedValue({
      id: 'cs_test123',
      url: mockSessionUrl,
    });
  });

  describe('getPricingForModal', () => {
    it('should return pricing packs for modal', async () => {
      const mockPricingData = {
        packs: { pack_50: { credits: 50, slug: 'pack-50', priceCents: 500, currency: 'usd' } },
        subscriptions: {},
        economy: {
          creditsPerResolution: { '1k': 1, '2k': 2, '4k': 4 },
          freeCreditsOnSignup: 10,
        },
      };

      mockGetPricing.mockResolvedValue(mockPricingData);

      const result = await getPricingForModal();

      expect(mockGetPricing).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPricingData.packs);
    });

    it('should propagate pricing fetch errors', async () => {
      const error = new Error('Pricing fetch failed');
      mockGetPricing.mockRejectedValue(error);

      await expect(getPricingForModal()).rejects.toThrow('Pricing fetch failed');
    });
  });

  describe('createPackCheckout', () => {
    it('should create checkout session for credit pack', async () => {
      const result = await createPackCheckout('pack_50');

      expect(mockRequireAuth).toHaveBeenCalledTimes(1);
      expect(mockGetOrCreateStripeCustomer).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(mockStripeSessionsCreate).toHaveBeenCalledWith({
        customer: mockCustomerId,
        mode: 'payment',
        line_items: [{ price: 'price_pack_50', quantity: 1 }],
        payment_intent_data: {
          metadata: { userId: mockUser.id, packId: 'pack_50', credits: '50' },
        },
        success_url: 'http://localhost:3000/settings/billing',
        cancel_url: 'http://localhost:3000/pricing',
      });
      expect(result).toEqual({ url: mockSessionUrl });
    });

    it('should throw error when user has no email', async () => {
      mockRequireAuth.mockResolvedValue({ ...mockUser, email: undefined as unknown as string });

      await expect(createPackCheckout('pack_50')).rejects.toThrow(
        'Failed to create credit pack checkout: Email is required to create a checkout session'
      );
    });

    it('should throw error for invalid pack ID', async () => {
      await expect(createPackCheckout('invalid_pack' as 'pack_50')).rejects.toThrow(
        'Failed to create credit pack checkout: Invalid credit pack ID: invalid_pack'
      );
    });

    it('should throw error when Stripe session creation fails', async () => {
      mockStripeSessionsCreate.mockRejectedValue(new Error('Stripe API error'));

      await expect(createPackCheckout('pack_50')).rejects.toThrow(
        'Failed to create credit pack checkout: Stripe API error'
      );
    });

    it('should throw error when session URL is missing', async () => {
      mockStripeSessionsCreate.mockResolvedValue({ id: 'cs_test123', url: null });

      await expect(createPackCheckout('pack_50')).rejects.toThrow(
        'Failed to create credit pack checkout: Failed to create checkout session URL'
      );
    });

    it('should handle authentication errors', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Auth failed'));

      await expect(createPackCheckout('pack_50')).rejects.toThrow(
        'Failed to create credit pack checkout: Auth failed'
      );
    });

    it('should handle customer creation errors', async () => {
      mockGetOrCreateStripeCustomer.mockRejectedValue(new Error('Customer creation failed'));

      await expect(createPackCheckout('pack_50')).rejects.toThrow(
        'Failed to create credit pack checkout: Customer creation failed'
      );
    });
  });

  describe('createSubscriptionCheckout', () => {
    it('should create checkout session for subscription', async () => {
      const result = await createSubscriptionCheckout('pro');

      expect(mockRequireAuth).toHaveBeenCalledTimes(1);
      expect(mockGetOrCreateStripeCustomer).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(mockStripeSessionsCreate).toHaveBeenCalledWith({
        customer: mockCustomerId,
        mode: 'subscription',
        line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
        subscription_data: {
          metadata: { userId: mockUser.id, tier: 'pro', credits: '200' },
        },
        success_url: 'http://localhost:3000/settings/billing',
        cancel_url: 'http://localhost:3000/pricing',
      });
      expect(result).toEqual({ url: mockSessionUrl });
    });

    it('should throw error when user has no email', async () => {
      mockRequireAuth.mockResolvedValue({ ...mockUser, email: undefined as unknown as string });

      await expect(createSubscriptionCheckout('pro')).rejects.toThrow(
        'Failed to create subscription checkout: Email is required to create a checkout session'
      );
    });

    it('should throw error for invalid subscription tier', async () => {
      await expect(createSubscriptionCheckout('invalid_tier' as 'pro')).rejects.toThrow(
        'Failed to create subscription checkout: Invalid subscription tier: invalid_tier'
      );
    });

    it('should throw error when Stripe session creation fails', async () => {
      mockStripeSessionsCreate.mockRejectedValue(new Error('Stripe API error'));

      await expect(createSubscriptionCheckout('pro')).rejects.toThrow(
        'Failed to create subscription checkout: Stripe API error'
      );
    });

    it('should throw error when session URL is missing', async () => {
      mockStripeSessionsCreate.mockResolvedValue({ id: 'cs_test123', url: null });

      await expect(createSubscriptionCheckout('pro')).rejects.toThrow(
        'Failed to create subscription checkout: Failed to create checkout session URL'
      );
    });

    it('should handle authentication errors', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Auth failed'));

      await expect(createSubscriptionCheckout('pro')).rejects.toThrow(
        'Failed to create subscription checkout: Auth failed'
      );
    });

    it('should handle customer creation errors', async () => {
      mockGetOrCreateStripeCustomer.mockRejectedValue(new Error('Customer creation failed'));

      await expect(createSubscriptionCheckout('pro')).rejects.toThrow(
        'Failed to create subscription checkout: Customer creation failed'
      );
    });
  });
});
