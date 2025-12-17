import { describe, it, expect, mock } from 'bun:test'
import { render } from '@testing-library/react'
import { HeroSection } from '../hero-section'

// Mock Next.js Image component
mock.module('next/image', () => ({
  default: ({ src, alt, className, fill, priority }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
    priority?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : {}}
    />
  ),
}))

describe('HeroSection', () => {
  it('renders title and description', () => {
    const { getByText } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    expect(getByText('Test Title')).not.toBeNull()
    expect(getByText('Test description')).not.toBeNull()
  })

  it('renders badge when provided', () => {
    const { container } = render(
      <HeroSection
        badge="Test Badge"
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.textContent).toContain('Test Badge')
  })

  it('badge hidden when not provided', () => {
    const { container } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toBeNull()
  })

  it('renders primary CTA', () => {
    const { getByText } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    expect(getByText('Primary CTA')).not.toBeNull()
  })

  it('renders secondary CTA when provided', () => {
    const { getByText } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
        secondaryCta={<button type="button">Secondary CTA</button>}
      />
    )

    expect(getByText('Secondary CTA')).not.toBeNull()
  })

  it('renders image when imageSrc provided', () => {
    const { container } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
        imageSrc="/test.jpg"
        imageAlt="Test image"
      />
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('alt')).toBe('Test image')
  })

  it('image hidden when not provided', () => {
    const { container } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    const img = container.querySelector('img')
    expect(img).toBeNull()
  })

  it('applies correct section styling', () => {
    const { container } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    const section = container.querySelector('section')
    expect(section?.classList.contains('py-32')).toBe(true)
    expect(section?.classList.contains('bg-background')).toBe(true)
    expect(section?.classList.contains('overflow-hidden')).toBe(true)
  })

  it('renders with proper layout structure', () => {
    const { container } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    const title = container.querySelector('h1')
    expect(title?.classList.contains('text-6xl')).toBe(true)
    expect(title?.classList.contains('md:text-8xl')).toBe(true)
    expect(title?.classList.contains('font-display')).toBe(true)
  })

  it('badge includes sparkles icon when present', () => {
    const { container } = render(
      <HeroSection
        badge="Test Badge"
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    const sparklesIcon = badge?.querySelector('svg')
    expect(sparklesIcon).not.toBeNull()
  })

  it('CTAs are arranged in flex layout', () => {
    const { container } = render(
      <HeroSection
        title="Test Title"
        description="Test description"
        primaryCta={<button type="button">Primary CTA</button>}
        secondaryCta={<button type="button">Secondary CTA</button>}
      />
    )

    const ctaContainer = container.querySelector('.flex')
    expect(ctaContainer?.classList.contains('flex-col')).toBe(true)
    expect(ctaContainer?.classList.contains('sm:flex-row')).toBe(true)
  })
})