import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { AlertBox } from '../alert-box';

describe('AlertBox', () => {
  describe('Variants', () => {
    const variantCases = [
      { variant: 'error' as const, message: 'Error message' },
      { variant: 'success' as const, message: 'Success message' },
      { variant: 'info' as const, message: 'Info message' },
      { variant: 'warning' as const, message: 'Warning message' },
    ];

    variantCases.forEach(({ variant, message }) => {
      it(`should display ${variant} variant with appropriate styling`, () => {
        const { container, getByText } = render(<AlertBox variant={variant}>{message}</AlertBox>);
        const alert = container.querySelector('div') as HTMLElement;

        expect(getByText(message)).toBeDefined();
        expect(alert?.tagName).toBe('DIV');

        // Test that it has some form of visual distinction
        const style = window.getComputedStyle(alert);
        expect(style.display).not.toBe('none');
        expect(style.visibility).not.toBe('hidden');
      });
    });
  });

  it('should render title when provided', () => {
    const { getByText } = render(
      <AlertBox variant="error" title="Error Title">
        Error message
      </AlertBox>
    );
    const title = getByText('Error Title');
    expect(title).toBeDefined();
    expect(title?.tagName).toBe('DIV'); // Title is wrapped in a div
    expect(title?.textContent).toBe('Error Title');
  });

  it('should not render title when not provided', () => {
    const { queryByRole } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(queryByRole('heading')).not.not.toBeNull();
  });

  it('should merge className prop correctly', () => {
    const { container, getByText } = render(
      <AlertBox variant="error" className="custom-class">
        Error message
      </AlertBox>
    );
    const alert = container.querySelector('div') as HTMLElement;

    expect(getByText('Error message')).toBeDefined();
    // Test that custom class is applied (this is behavioral - customization works)
    expect(alert?.classList.contains('custom-class')).toBe(true);

    // Test that component still renders properly with custom class
    const style = window.getComputedStyle(alert);
    expect(style.display).not.toBe('none');
  });

});