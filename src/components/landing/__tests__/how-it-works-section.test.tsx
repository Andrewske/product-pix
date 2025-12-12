import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from '../how-it-works-section';

describe('HowItWorksSection', () => {
  it('renders the section title and description', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('How It Works')).not.toBeNull();
    expect(screen.getByText('Three simple steps to professional results')).not.toBeNull();
  });

  it('renders all three steps with correct titles', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('Upload')).not.toBeNull();
    expect(screen.getByText('Style')).not.toBeNull();
    expect(screen.getByText('Download')).not.toBeNull();
  });

  it('renders all step descriptions', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('Drop your raw product photo directly from your phone.')).not.toBeNull();
    expect(screen.getByText('Choose from our curated templates or describe your own scene.')).not.toBeNull();
    expect(screen.getByText('Get high-resolution, marketplace-ready images instantly.')).not.toBeNull();
  });

  it('renders step numbers 1, 2, and 3', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('1')).not.toBeNull();
    expect(screen.getByText('2')).not.toBeNull();
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('renders step numbers 1, 2, and 3', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('1')).not.toBeNull();
    expect(screen.getByText('2')).not.toBeNull();
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('renders as an ordered list with proper accessibility', () => {
    render(<HowItWorksSection />);

    const list = screen.getByRole('list');
    expect(list).not.toBeNull();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    // Check that each list item has proper ARIA attributes
    listItems.forEach((item, index) => {
      expect(item?.getAttribute('aria-labelledby')).toBe(`step-${index + 1}-title`);
      expect(item?.getAttribute('aria-describedby')).toBe(`step-${index + 1}-description`);
    });
  });

  it('renders icons with proper accessibility attributes', () => {
    render(<HowItWorksSection />);

    const icons = screen.getAllByRole('img');
    expect(icons).toHaveLength(3);

    expect(icons[0]?.getAttribute('aria-label')).toBe('Upload icon');
    expect(icons[1]?.getAttribute('aria-label')).toBe('Style customization icon');
    expect(icons[2]?.getAttribute('aria-label')).toBe('Download icon');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <HowItWorksSection className="custom-class" />
    );

    const section = container.querySelector('section');
    expect(section?.classList.contains('custom-class')).toBe(true);
  });

  it('has responsive grid layout', () => {
    const { container } = render(<HowItWorksSection />);

    const grid = container.querySelector('ol');
    expect(grid?.classList.contains('grid')).toBe(true);
    expect(grid?.classList.contains('md:grid-cols-3')).toBe(true);
  });

  it('applies staggered animation delays', () => {
    const { container } = render(<HowItWorksSection />);

    const items = container.querySelectorAll('[style*="transition-delay"]');
    expect(items).toHaveLength(3);

    // Check that transition delays are applied with 200ms increments
    expect(items[0]).toHaveStyle({ 'transition-delay': '0ms' });
    expect(items[1]).toHaveStyle({ 'transition-delay': '200ms' });
    expect(items[2]).toHaveStyle({ 'transition-delay': '400ms' });
  });
});