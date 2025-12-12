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
    expect(card?.classList.contains('rounded-xl')).toBe(true)
    expect(card?.classList.contains('border')).toBe(true)
    expect(card?.classList.contains('py-6')).toBe(true)
    expect(card?.classList.contains('shadow-sm')).toBe(true)
  })

  it('renders hero variant correctly', () => {
    const { container } = render(
      <Card variant="hero">
        <CardHeader>
          <CardTitle>Hero Card</CardTitle>
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
    expect(card?.classList.contains('rounded-xl')).toBe(true)
    expect(card?.classList.contains('border')).toBe(true)
    expect(card?.classList.contains('py-6')).toBe(true)
    expect(card?.classList.contains('shadow-sm')).toBe(true)
    // Note: dark:bg-[var(--card-hero)] is applied via CSS-in-JS and can't be tested directly in this setup
  })

  it('renders control variant correctly', () => {
    const { container } = render(
      <Card variant="control">
        <CardHeader>
          <CardTitle>Control Card</CardTitle>
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
    expect(card?.classList.contains('rounded-xl')).toBe(true)
    expect(card?.classList.contains('border')).toBe(true)
    expect(card?.classList.contains('py-6')).toBe(true)
    expect(card?.classList.contains('shadow-sm')).toBe(true)
    // Note: dark:bg-[var(--card-control)] is applied via CSS-in-JS and can't be tested directly in this setup
  })

  it('renders studio variant correctly', () => {
    const { container } = render(
      <Card variant="studio">
        <CardHeader>
          <CardTitle>Studio Card</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card?.classList.contains('matte-card')).toBe(true)
    expect(card?.classList.contains('rounded-2xl')).toBe(true)
    expect(card?.classList.contains('overflow-hidden')).toBe(true)
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