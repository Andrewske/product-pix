import { describe, it, expect, mock } from 'bun:test'
import { render } from '@testing-library/react'
import { FeatureCard } from '../feature-card'

// Mock Next.js Image component
mock.module('next/image', () => ({
  default: ({ src, alt, className, fill }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : {}}
    />
  ),
}))

describe('FeatureCard', () => {
  it('renders title and description', () => {
    const { container } = render(
      <FeatureCard
        title="Test Product"
        description="Test description"
      />
    )

    const title = container.querySelector('h3')
    expect(title?.textContent).toBe('Test Product')

    const desc = container.querySelector('p')
    expect(desc?.textContent).toBe('Test description')
  })

  it('renders image when imageSrc is provided', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test"
        imageSrc="/test.jpg"
        imageAlt="Test image"
      />
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('alt')).toBe('Test image')
  })

  it('renders placeholder when no imageSrc', () => {
    const { container } = render(
      <FeatureCard title="Test" description="Test" />
    )

    const placeholder = container.querySelector('.bg-muted\\/20')
    expect(placeholder).not.toBeNull()
  })

  it('renders badge when provided', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test"
        badge="After"
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.textContent).toContain('After')
  })

  it('has hover states on card and title', () => {
    const { container } = render(
      <FeatureCard title="Test" description="Test" />
    )

    const wrapper = container.querySelector('.group')
    expect(wrapper?.classList.contains('cursor-pointer')).toBe(true)

    const title = container.querySelector('h3')
    expect(title?.classList.contains('group-hover:text-primary')).toBe(true)
  })

  it('badge shows on hover when provided', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test"
        badge="After"
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.classList.contains('opacity-0')).toBe(true)
    expect(badge?.classList.contains('group-hover:opacity-100')).toBe(true)
  })

  it('applies correct card styling', () => {
    const { container } = render(
      <FeatureCard title="Test" description="Test" />
    )

    const card = container.querySelector('[data-slot="card"]')
    expect(card?.classList.contains('rounded-2xl')).toBe(true)
    expect(card?.classList.contains('overflow-hidden')).toBe(true)
    expect(card?.classList.contains('relative')).toBe(true)
    expect(card?.classList.contains('mb-6')).toBe(true)
  })

  it('renders with cursor pointer', () => {
    const { container } = render(
      <FeatureCard title="Test" description="Test" />
    )

    const wrapper = container.querySelector('.group')
    expect(wrapper?.classList.contains('cursor-pointer')).toBe(true)
  })
})