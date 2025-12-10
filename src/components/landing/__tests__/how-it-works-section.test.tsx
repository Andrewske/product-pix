import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from '../how-it-works-section';

describe('HowItWorksSection', () => {
  it('renders the section title and description', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Three simple steps to professional results')).toBeInTheDocument();
  });

  it('renders all three steps with correct titles', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('renders all step descriptions', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('Drop your raw product photo directly from your phone.')).toBeInTheDocument();
    expect(screen.getByText('Choose from our curated templates or describe your own scene.')).toBeInTheDocument();
    expect(screen.getByText('Get high-resolution, marketplace-ready images instantly.')).toBeInTheDocument();
  });

  it('renders step numbers 1, 2, and 3', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders step numbers 1, 2, and 3', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders as an ordered list with proper accessibility', () => {
    render(<HowItWorksSection />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    // Check that each list item has proper ARIA attributes
    listItems.forEach((item, index) => {
      expect(item).toHaveAttribute('aria-labelledby', `step-${index + 1}-title`);
      expect(item).toHaveAttribute('aria-describedby', `step-${index + 1}-description`);
    });
  });

  it('renders icons with proper accessibility attributes', () => {
    render(<HowItWorksSection />);

    const icons = screen.getAllByRole('img');
    expect(icons).toHaveLength(3);

    expect(icons[0]).toHaveAttribute('aria-label', 'Upload icon');
    expect(icons[1]).toHaveAttribute('aria-label', 'Style customization icon');
    expect(icons[2]).toHaveAttribute('aria-label', 'Download icon');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <HowItWorksSection className="custom-class" />
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('has responsive grid layout', () => {
    const { container } = render(<HowItWorksSection />);

    const grid = container.querySelector('ol');
    expect(grid).toHaveClass('grid', 'md:grid-cols-3');
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