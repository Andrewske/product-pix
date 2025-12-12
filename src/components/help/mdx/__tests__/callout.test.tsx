import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { Callout } from '../callout'

describe('Callout', () => {
  it('renders with title when provided', () => {
    render(<Callout title="Important">Content</Callout>)
    expect(screen.getByText('Important')).toBeDefined()
    expect(screen.getByText('Content')).toBeDefined()
  })

  it('has alert role for accessibility', () => {
    render(<Callout>Content</Callout>)
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('renders info variant by default', () => {
    const { container } = render(<Callout>Content</Callout>)
    const callout = container.firstChild as HTMLElement
    expect(callout.className).toContain('border-info')
  })

  it('renders warning variant correctly', () => {
    const { container } = render(<Callout variant="warning">Content</Callout>)
    const callout = container.firstChild as HTMLElement
    expect(callout.className).toContain('border-destructive')
  })

  it('renders tip variant correctly', () => {
    const { container } = render(<Callout variant="tip">Content</Callout>)
    const callout = container.firstChild as HTMLElement
    expect(callout.className).toContain('border-accent')
  })

  it('renders success variant correctly', () => {
    const { container } = render(<Callout variant="success">Content</Callout>)
    const callout = container.firstChild as HTMLElement
    expect(callout.className).toContain('border-success')
  })

  it('applies custom className', () => {
    const { container } = render(<Callout className="custom-class">Content</Callout>)
    const callout = container.firstChild as HTMLElement
    expect(callout.className).toContain('custom-class')
  })
})
