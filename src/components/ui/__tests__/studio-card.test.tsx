import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { Card } from '../card';

describe('Card studio variant', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<Card variant="studio">Test Content</Card>);
    expect(getByText('Test Content')).not.toBeNull();
  });

  it('applies studio variant classes', () => {
    const { container } = render(<Card variant="studio">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card?.classList.contains('matte-card')).toBe(true);
    expect(card?.classList.contains('rounded-2xl')).toBe(true);
    expect(card?.classList.contains('overflow-hidden')).toBe(true);
  });

  it('applies matte-card-hover when hover prop is true', () => {
    const { container } = render(<Card variant="studio" hover>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card?.classList.contains('matte-card')).toBe(true);
    expect(card?.classList.contains('matte-card-hover')).toBe(true);
  });

  it('merges className prop correctly', () => {
    const { container } = render(<Card variant="studio" className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card?.classList.contains('custom-class')).toBe(true);
    expect(card?.classList.contains('matte-card')).toBe(true);
  });

  it('passes through all div props', () => {
    const { container } = render(
      <Card variant="studio" data-testid="test-card" id="card-id">
        Content
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card?.getAttribute('data-testid')).toBe('test-card');
    expect(card?.getAttribute('id')).toBe('card-id');
  });
});
