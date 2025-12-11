import { render } from '@testing-library/react';
import { StudioButton } from '../studio-button';

describe('StudioButton', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<StudioButton>Click Me</StudioButton>);
    expect(getByText('Click Me')).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    const { container } = render(<StudioButton>Primary</StudioButton>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('bg-foreground');
    expect(button).toHaveClass('text-background');
    expect(button).toHaveClass('button-studio');
    expect(button).toHaveClass('shadow-xl');
  });

  it('applies secondary variant styles when specified', () => {
    const { container } = render(<StudioButton studioVariant="secondary">Secondary</StudioButton>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('border-border');
    expect(button).not.toHaveClass('button-studio');
  });

  it('uses lg size by default', () => {
    const { container } = render(<StudioButton>Button</StudioButton>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('h-14');
    expect(button).toHaveClass('px-8');
  });

  it('merges className prop correctly', () => {
    const { container } = render(<StudioButton className="custom-class">Button</StudioButton>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-foreground');
  });

  it('passes through all Button props', () => {
    const onClick = jest.fn();
    const { container } = render(
      <StudioButton onClick={onClick} disabled data-testid="test-button">
        Button
      </StudioButton>
    );
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toBeDisabled();
  });
});
