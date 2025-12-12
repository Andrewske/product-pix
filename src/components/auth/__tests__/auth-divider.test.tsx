import { render } from '@testing-library/react';
import { AuthDivider } from '../auth-divider';

describe('AuthDivider', () => {
  it('renders with default text', () => {
    const { getByText } = render(<AuthDivider />);
    expect(getByText('Or continue with email')).not.toBeNull();
  });

  it('renders with custom text prop', () => {
    const customText = 'Or sign in with';
    const { getByText } = render(<AuthDivider text={customText} />);
    expect(getByText(customText)).not.toBeNull();
  });

  it('renders horizontal lines on both sides of text', () => {
    const { container, getByText } = render(<AuthDivider />);
    const divider = container.firstChild as HTMLElement;

    expect(getByText('Or continue with email')).toBeDefined();
    expect(divider?.tagName).toBe('DIV');

    // Check for the horizontal lines (border-t elements)
    const lines = container.querySelectorAll('.border-t');
    expect(lines).toHaveLength(2);

    // Test that the structure is correct
    const style = window.getComputedStyle(divider);
    expect(style.display).not.toBe('none');
  });

  it('applies custom className', () => {
    const { container } = render(<AuthDivider className="custom-class" />);
    const divider = container.firstChild as HTMLElement;
    expect(divider?.classList.contains('custom-class')).toBe(true);
  });

  it('displays text with appropriate styling', () => {
    const { getByText } = render(<AuthDivider />);
    const textElement = getByText('Or continue with email');

    expect(textElement?.tagName).toBe('SPAN');
    expect(textElement?.textContent).toBe('Or continue with email');

    // Test that text is visible
    const style = window.getComputedStyle(textElement);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });
});