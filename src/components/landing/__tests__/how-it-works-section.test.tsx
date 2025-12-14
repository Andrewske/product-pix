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

  it('forwards custom className to section element', () => {
    const { container } = render(
      <HowItWorksSection className="custom-class" />
    );

    const section = container.querySelector('section');
    expect(section?.getAttribute('class')).toContain('custom-class');
  });

  it('renders three steps in semantic order', () => {
    render(<HowItWorksSection />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    // Verify steps are in correct order by content
    expect(listItems[0]?.textContent).toContain('Upload');
    expect(listItems[1]?.textContent).toContain('Style');
    expect(listItems[2]?.textContent).toContain('Download');
  });

  it('maintains step order and structure', () => {
    render(<HowItWorksSection />);

    // Verify the ordered list contains exactly 3 items
    const listItems = screen.getAllByRole('listitem');

    // Check that transition delays are applied with 200ms increments
    const style0 = (listItems[0] as HTMLElement).style.transitionDelay;
    const style1 = (listItems[1] as HTMLElement).style.transitionDelay;
    const style2 = (listItems[2] as HTMLElement).style.transitionDelay;

    expect(style0).toBe('0ms');
    expect(style1).toBe('200ms');
    expect(style2).toBe('400ms');
  });
});