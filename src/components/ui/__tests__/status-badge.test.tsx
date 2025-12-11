import { render } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    expect(getByText('Pending')).toBeInTheDocument();
  });

  it('applies pending status styles', () => {
    const { container } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveClass('bg-info/10');
    expect(badge).toHaveClass('text-info');
    expect(badge).toHaveClass('border-info/30');
  });

  it('applies processing status styles', () => {
    const { container } = render(<StatusBadge status="processing">Processing</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveClass('bg-accent/10');
    expect(badge).toHaveClass('text-accent');
    expect(badge).toHaveClass('border-accent/30');
  });

  it('applies completed status styles', () => {
    const { container } = render(<StatusBadge status="completed">Completed</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveClass('bg-success/10');
    expect(badge).toHaveClass('text-success');
    expect(badge).toHaveClass('border-success/30');
  });

  it('applies failed status styles', () => {
    const { container } = render(<StatusBadge status="failed">Failed</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveClass('bg-destructive/10');
    expect(badge).toHaveClass('text-destructive');
    expect(badge).toHaveClass('border-destructive/30');
  });

  it('applies cancelled status styles', () => {
    const { container } = render(<StatusBadge status="cancelled">Cancelled</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveClass('bg-muted');
    expect(badge).toHaveClass('text-muted-foreground');
    expect(badge).toHaveClass('border-muted');
  });

  it('merges className prop correctly', () => {
    const { container } = render(
      <StatusBadge status="pending" className="custom-class">
        Pending
      </StatusBadge>
    );
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveClass('custom-class');
    expect(badge).toHaveClass('bg-info/10');
  });

  it('passes through other props', () => {
    const { container } = render(
      <StatusBadge status="pending" data-testid="status-badge">
        Pending
      </StatusBadge>
    );
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveAttribute('data-testid', 'status-badge');
  });

  it('has correct data-slot attribute', () => {
    const { container } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge).toHaveAttribute('data-slot', 'status-badge');
  });
});