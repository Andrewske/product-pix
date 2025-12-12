import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    expect(getByText('Pending')).not.toBeNull();
  });

  it('renders pending status with appropriate styling', () => {
    const { container, getByText } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;

    expect(getByText('Pending')).toBeDefined();
    expect(badge?.tagName).toBe('SPAN');

    const style = window.getComputedStyle(badge);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders processing status with appropriate styling', () => {
    const { container, getByText } = render(<StatusBadge status="processing">Processing</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;

    expect(getByText('Processing')).toBeDefined();
    expect(badge?.tagName).toBe('SPAN');

    const style = window.getComputedStyle(badge);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders completed status with appropriate styling', () => {
    const { container, getByText } = render(<StatusBadge status="completed">Completed</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;

    expect(getByText('Completed')).toBeDefined();
    expect(badge?.tagName).toBe('SPAN');

    const style = window.getComputedStyle(badge);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders failed status with appropriate styling', () => {
    const { container, getByText } = render(<StatusBadge status="failed">Failed</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;

    expect(getByText('Failed')).toBeDefined();
    expect(badge?.tagName).toBe('SPAN');

    const style = window.getComputedStyle(badge);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders cancelled status with appropriate styling', () => {
    const { container, getByText } = render(<StatusBadge status="cancelled">Cancelled</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;

    expect(getByText('Cancelled')).toBeDefined();
    expect(badge?.tagName).toBe('SPAN');

    const style = window.getComputedStyle(badge);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('merges className prop correctly', () => {
    const { container, getByText } = render(
      <StatusBadge status="pending" className="custom-class">
        Pending
      </StatusBadge>
    );
    const badge = container.querySelector('span') as HTMLElement;

    expect(getByText('Pending')).toBeDefined();
    // Test that custom class is applied (behavioral test of customization)
    expect(badge?.classList.contains('custom-class')).toBe(true);

    const style = window.getComputedStyle(badge);
    expect(style.display).not.toBe('none');
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