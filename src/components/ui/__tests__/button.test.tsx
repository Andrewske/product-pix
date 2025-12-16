import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders default variant correctly', () => {
    const { container } = render(<Button>Default</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('bg-primary')).toBe(true)
    expect(button?.classList.contains('text-primary-foreground')).toBe(true)
  })

  it('renders accent variant correctly', () => {
    const { container } = render(<Button variant="accent">Accent</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('bg-primary')).toBe(true)
    expect(button?.classList.contains('text-primary-foreground')).toBe(true)
    expect(button?.classList.contains('hover:bg-primary/80')).toBe(true)
  })

  it('renders secondary variant correctly', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('bg-secondary')).toBe(true)
    expect(button?.classList.contains('text-secondary-foreground')).toBe(true)
  })

  it('renders outline variant correctly', () => {
    const { container } = render(<Button variant="outline">Outline</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('border')).toBe(true)
    expect(button?.classList.contains('border-border')).toBe(true)
  })

  it('renders ghost variant correctly', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('hover:bg-muted')).toBe(true)
    expect(button?.classList.contains('hover:text-foreground')).toBe(true)
  })

  it('renders link variant correctly', () => {
    const { container } = render(<Button variant="link">Link</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('text-accent')).toBe(true)
    expect(button?.classList.contains('underline-offset-4')).toBe(true)
  })



  it('renders different sizes correctly', () => {
    const { rerender, container } = render(<Button size="xs">Extra Small</Button>)
    let button = container.firstChild as HTMLElement
    expect(button?.classList.contains('h-6')).toBe(true)
    expect(button?.classList.contains('rounded-4xl')).toBe(true)
    expect(button?.classList.contains('gap-1')).toBe(true)
    expect(button?.classList.contains('px-2.5')).toBe(true)

    rerender(<Button size="sm">Small</Button>)
    button = container.firstChild as HTMLElement
    expect(button?.classList.contains('h-8')).toBe(true)
    expect(button?.classList.contains('rounded-4xl')).toBe(true)
    expect(button?.classList.contains('gap-1.5')).toBe(true)
    expect(button?.classList.contains('px-3')).toBe(true)

    rerender(<Button size="lg">Large</Button>)
    button = container.firstChild as HTMLElement
    expect(button?.classList.contains('h-10')).toBe(true)
    expect(button?.classList.contains('rounded-4xl')).toBe(true)
    expect(button?.classList.contains('px-6')).toBe(true)

    rerender(<Button size="xl">Extra Large</Button>)
    button = container.firstChild as HTMLElement
    expect(button?.classList.contains('h-14')).toBe(true)
    expect(button?.classList.contains('rounded-4xl')).toBe(true)
    expect(button?.classList.contains('px-8')).toBe(true)
    expect(button?.classList.contains('text-lg')).toBe(true)
  })

  it('renders icon sizes correctly', () => {
    const { rerender, container } = render(<Button size="icon-xs">Extra Small Icon</Button>)
    let button = container.firstChild as HTMLElement
    expect(button?.classList.contains('size-6')).toBe(true)

    rerender(<Button size="icon">Icon</Button>)
    button = container.firstChild as HTMLElement
    expect(button?.classList.contains('size-9')).toBe(true)

    rerender(<Button size="icon-sm">Small Icon</Button>)
    button = container.firstChild as HTMLElement
    expect(button?.classList.contains('size-8')).toBe(true)

    rerender(<Button size="icon-lg">Large Icon</Button>)
    button = container.firstChild as HTMLElement
    expect(button?.classList.contains('size-10')).toBe(true)
  })

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.classList.contains('custom-class')).toBe(true)
  })

  it('renders with icon', () => {
    const { container } = render(
      <Button>
        <svg data-testid="icon" />
        With Icon
      </Button>
    )

    const button = container.firstChild as HTMLElement
    const icon = container.querySelector('[data-testid="icon"]')
    expect(icon).toBeDefined()
    expect(button?.classList.contains('gap-2')).toBe(true)
  })

  it('handles disabled state', () => {
    const { container } = render(<Button disabled>Disabled</Button>)

    const button = container.firstChild as HTMLElement
    expect(button?.hasAttribute('disabled')).toBe(true)
    expect(button?.classList.contains('disabled:pointer-events-none')).toBe(true)
    expect(button?.classList.contains('disabled:opacity-50')).toBe(true)
  })
})