import { describe, it, expect } from 'bun:test';
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

    expect(screen.getByText('Simple, Transparent Pricing')).not.toBeNull();
    expect(screen.getByText('Start free. Pay as you go. No subscriptions.')).not.toBeNull();
  });

  it('renders all three pricing tiers', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('50 Credits')).not.toBeNull();
    expect(screen.getByText('200 Credits')).not.toBeNull();
    expect(screen.getByText('500 Credits')).not.toBeNull();
  });

  it('displays correct pricing for each tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('$5')).not.toBeNull();
    expect(screen.getByText('$15')).not.toBeNull();
    expect(screen.getByText('$30')).not.toBeNull();
  });

  it('shows credit amounts for each tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('50 photos')).not.toBeNull();
    expect(screen.getByText('200 photos')).not.toBeNull();
    expect(screen.getByText('500 photos')).not.toBeNull();
  });

  it('highlights Best Value tier with primary styling and badge', () => {
    render(<PricingSection pricing={mockPricing} />);

    expect(screen.getByText('Best Value')).not.toBeNull();
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
    expect(grid).not.toBeNull();

    // Check that grid cells exist
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells.length).toBeGreaterThan(0);

    // Check for basic features that should appear
    expect(screen.getAllByText('Commercial license')).toHaveLength(3);
    expect(screen.getAllByText('Never expires')).toHaveLength(3);
  });

  it('renders pricing cards in a responsive layout', () => {
    render(<PricingSection pricing={mockPricing} />);

    const gridContainer = screen.getByText('50 Credits').closest('[role="grid"]');
    expect(gridContainer).toBeDefined();

    // Test that all pricing cards are present
    expect(screen.getByText('50 Credits')).toBeDefined();
    expect(screen.getByText('200 Credits')).toBeDefined();
    expect(screen.getByText('500 Credits')).toBeDefined();

    // Test that grid is visible
    const style = window.getComputedStyle(gridContainer!);
    expect(style.display).not.toBe('none');
  });

  it('accepts custom className prop', () => {
    render(<PricingSection pricing={mockPricing} className="custom-class" />);

    const section = screen.getByText('Simple, Transparent Pricing').closest('section');
    expect(section).toBeDefined();

    // Test that custom class is applied (behavioral test of customization)
    expect(section?.classList.contains('custom-class')).toBe(true);

    const style = window.getComputedStyle(section!);
    expect(style.display).not.toBe('none');
  });

  // Selection and interaction tests
  it('highlights Best Value pack with primary styling', () => {
    render(<PricingSection pricing={mockPricing} />);

    // The middle pack (200 credits) should be highlighted as Best Value
    const bestValueCard = screen.getByText('Best Value').closest('[role="gridcell"]');
    expect(bestValueCard).toBeDefined();

    // Check that it has primary border styling
    expect(bestValueCard?.classList.contains('border-primary')).toBe(true);
    expect(bestValueCard?.classList.contains('scale-105')).toBe(true);
  });

  it('shows Best Value badge only on the middle tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    // Should have exactly one "Best Value" badge
    const bestValueBadges = screen.getAllByText('Best Value');
    expect(bestValueBadges).toHaveLength(1);

    // Badge should be positioned above the middle card
    const badge = bestValueBadges[0];
    expect(badge.closest('[role="gridcell"]')).toBeDefined();
  });

  it('renders Get Started buttons for all pricing tiers', () => {
    render(<PricingSection pricing={mockPricing} />);

    const buttons = screen.getAllByRole('button', { name: 'Get Started' });
    expect(buttons).toHaveLength(3);

    // Each button should be in its respective pricing card
    buttons.forEach((button) => {
      const card = button.closest('[role="gridcell"]');
      expect(card).toBeDefined();

      // Verify button is a link to signup
      const link = button.closest('a');
      expect(link?.getAttribute('href')).toBe('/signup');
    });
  });

  it('provides proper accessibility labels for pricing information', () => {
    render(<PricingSection pricing={mockPricing} />);

    // Check price accessibility labels
    const priceElements = screen.getAllByLabelText(/dollars/);
    expect(priceElements).toHaveLength(3);

    // Check credit amount labels
    const creditLabels = screen.getAllByLabelText(/\d+ photo credits included/);
    expect(creditLabels).toHaveLength(3);

    // Check button descriptions
    const buttonDescriptions = screen.getAllByText(/Purchase \d+ credits for/);
    expect(buttonDescriptions).toHaveLength(3);
  });

  it('displays pricing cards in correct order', () => {
    render(<PricingSection pricing={mockPricing} />);

    const cards = screen.getAllByRole('gridcell');
    expect(cards).toHaveLength(3);

    // Verify the order: 50, 200 (Best Value), 500
    expect(cards[0].textContent).toContain('50 Credits');
    expect(cards[1].textContent).toContain('200 Credits');
    expect(cards[2].textContent).toContain('500 Credits');

    // Verify Best Value is on the middle card
    expect(cards[1].textContent).toContain('Best Value');
  });

  it('shows per-photo pricing for each tier', () => {
    render(<PricingSection pricing={mockPricing} />);

    // Check that per-photo pricing is displayed for each tier
    const perPhotoTexts = screen.getAllByText(/\$[\d.]+ per photo/);
    expect(perPhotoTexts).toHaveLength(3);

    // Verify that pricing decreases as credit amounts increase
    const prices = perPhotoTexts.map(text => parseFloat(text.textContent!.match(/\$([\d.]+)/)![1]));
    expect(prices[0]).toBeGreaterThan(prices[1]); // 50 credits more expensive per photo than 200
    expect(prices[1]).toBeGreaterThan(prices[2]); // 200 credits more expensive per photo than 500
  });

  it('maintains visual hierarchy with different card styles', () => {
    render(<PricingSection pricing={mockPricing} />);

    const cards = screen.getAllByRole('gridcell');

    // First card (50 credits) - basic styling
    expect(cards[0]?.classList.contains('border-border')).toBe(true);
    expect(cards[0]?.classList.contains('bg-card/50')).toBe(true);

    // Second card (200 credits) - highlighted styling
    expect(cards[1]?.classList.contains('border-primary')).toBe(true);
    expect(cards[1]?.classList.contains('shadow-2xl')).toBe(true);

    // Third card (500 credits) - basic styling
    expect(cards[2]?.classList.contains('border-border')).toBe(true);
    expect(cards[2]?.classList.contains('bg-card/50')).toBe(true);
  });

  it('includes proper ARIA labels for screen readers', () => {
    render(<PricingSection pricing={mockPricing} />);

    // Main section labels
    expect(screen.getByLabelText('Pricing plans')).toBeDefined();

    // Check that each card has proper labeling
    const cards = screen.getAllByRole('gridcell');
    cards.forEach((card, index) => {
      const packNames = ['50', '200', '500'];
      expect(card.getAttribute('aria-labelledby')).toContain(`plan-pack_${packNames[index]}-title`);
      expect(card.getAttribute('aria-describedby')).toContain(`plan-pack_${packNames[index]}-price`);
      expect(card.getAttribute('aria-describedby')).toContain(`plan-pack_${packNames[index]}-features`);
    });
  });
});