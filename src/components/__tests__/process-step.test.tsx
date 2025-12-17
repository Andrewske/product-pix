import { ProcessStep } from '../process-step'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'bun:test'

describe('ProcessStep', () => {
  it('renders step number in badge', () => {
    const { container } = render(
      <ProcessStep
        step={1}
        title="Upload Image"
        description="Select an image to enhance"
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).not.toBeNull()
    expect(badge?.textContent).toBe('1')
  })

  it('renders title and description with correct typography', () => {
    const { getByText } = render(
      <ProcessStep
        step={2}
        title="Configure Settings"
        description="Choose your enhancement options"
      />
    )

    const title = getByText('Configure Settings')
    const description = getByText('Choose your enhancement options')

    expect(title.className).toContain('font-display')
    expect(title.className).toContain('text-lg')
    expect(description.className).toContain('text-sm')
    expect(description.className).toContain('text-muted-foreground')
  })

  it('shows connector line when not last step', () => {
    const { container } = render(
      <ProcessStep
        step={1}
        title="Step One"
        description="First step"
        isLast={false}
      />
    )

    const connector = container.querySelector('[aria-hidden="true"]')
    expect(connector).not.toBeNull()
  })

  it('hides connector line when isLast is true', () => {
    const { container } = render(
      <ProcessStep
        step={3}
        title="Final Step"
        description="Last step in process"
        isLast={true}
      />
    )

    const connector = container.querySelector('[aria-hidden="true"]')
    expect(connector).toBeNull()
  })

  it('badge has correct styling for circular appearance', () => {
    const { container } = render(
      <ProcessStep
        step={1}
        title="Test"
        description="Test"
      />
    )

    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.className).toContain('rounded-full')
    expect(badge?.className).toContain('h-8')
    expect(badge?.className).toContain('w-8')
  })

  it('badge is non-shrinking', () => {
    const { container } = render(
      <ProcessStep
        step={1}
        title="Test"
        description="Test"
      />
    )

    const badgeContainer = container.querySelector('.shrink-0')
    expect(badgeContainer).not.toBeNull()
  })
})