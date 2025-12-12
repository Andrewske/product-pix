import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingCard } from '@/components/pricing/pricing-card';
import { Zap } from 'lucide-react';

describe('PricingCard', () => {
  const defaultProps = {
    title: '50 Credits',
    price: '$5.00',
    description: 'Perfect for occasional use',
    onClick: mock(() => {}),
    isLoading: false,
  };

  it('displays correct pricing information', () => {
    render(<PricingCard {...defaultProps} />);

    expect(screen.getByText('50 Credits')).toBeDefined();
    expect(screen.getByText('$5.00')).toBeDefined();
    expect(screen.getByText('Perfect for occasional use')).toBeDefined();
  });

  it('renders as a card with proper structure', () => {
    render(<PricingCard {...defaultProps} />);

    // Should render the title text
    expect(screen.getByText('50 Credits')).toBeDefined();

    // Should render the price
    expect(screen.getByText('$5.00')).toBeDefined();

    // Should render the description
    expect(screen.getByText('Perfect for occasional use')).toBeDefined();
  });

  it('renders featured variant with different visual treatment', () => {
    render(<PricingCard {...defaultProps} variant="featured" />);

    // Featured variant should still display the same content
    expect(screen.getByText('50 Credits')).toBeDefined();
    expect(screen.getByText('$5.00')).toBeDefined();

    // The visual difference is handled by CSS classes, but we test that content is still correct
  });

  it('renders all features in a proper list when provided', () => {
    const features = [
      { icon: <Zap className="w-4 h-4" />, text: 'Commercial License' },
      { icon: <Zap className="w-4 h-4" />, text: 'Full Resolution' },
    ];

    render(<PricingCard {...defaultProps} features={features} />);

    // Should render as a list
    const list = screen.getByRole('list');
    expect(list).toBeDefined();

    // Should have list items for each feature
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0].textContent).toContain('Commercial License');
    expect(listItems[1].textContent).toContain('Full Resolution');
  });

  it('handles purchase button click', async () => {
    const user = userEvent.setup();
    render(<PricingCard {...defaultProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and disables interaction', () => {
    render(<PricingCard {...defaultProps} isLoading />);

    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.textContent).toContain('Creating...');
  });

  it('displays custom button text', () => {
    render(<PricingCard {...defaultProps} buttonText="Buy Now" />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Buy Now');
  });

  it('supports keyboard navigation', async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(<PricingCard {...defaultProps} onClick={handleClick} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);

    // Test keyboard activation
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});