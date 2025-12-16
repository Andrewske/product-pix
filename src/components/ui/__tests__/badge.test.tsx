import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders default variant correctly', () => {
    const { container } = render(<Badge>Default</Badge>)

    const badge = container.firstChild as HTMLElement
    expect(badge?.classList.contains('border-transparent')).toBe(true)
    expect(badge?.classList.contains('bg-primary')).toBe(true)
    expect(badge?.classList.contains('text-primary-foreground')).toBe(true)
  })



  it('renders secondary variant correctly', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)

    const badge = container.firstChild as HTMLElement
    expect(badge?.classList.contains('border-transparent')).toBe(true)
    expect(badge?.classList.contains('bg-secondary')).toBe(true)
    expect(badge?.classList.contains('text-secondary-foreground')).toBe(true)
  })

  it('renders outline variant correctly', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)

    const badge = container.firstChild as HTMLElement
    expect(badge?.classList.contains('text-foreground')).toBe(true)
    expect(badge?.classList.contains('border-border')).toBe(true)
  })

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>)

    const badge = container.firstChild as HTMLElement
    expect(badge?.classList.contains('custom-class')).toBe(true)
  })

  it('renders with icon', () => {
    const { container } = render(
      <Badge>
        <svg data-testid="icon" />
        With Icon
      </Badge>
    )

    const badge = container.firstChild as HTMLElement
    const icon = container.querySelector('[data-testid="icon"]')
    expect(icon).toBeDefined()
    expect(badge?.classList.contains('gap-1')).toBe(true)
  })
})