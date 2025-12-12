import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  describe('Status Variants', () => {
    const statusCases = [
      { status: 'pending' as const, text: 'Pending' },
      { status: 'processing' as const, text: 'Processing' },
      { status: 'completed' as const, text: 'Completed' },
      { status: 'failed' as const, text: 'Failed' },
      { status: 'cancelled' as const, text: 'Cancelled' },
    ];

    statusCases.forEach(({ status, text }) => {
      it(`should display ${status} status with appropriate styling`, () => {
        const { container, getByText } = render(<StatusBadge status={status}>{text}</StatusBadge>);
        const badge = container.querySelector('span') as HTMLElement;

        expect(getByText(text)).toBeDefined();

        const style = window.getComputedStyle(badge);
        expect(style.display).not.toBe('none');
        expect(style.visibility).not.toBe('hidden');
      });
    });
  });

  it('should merge className prop correctly', () => {
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

  it('should have correct data-slot attribute', () => {
    const { container } = render(<StatusBadge status="pending">Pending</StatusBadge>);
    const badge = container.querySelector('span') as HTMLElement;
    expect(badge?.getAttribute('data-slot')).toBe('status-badge');
  });
});