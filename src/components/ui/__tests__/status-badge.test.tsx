import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    expect(getByText('Pending')).not.toBeNull();
  });

  it('applies pending status styles', () => {
    const { container } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.classList.contains('bg-info/10')).toBe(true);
    expect(badge?.classList.contains('text-info')).toBe(true);
    expect(badge?.classList.contains('border-info/30')).toBe(true);
  });

  it('applies processing status styles', () => {
    const { container } = render(<StatusBadge status="processing">Processing</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.classList.contains('bg-accent/10')).toBe(true);
    expect(badge?.classList.contains('text-accent')).toBe(true);
    expect(badge?.classList.contains('border-accent/30')).toBe(true);
  });

  it('applies completed status styles', () => {
    const { container } = render(<StatusBadge status="completed">Completed</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.classList.contains('bg-success/10')).toBe(true);
    expect(badge?.classList.contains('text-success')).toBe(true);
    expect(badge?.classList.contains('border-success/30')).toBe(true);
  });

  it('applies failed status styles', () => {
    const { container } = render(<StatusBadge status="failed">Failed</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.classList.contains('bg-destructive/10')).toBe(true);
    expect(badge?.classList.contains('text-destructive')).toBe(true);
    expect(badge?.classList.contains('border-destructive/30')).toBe(true);
  });

  it('applies cancelled status styles', () => {
    const { container } = render(<StatusBadge status="cancelled">Cancelled</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.classList.contains('bg-muted')).toBe(true);
    expect(badge?.classList.contains('text-muted-foreground')).toBe(true);
    expect(badge?.classList.contains('border-muted')).toBe(true);
  });

  it('merges className prop correctly', () => {
    const { container } = render(
      <StatusBadge status="pending" className="custom-class">
        Pending
      </StatusBadge>
    );
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.classList.contains('custom-class')).toBe(true);
    expect(badge?.classList.contains('bg-info/10')).toBe(true);
  });

  it('passes through other props', () => {
    const { container } = render(
      <StatusBadge status="pending" data-testid="status-badge">
        Pending
      </StatusBadge>
    );
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.getAttribute('data-testid')).toBe('status-badge');
  });

  it('has correct data-slot attribute', () => {
    const { container } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.getAttribute('data-slot')).toBe('status-badge');
  });
});