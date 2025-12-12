import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { ImageFrame } from '../image-frame'

describe('ImageFrame', () => {
  it('renders image with src and alt', () => {
    render(<ImageFrame src="data:image/jpeg;base64,test" alt="Test image" />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('alt')).toBe('Test image')
  })

  it('renders caption when provided', () => {
    render(<ImageFrame src="data:image/jpeg;base64,test" alt="Test" caption="Image caption" />)
    expect(screen.getByText('Image caption')).toBeDefined()
  })

  it('does not render caption when not provided', () => {
    const { container } = render(<ImageFrame src="data:image/jpeg;base64,test" alt="Test" />)
    const figcaption = container.querySelector('figcaption')
    expect(figcaption).toBeNull()
  })

  it('renders as figure element', () => {
    const { container } = render(<ImageFrame src="data:image/jpeg;base64,test" alt="Test" />)
    const figure = container.querySelector('figure')
    expect(figure).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ImageFrame src="data:image/jpeg;base64,test" alt="Test" className="custom-class" />
    )
    const figure = container.querySelector('figure')
    expect(figure?.className).toContain('custom-class')
  })

  it('uses default dimensions when not specified', () => {
    render(<ImageFrame src="data:image/jpeg;base64,test" alt="Test" />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('width')).toBe('800')
    expect(img.getAttribute('height')).toBe('450')
  })

  it('uses custom dimensions when specified', () => {
    render(<ImageFrame src="data:image/jpeg;base64,test" alt="Test" width={400} height={300} />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('width')).toBe('400')
    expect(img.getAttribute('height')).toBe('300')
  })
})
