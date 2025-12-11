import { render } from '@testing-library/react';
import { Card } from '../card';

describe('Card studio variant', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<Card variant="studio">Test Content</Card>);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies studio variant classes', () => {
    const { container } = render(<Card variant="studio">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('matte-card');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('overflow-hidden');
  });

  it('applies matte-card-hover when hover prop is true', () => {
    const { container } = render(<Card variant="studio" hover>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('matte-card');
    expect(card).toHaveClass('matte-card-hover');
  });

  it('merges className prop correctly', () => {
    const { container } = render(<Card variant="studio" className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('matte-card');
  });

  it('passes through all div props', () => {
    const { container } = render(
      <Card variant="studio" data-testid="test-card" id="card-id">
        Content
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-testid', 'test-card');
    expect(card).toHaveAttribute('id', 'card-id');
  });
});
