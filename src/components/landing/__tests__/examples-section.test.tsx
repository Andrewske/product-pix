import { describe, it, expect, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('displays all example data correctly', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Verify all product names are displayed
    expect(screen.getByText('Wireless Headphones')).toBeDefined();
    expect(screen.getByText('Coffee Mug')).toBeDefined();
    expect(screen.getByText('Leather Wallet')).toBeDefined();

    // Verify all categories are displayed
    expect(screen.getByText('Electronics')).toBeDefined();
    expect(screen.getByText('Kitchenware')).toBeDefined();
    expect(screen.getByText('Accessories')).toBeDefined();
  });

  it('loads all example images correctly', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Verify all before and after images are present
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(6); // 3 examples × 2 images each

    // Verify correct image alt texts
    const beforeImages = images.filter(img => img.getAttribute('alt')?.includes('Original'));
    const afterImages = images.filter(img => img.getAttribute('alt')?.includes('Enhanced'));

    expect(beforeImages).toHaveLength(3);
    expect(afterImages).toHaveLength(3);

    // Verify images have proper alt attributes for each product
    expect(beforeImages[0]?.getAttribute('alt')).toBe('Wireless Headphones - Original');
    expect(afterImages[0]?.getAttribute('alt')).toBe('Wireless Headphones - Enhanced');
    expect(beforeImages[1]?.getAttribute('alt')).toBe('Coffee Mug - Original');
    expect(afterImages[1]?.getAttribute('alt')).toBe('Coffee Mug - Enhanced');
  });

  it('renders interactive before/after sliders for each example', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Verify sliders are present and interactive
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(3);

    // Verify each slider has proper accessibility attributes
    sliders.forEach((slider, index) => {
      expect(slider.getAttribute('aria-label')).toContain(mockExamples[index].product);
      expect(slider.getAttribute('aria-valuemin')).toBe('0');
      expect(slider.getAttribute('aria-valuemax')).toBe('100');
      expect(slider.getAttribute('aria-valuenow')).toBeDefined();
    });
  });

  it('supports keyboard navigation on sliders', async () => {
    const user = userEvent.setup();
    render(<ExamplesSection examples={mockExamples} />);

    const firstSlider = screen.getAllByRole('slider')[0];

    // Focus the slider
    firstSlider.focus();
    expect(document.activeElement).toBe(firstSlider);

    // Test arrow key navigation
    await user.keyboard('{ArrowRight}');
    expect(firstSlider.getAttribute('aria-valuenow')).not.toBe('50'); // Default is 50

    await user.keyboard('{ArrowLeft}');
    // Value should change back
  });

  it('provides staggered animation timing for visual appeal', () => {
    render(<ExamplesSection examples={mockExamples} />);

    const items = screen.getAllByRole('gridcell');
    expect(items).toHaveLength(3);

    // Verify staggered delays are applied for smooth sequential animations
    items.forEach((item, index) => {
      const expectedDelay = `${index * 200}ms`;
      const style = window.getComputedStyle(item);
      expect(style.transitionDelay).toBe(expectedDelay);
    });
  });

  it('applies staggered animation timing to items', () => {
    render(<ExamplesSection examples={mockExamples} />);

    const items = screen.getAllByRole('gridcell');

    // Verify transition delays are applied with 200ms increments
    items.forEach((item, index) => {
      const expectedDelay = `${index * 200}ms`;
      const style = window.getComputedStyle(item);
      expect(style.transitionDelay).toBe(expectedDelay);
    });
  });

  it('maintains proper grid structure for examples', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Verify semantic grid structure
    const grid = screen.getByRole('grid');
    expect(grid.getAttribute('aria-label')).toBe('Product transformation examples');

    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(3);

    // Verify each cell has proper labeling
    gridCells.forEach((cell, index) => {
      const expectedLabel = `Example ${index + 1}: ${mockExamples[index].product} transformation`;
      expect(cell.getAttribute('aria-label')).toBe(expectedLabel);
    });
  });

  it('renders section with proper semantic structure', () => {
    render(<ExamplesSection examples={mockExamples} />);

    // Verify heading hierarchy
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.getAttribute('id')).toBe('examples-heading');
    expect(heading.textContent).toContain('See the Transformation');

    // Verify section has proper ARIA relationships
    const section = document.querySelector('section[aria-labelledby="examples-heading"]');
    expect(section).toBeDefined();
    expect(section?.getAttribute('aria-labelledby')).toBe('examples-heading');
    expect(section?.getAttribute('aria-describedby')).toBe('examples-description');
  });

  it('supports custom styling through className prop', () => {
    const { container } = render(
      <ExamplesSection examples={mockExamples} className="custom-section-class" />
    );

    const section = container.querySelector('section');
    expect(section?.classList.contains('custom-section-class')).toBe(true);
  });

  it('handles empty examples array gracefully', () => {
    render(<ExamplesSection examples={[]} />);

    // Section should still render with title and description
    expect(screen.getByText('See the Transformation')).toBeDefined();
    expect(screen.getByText('From phone photos to professional product shots in seconds')).toBeDefined();

    // No examples should be rendered
    const gridCells = screen.queryAllByRole('gridcell');
    expect(gridCells).toHaveLength(0);
  });
});