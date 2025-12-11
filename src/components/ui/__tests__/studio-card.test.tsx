import { render } from '@testing-library/react';
import { StudioCard } from '../studio-card';

describe('StudioCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<StudioCard>Test Content</StudioCard>);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies matte-card class by default', () => {
    const { container } = render(<StudioCard>Content</StudioCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('matte-card');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('overflow-hidden');
  });

  it('applies matte-card-hover when hover prop is true', () => {
    const { container } = render(<StudioCard hover>Content</StudioCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('matte-card-hover');
  });

  it('does not apply matte-card-hover when hover prop is false', () => {
    const { container } = render(<StudioCard hover={false}>Content</StudioCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('matte-card-hover');
  });

  it('merges className prop correctly', () => {
    const { container } = render(<StudioCard className="custom-class">Content</StudioCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('matte-card');
  });

  it('passes through other HTML attributes', () => {
    const { container } = render(
      <StudioCard data-testid="test-card" role="region">Content</StudioCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-testid', 'test-card');
    expect(card).toHaveAttribute('role', 'region');
  });
});
