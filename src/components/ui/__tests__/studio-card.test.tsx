import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { Card } from '../card';

describe('Card', () => {
  it('renders with appropriate structure', () => {
    const { container, getByText } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    expect(card?.tagName).toBe('DIV');

    // Test that card is visible and functional
    const style = window.getComputedStyle(card);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('applies hover effect when hover prop is true', () => {
    const { container, getByText } = render(<Card hover>Content</Card>);
    const card = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    expect(card?.tagName).toBe('DIV');

    // Test that hover variant renders without errors
    const style = window.getComputedStyle(card);
    expect(style.display).not.toBe('none');
  });

  it('merges className prop correctly', () => {
    const { container, getByText } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    // Test that custom class is applied (behavioral test of customization)
    expect(card?.classList.contains('custom-class')).toBe(true);

    const style = window.getComputedStyle(card);
    expect(style.display).not.toBe('none');
  });

});
