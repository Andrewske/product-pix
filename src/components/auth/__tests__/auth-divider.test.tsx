import { render } from '@testing-library/react';
import { AuthDivider } from '../auth-divider';

describe('AuthDivider', () => {
  it('renders with default text', () => {
    const { getByText } = render(<AuthDivider />);
    expect(getByText('Or continue with email')).toBeInTheDocument();
  });

  it('renders with custom text prop', () => {
    const customText = 'Or sign in with';
    const { getByText } = render(<AuthDivider text={customText} />);
    expect(getByText(customText)).toBeInTheDocument();
  });

  it('renders horizontal lines on both sides of text', () => {
    const { container } = render(<AuthDivider />);
    const divider = container.firstChild as HTMLElement;

    // Check that it has the flex layout
    expect(divider).toHaveClass('relative');
    expect(divider).toHaveClass('flex');
    expect(divider).toHaveClass('items-center');

    // Check for the horizontal lines (border-t elements)
    const lines = container.querySelectorAll('.border-t');
    expect(lines).toHaveLength(2);
  });

  it('applies custom className', () => {
    const { container } = render(<AuthDivider className="custom-class" />);
    const divider = container.firstChild as HTMLElement;
    expect(divider).toHaveClass('custom-class');
  });

  it('has proper text styling', () => {
    const { getByText } = render(<AuthDivider />);
    const textElement = getByText('Or continue with email');

    expect(textElement).toHaveClass('px-4');
    expect(textElement).toHaveClass('text-sm');
    expect(textElement).toHaveClass('text-muted-foreground');
    expect(textElement).toHaveClass('bg-background');
  });
});