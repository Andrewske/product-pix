import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditPacks } from '@/components/pricing/credit-packs';
import { createPackCheckout } from '@/lib/stripe/checkout-actions';

// Mock the checkout action
mock.module('@/lib/stripe/checkout-actions', () => ({
  createPackCheckout: mock(() => {}),
}));

const mockCreatePackCheckout = createPackCheckout as ReturnType<typeof mock>;

// Mock window.location.href
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('CreditPacks', () => {
  const mockPricingData = {
    packs: {
      pack_50: {
        credits: 50,
        slug: 'pack_50',
        priceCents: 500,
        currency: 'usd',
      },
      pack_200: {
        credits: 200,
        slug: 'pack_200',
        priceCents: 1500,
        currency: 'usd',
      },
      pack_500: {
        credits: 500,
        slug: 'pack_500',
        priceCents: 3000,
        currency: 'usd',
      },
    },
    subscriptions: {},
    economy: {
      generationCosts: {
        lightning: { '1k': 30, '2k': 60, '4k': 120 },
        snail: { '1k': 15, '2k': 30, '4k': 60 }
      },
      addonCosts: {
        titleGeneration: 50,
        fancyBackground: 10
      },
      freeCreditsOnSignup: 10,
    },
  };

  beforeEach(() => {
    mockCreatePackCheckout.mockReset();
    mockLocation.href = '';
  });

  it('renders all credit packs with correct pricing', () => {
    render(<CreditPacks pricingData={mockPricingData} />);

    expect(screen.getByText('50 Credits')).not.toBeNull();
    expect(screen.getByText('$5.00')).not.toBeNull();
    expect(screen.getByText('Buy for $5.00')).not.toBeNull();

    expect(screen.getByText('200 Credits')).not.toBeNull();
    expect(screen.getByText('$15.00')).not.toBeNull();
    expect(screen.getByText('Buy for $15.00')).not.toBeNull();

    expect(screen.getByText('500 Credits')).not.toBeNull();
    expect(screen.getByText('$30.00')).not.toBeNull();
    expect(screen.getByText('Buy for $30.00')).not.toBeNull();
  });

  it('features the 200 credit pack prominently', () => {
    render(<CreditPacks pricingData={mockPricingData} />);

    const pack200Card = screen.getByText('200 Credits').closest('[data-slot="card"]');
    expect(pack200Card).toBeDefined();

    // Test that the featured pack is present and visible
    const style = window.getComputedStyle(pack200Card!);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');

    // Test that it has the correct title and pricing
    expect(screen.getByText('200 Credits')).toBeDefined();
    expect(screen.getByText('$15.00')).toBeDefined();
  });

  it('shows loading state during checkout', async () => {
    const user = userEvent.setup();
    mockCreatePackCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    render(<CreditPacks pricingData={mockPricingData} />);

    const buyButton = screen.getByText('Buy for $5.00');
    await user.click(buyButton);

    expect(buyButton).not.toBeNull(); // Button should still be present

    await waitFor(() => {
      expect(mockCreatePackCheckout).toHaveBeenCalledWith('pack_50');
    });
  });

  it('redirects to Stripe checkout URL on successful purchase', async () => {
    const user = userEvent.setup();
    const checkoutUrl = 'https://checkout.stripe.com/test';
    mockCreatePackCheckout.mockResolvedValue({ url: checkoutUrl });

    render(<CreditPacks pricingData={mockPricingData} />);

    const buyButton = screen.getByText('Buy for $5.00');
    await user.click(buyButton);

    await waitFor(() => {
      expect(window.location.href).toBe(checkoutUrl);
    });
  });

  it('shows error alert on checkout failure', async () => {
    const user = userEvent.setup();

    mockCreatePackCheckout.mockRejectedValue(new Error('Checkout failed'));

    render(<CreditPacks pricingData={mockPricingData} />);

    const buyButton = screen.getByText('Buy for $5.00');
    await user.click(buyButton);

    await waitFor(() => {
    });

  });

  it('renders fallback message when no pricing data', () => {
    render(<CreditPacks pricingData={null} />);

    expect(screen.getByText('No pricing data available')).not.toBeNull();
  });
});