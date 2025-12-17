import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { SectionHeader } from '../section-header'

describe('SectionHeader', () => {
  it('renders title', () => {
    const { getByText } = render(
      <SectionHeader title="Test Title" />
    )

    expect(getByText('Test Title')).not.toBeNull()
  })

  it('renders description when provided', () => {
    const { getByText } = render(
      <SectionHeader
        title="Test Title"
        description="Test description"
      />
    )

    expect(getByText('Test description')).not.toBeNull()
  })

  it('description hidden when not provided', () => {
    const { container } = render(
      <SectionHeader title="Test Title" />
    )

    const desc = container.querySelector('p')
    expect(desc).toBeNull()
  })

  it('centered mode applies correct classes', () => {
    const { container } = render(
      <SectionHeader title="Test Title" centered={true} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.classList.contains('text-center')).toBe(true)
    expect(wrapper?.classList.contains('mb-24')).toBe(true)
  })

  it('non-centered mode applies correct classes', () => {
    const { container } = render(
      <SectionHeader title="Test Title" centered={false} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.classList.contains('text-center')).toBe(false)
    expect(wrapper?.classList.contains('mb-12')).toBe(true)
  })

  it('defaults to centered mode', () => {
    const { container } = render(
      <SectionHeader title="Test Title" />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.classList.contains('text-center')).toBe(true)
    expect(wrapper?.classList.contains('mb-24')).toBe(true)
  })

  it('applies correct title styling', () => {
    const { container } = render(
      <SectionHeader title="Test Title" />
    )

    const title = container.querySelector('h2')
    expect(title?.classList.contains('text-4xl')).toBe(true)
    expect(title?.classList.contains('font-bold')).toBe(true)
    expect(title?.classList.contains('mb-6')).toBe(true)
    expect(title?.classList.contains('tracking-tight')).toBe(true)
    expect(title?.classList.contains('font-display')).toBe(true)
  })

  it('applies correct description styling when provided', () => {
    const { container } = render(
      <SectionHeader
        title="Test Title"
        description="Test description"
      />
    )

    const desc = container.querySelector('p')
    expect(desc?.classList.contains('text-lg')).toBe(true)
    expect(desc?.classList.contains('text-muted-foreground')).toBe(true)
    expect(desc?.classList.contains('max-w-2xl')).toBe(true)
    expect(desc?.classList.contains('mx-auto')).toBe(true)
  })

  it('description has max-width constraint in centered mode', () => {
    const { container } = render(
      <SectionHeader
        title="Test Title"
        description="Test description"
        centered={true}
      />
    )

    const desc = container.querySelector('p')
    expect(desc?.classList.contains('max-w-2xl')).toBe(true)
    expect(desc?.classList.contains('mx-auto')).toBe(true)
  })
})