import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingCard } from '@/components/pricing/pricing-card';

describe('PricingCard', () => {
  const defaultProps = {
    title: '50 Credits',
    price: '$5.00',
    description: 'Perfect for occasional use',
    onClick: jest.fn(),
    isLoading: false,
  };

  it('renders default variant with correct styling', () => {
    const { container } = render(<PricingCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('matte-card', 'border');
    expect(card).not.toHaveClass('bg-foreground', 'text-background', 'scale-105', 'shadow-2xl');
  });

  it('renders featured variant with correct styling', () => {
    const { container } = render(<PricingCard {...defaultProps} variant="featured" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-foreground', 'text-background', 'scale-105', 'shadow-2xl');
    expect(card).not.toHaveClass('bg-card', 'border');
  });

  it('displays title with correct typography', () => {
    const { getByText } = render(<PricingCard {...defaultProps} />);
    const title = getByText('50 Credits');
    expect(title).toHaveClass('text-2xl', 'font-bold');
  });

  it('displays price with correct typography', () => {
    const { getByText } = render(<PricingCard {...defaultProps} />);
    const price = getByText('$5.00');
    expect(price).toHaveClass('text-3xl', 'font-bold');
  });

  it('displays description', () => {
    const { getByText } = render(<PricingCard {...defaultProps} />);
    expect(getByText('Perfect for occasional use')).toBeInTheDocument();
  });

  it('renders button with default styling for default variant', () => {
    const { container } = render(<PricingCard {...defaultProps} />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('w-full');
    expect(button).not.toHaveClass('bg-background', 'text-foreground');
  });

  it('renders button with featured styling for featured variant', () => {
    const { container } = render(<PricingCard {...defaultProps} variant="featured" />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('w-full', 'bg-background', 'text-foreground');
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
    expect(button).toHaveTextContent('Creating...');
  });

  it('shows default button text when not loading', () => {
    const { container } = render(<PricingCard {...defaultProps} buttonText="Buy Now" />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveTextContent('Buy Now');
  });
});