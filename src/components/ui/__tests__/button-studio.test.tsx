import { render } from '@testing-library/react';
import { Button } from '../button';

describe('Button studio variant', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<Button variant="studio">Click Me</Button>);
    expect(getByText('Click Me')).toBeInTheDocument();
  });

  it('applies studio variant styles', () => {
    const { container } = render(<Button variant="studio">Studio</Button>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('bg-foreground');
    expect(button).toHaveClass('text-background');
    expect(button).toHaveClass('button-studio');
    expect(button).toHaveClass('shadow-xl');
  });

  it('applies studio variant with default size', () => {
    const { container } = render(<Button variant="studio">Button</Button>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('bg-foreground');
    expect(button).toHaveClass('text-background');
    expect(button).toHaveClass('button-studio');
    expect(button).toHaveClass('shadow-xl');
    expect(button).toHaveClass('h-9'); // default size
  });

  it('merges className prop correctly', () => {
    const { container } = render(<Button variant="studio" className="custom-class">Button</Button>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-foreground');
  });

  it('passes through all Button props', () => {
    const onClick = jest.fn();
    const { container } = render(
      <Button variant="studio" onClick={onClick} disabled data-testid="test-button">
        Button
      </Button>
    );
    const button = container.querySelector('button') as HTMLElement;
    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toBeDisabled();
  });
});
