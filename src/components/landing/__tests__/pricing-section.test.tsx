import { render, screen } from '@testing-library/react';
import { PricingSection } from '../pricing-section';

const mockPricing = {
  packs: {
    pack_50: {
      slug: 'pack_50',
      priceCents: 500,
      credits: 50
    },
    pack_200: {
      slug: 'pack_200',
      priceCents: 1500,
      credits: 200
    },
    pack_500: {
      slug: 'pack_500',
      priceCents: 3000,
      credits: 500
    }
  }
};

describe('PricingSection', () => {
  it('renders the section title and description', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('Simple, Transparent Pricing')).toBeInTheDocument();
    expect(screen.getByText('Start free. Pay as you go. No subscriptions.')).toBeInTheDocument();
  });

  it('renders all three pricing tiers', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('50 Credits')).toBeInTheDocument();
    expect(screen.getByText('200 Credits')).toBeInTheDocument();
    expect(screen.getByText('500 Credits')).toBeInTheDocument();
  });

  it('displays correct pricing for each tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('$5')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('$30')).toBeInTheDocument();
  });

  it('shows credit amounts for each tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('50 photos')).toBeInTheDocument();
    expect(screen.getByText('200 photos')).toBeInTheDocument();
    expect(screen.getByText('500 photos')).toBeInTheDocument();
  });

  it('highlights Best Value tier with primary styling and badge', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('Best Value')).toBeInTheDocument();
  });

  it('displays feature checkmarks for all tiers', () => {
    render(<PricingSection pricing={mockPricing} />);

    // Check that check icons are present (at least one per tier, so at least 3)
    const checkIcons = document.querySelectorAll('svg');
    expect(checkIcons.length).toBeGreaterThanOrEqual(9); // 3 features × 3 tiers
  });

  it('includes expected features for each tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    // Check that pricing tiers are rendered with proper accessibility
    const grid = screen.getByRole('grid', { name: 'Pricing plans' });
    expect(grid).toBeInTheDocument();

    // Check that grid cells exist
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells.length).toBeGreaterThan(0);

    // Check for basic features that should appear
    expect(screen.getAllByText('Commercial license')).toHaveLength(3);
    expect(screen.getAllByText('Never expires')).toHaveLength(3);
  });

  it('applies responsive grid layout', () => {
    render(<PricingSection pricing={mockPricing} />);

    const gridContainer = screen.getByText('50 Credits').closest('.grid');
    expect(gridContainer).toHaveClass('md:grid-cols-3');
  });

  it('accepts custom className prop', () => {
    render(<PricingSection pricing={mockPricing} className="custom-class" />);

    const section = screen.getByText('Simple, Transparent Pricing').closest('section');
    expect(section).toHaveClass('custom-class');
  });
});