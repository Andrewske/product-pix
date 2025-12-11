import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditPacks } from '@/components/pricing/credit-packs';
import { createPackCheckout } from '@/lib/stripe/checkout-actions';

// Mock the checkout action
jest.mock('@/lib/stripe/checkout-actions', () => ({
  createPackCheckout: jest.fn(),
}));

const mockCreatePackCheckout = createPackCheckout as jest.MockedFunction<typeof createPackCheckout>;

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
      creditsPerResolution: { '1k': 1, '2k': 2, '4k': 4 },
      freeCreditsOnSignup: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders all credit packs with correct pricing', () => {
    render(<CreditPacks pricingData={mockPricingData} />);

    expect(screen.getByText('50 Credits')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('Buy for $5.00')).toBeInTheDocument();

    expect(screen.getByText('200 Credits')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('Buy for $15.00')).toBeInTheDocument();

    expect(screen.getByText('500 Credits')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('Buy for $30.00')).toBeInTheDocument();
  });

  it('applies featured styling to pack_200', () => {
    render(<CreditPacks pricingData={mockPricingData} />);

    const pack200Card = screen.getByText('200 Credits').closest('.matte-card');
    expect(pack200Card).toHaveClass('bg-foreground', 'text-background', 'scale-105');
  });

  it('shows loading state during checkout', async () => {
    const user = userEvent.setup();
    mockCreatePackCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    render(<CreditPacks pricingData={mockPricingData} />);

    const buyButton = screen.getByText('Buy for $5.00');
    await user.click(buyButton);

    expect(buyButton).toHaveTextContent('Creating...');
    expect(buyButton).toBeDisabled();

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
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    mockCreatePackCheckout.mockRejectedValue(new Error('Checkout failed'));

    render(<CreditPacks pricingData={mockPricingData} />);

    const buyButton = screen.getByText('Buy for $5.00');
    await user.click(buyButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Checkout error:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Failed to start checkout. Please try again.');
    });

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('renders fallback message when no pricing data', () => {
    render(<CreditPacks pricingData={null} />);

    expect(screen.getByText('No pricing data available')).toBeInTheDocument();
  });
});