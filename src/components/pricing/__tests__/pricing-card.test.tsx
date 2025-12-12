import { describe, it, expect, mock } from 'bun:test';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingCard } from '@/components/pricing/pricing-card';

describe('PricingCard', () => {
  const defaultProps = {
    title: '50 Credits',
    price: '$5.00',
    description: 'Perfect for occasional use',
    onClick: mock(() => {}),
    isLoading: false,
  };

  it('renders default variant with correct styling', () => {
    const { container } = render(<PricingCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card?.classList.contains('matte-card')).toBe(true);
    expect(card?.classList.contains('border')).toBe(true);
    expect(card?.classList.contains('bg-foreground', 'text-background', 'scale-105', 'shadow-2xl')).toBe(false);
  });

  it('renders featured variant with correct styling', () => {
    const { container } = render(<PricingCard {...defaultProps} variant="featured" />);
    const card = container.firstChild as HTMLElement;
    expect(card?.classList.contains('bg-foreground', 'text-background', 'scale-105', 'shadow-2xl')).toBe(true);
    expect(card?.classList.contains('bg-card', 'border')).toBe(false);
  });

  it('displays title with correct typography', () => {
    const { getByText } = render(<PricingCard {...defaultProps} />);
    const title = getByText('50 Credits');
    expect(title?.classList.contains('text-2xl', 'font-bold')).toBe(true);
  });

  it('displays price with correct typography', () => {
    const { getByText } = render(<PricingCard {...defaultProps} />);
    const price = getByText('$5.00');
    expect(price?.classList.contains('text-3xl', 'font-bold')).toBe(true);
  });

  it('displays description', () => {
    const { getByText } = render(<PricingCard {...defaultProps} />);
    expect(getByText('Perfect for occasional use')).not.toBeNull();
  });

  it('renders button with default styling for default variant', () => {
    const { container } = render(<PricingCard {...defaultProps} />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.classList.contains('w-full')).toBe(true);
    expect(button?.classList.contains('bg-background', 'text-foreground')).toBe(false);
  });

  it('renders button with featured styling for featured variant', () => {
    const { container } = render(<PricingCard {...defaultProps} variant="featured" />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.classList.contains('w-full', 'bg-background', 'text-foreground')).toBe(true);
  });

  it('calls onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingCard {...defaultProps} />);
    const button = container.querySelector('button') as HTMLElement;
    await user.click(button);
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and disables button', () => {
    const { container } = render(<PricingCard {...defaultProps} isLoading />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toBeDisabled();
    expect(button?.textContent).toContain('Creating...');
  });

  it('shows default button text when not loading', () => {
    const { container } = render(<PricingCard {...defaultProps} buttonText="Buy Now" />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.textContent).toContain('Buy Now');
  });
});