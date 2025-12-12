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
    const { container } = render(<AuthDivider />);
    const divider = container.firstChild as HTMLElement;

    // Check that it has the flex layout
    expect(divider?.classList.contains('relative')).toBe(true);
    expect(divider?.classList.contains('flex')).toBe(true);
    expect(divider?.classList.contains('items-center')).toBe(true);

    // Check for the horizontal lines (border-t elements)
    const lines = container.querySelectorAll('.border-t');
    expect(lines).toHaveLength(2);
  });

  it('applies custom className', () => {
    const { container } = render(<AuthDivider className="custom-class" />);
    const divider = container.firstChild as HTMLElement;
    expect(divider?.classList.contains('custom-class')).toBe(true);
  });

  it('has proper text styling', () => {
    const { getByText } = render(<AuthDivider />);
    const textElement = getByText('Or continue with email');

    expect(textElement?.classList.contains('px-4')).toBe(true);
    expect(textElement?.classList.contains('text-sm')).toBe(true);
    expect(textElement?.classList.contains('text-muted-foreground')).toBe(true);
    expect(textElement?.classList.contains('bg-background')).toBe(true);
  });
});