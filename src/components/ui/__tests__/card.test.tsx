import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from '../card'

describe('Card', () => {
  it('renders default variant correctly', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card?.classList.contains('bg-card')).toBe(true)
    expect(card?.classList.contains('text-card-foreground')).toBe(true)
    expect(card?.classList.contains('flex')).toBe(true)
    expect(card?.classList.contains('flex-col')).toBe(true)
    expect(card?.classList.contains('gap-6')).toBe(true)
    expect(card?.classList.contains('rounded-2xl')).toBe(true)
    expect(card?.classList.contains('border')).toBe(true)
    expect(card?.classList.contains('ring-1')).toBe(true)
    expect(card?.classList.contains('ring-foreground/10')).toBe(true)
    expect(card?.classList.contains('py-6')).toBe(true)
    expect(card?.classList.contains('shadow-sm')).toBe(true)
  })

  it('renders sm size correctly', () => {
    const { container } = render(
      <Card size="sm">
        <CardHeader>
          <CardTitle>Small Card</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card?.classList.contains('gap-4')).toBe(true)
    expect(card?.classList.contains('py-4')).toBe(true)
  })

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card?.classList.contains('custom-class')).toBe(true)
  })

  it('renders CardTitle with font-display class', () => {
    const { getByText } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    )

    const title = getByText('Test Title')
    expect(title?.classList.contains('font-display')).toBe(true)
  })
})