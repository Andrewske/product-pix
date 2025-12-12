import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { ExamplesSection } from '../examples-section';

const mockExamples = [
  {
    beforeImage: '/example1-before.webp',
    afterImage: '/example1-after.webp',
    product: 'Wireless Headphones',
    category: 'Electronics',
  },
  {
    beforeImage: '/example2-before.webp',
    afterImage: '/example2-after.webp',
    product: 'Coffee Mug',
    category: 'Kitchenware',
  },
  {
    beforeImage: '/example3-before.webp',
    afterImage: '/example3-after.webp',
    product: 'Leather Wallet',
    category: 'Accessories',
  },
];

describe('ExamplesSection', () => {
  it('renders the section title and description', () => {
    render(<ExamplesSection examples={mockExamples} />);

    expect(screen.getByText('See the Transformation')).not.toBeNull();
    expect(screen.getByText('From phone photos to professional product shots in seconds')).not.toBeNull();
  });

  it('renders all example items', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Check that all product names are rendered
    expect(screen.getByText('Wireless Headphones')).not.toBeNull();
    expect(screen.getByText('Coffee Mug')).not.toBeNull();
    expect(screen.getByText('Leather Wallet')).not.toBeNull();

    // Check that all categories are rendered
    expect(screen.getByText('Electronics')).not.toBeNull();
    expect(screen.getByText('Kitchenware')).not.toBeNull();
    expect(screen.getByText('Accessories')).not.toBeNull();
  });

  it('renders BeforeAfterSlider components for each example', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Check that BeforeAfterSlider components are rendered (they contain the images)
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(6); // 3 examples × 2 images each (before + after)
  });

  it('has proper accessibility attributes', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Check section has proper ARIA labels
    expect(screen.getByRole('grid')?.getAttribute('aria-label')).toBe('Product transformation examples');

    // Check grid cells have proper labels
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(3);
    expect(gridCells[0]?.getAttribute('aria-label')).toBe('Example 1: Wireless Headphones transformation');
  });

  it('renders section with proper heading structure', () => {
    render(<ExamplesSection examples={mockExamples} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading?.getAttribute('id')).toBe('examples-heading');
    expect(heading?.textContent).toContain('See the Transformation');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ExamplesSection examples={mockExamples} className="custom-class" />
    );

    const section = container.querySelector('section');
    expect(section?.classList.contains('custom-class')).toBe(true);
  });

  it('has responsive grid layout', () => {
    const { container } = render(<ExamplesSection examples={mockExamples} />);

    const grid = container.querySelector('[class*="grid"]');
    expect(grid?.classList.contains('grid-cols-1')).toBe(true);
    expect(grid?.classList.contains('md:grid-cols-2')).toBe(true);
    expect(grid?.classList.contains('lg:grid-cols-3')).toBe(true);
  });

  it('applies staggered animation delays', () => {
    const { container } = render(<ExamplesSection examples={mockExamples} />);

    const items = container.querySelectorAll('[style*="transition-delay"]');
    expect(items).toHaveLength(3);

    // Check that transition delays are applied with 200ms increments
    expect(window.getComputedStyle(items[0]).transitionDelay).toBe('0ms');
    expect(window.getComputedStyle(items[1]).transitionDelay).toBe('200ms');
    expect(window.getComputedStyle(items[2]).transitionDelay).toBe('400ms');
  });

  it('has offset positioning structure', () => {
    const { container } = render(<ExamplesSection examples={mockExamples} />);

    // Find the divs that contain the offset positioning classes
    const offsetDivs = container.querySelectorAll('[class*="translate-y"]');

    // Check that offset positioning divs exist
    expect(offsetDivs.length).toBeGreaterThan(0);
    // Note: Offset classes are applied when items become visible via IntersectionObserver
    // In tests, items remain invisible, so we just check the structure exists
  });
});