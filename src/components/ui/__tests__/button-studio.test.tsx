import { describe, it, expect, mock } from 'bun:test';
import { render } from '@testing-library/react';
import { Button } from '../button';

describe('Button studio variant', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<Button variant="studio">Click Me</Button>);
    expect(getByText('Click Me')).not.toBeNull();
  });

  it('applies studio variant styles', () => {
    const { container } = render(<Button variant="studio">Studio</Button>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.classList.contains('bg-foreground')).toBe(true);
    expect(button?.classList.contains('text-background')).toBe(true);
    expect(button?.classList.contains('button-studio')).toBe(true);
    expect(button?.classList.contains('shadow-xl')).toBe(true);
  });

  it('applies studio variant with default size', () => {
    const { container } = render(<Button variant="studio">Button</Button>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.classList.contains('bg-foreground')).toBe(true);
    expect(button?.classList.contains('text-background')).toBe(true);
    expect(button?.classList.contains('button-studio')).toBe(true);
    expect(button?.classList.contains('shadow-xl')).toBe(true);
    expect(button?.classList.contains('h-9')).toBe(true); // default size
  });

  it('merges className prop correctly', () => {
    const { container } = render(<Button variant="studio" className="custom-class">Button</Button>);
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.classList.contains('custom-class')).toBe(true);
    expect(button?.classList.contains('bg-foreground')).toBe(true);
  });

  it('passes through all Button props', () => {
    const onClick = mock(() => {});
    const { container } = render(
      <Button variant="studio" onClick={onClick} disabled data-testid="test-button">
        Button
      </Button>
    );
    const button = container.querySelector('button') as HTMLElement;
    expect(button?.getAttribute('data-testid')).toBe('test-button');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
