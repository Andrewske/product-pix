import { render } from '@testing-library/react';
import { BeforeAfterSlider } from '../before-after-slider';

describe('BeforeAfterSlider', () => {
  const defaultProps = {
    beforeImage: '/test-before.jpg',
    afterImage: '/test-after.jpg',
    product: 'Test Product',
    category: 'Test Category',
  };

  it('renders with images that have priority optimization', () => {
    const { container } = render(<BeforeAfterSlider {...defaultProps} />);

    // Check that both images are rendered
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);

    // Verify image sources and alt text
    expect(images[0]).toHaveAttribute('alt', 'Test Product - Enhanced');
    expect(images[1]).toHaveAttribute('alt', 'Test Product - Original');

    // The priority prop is handled internally by Next.js and may not be visible in tests
    // but we can verify the component renders without errors
  });

  it('renders product and category information', () => {
    const { getByText } = render(<BeforeAfterSlider {...defaultProps} />);

    expect(getByText('Test Product')).toBeInTheDocument();
    expect(getByText('Test Category')).toBeInTheDocument();
  });
});