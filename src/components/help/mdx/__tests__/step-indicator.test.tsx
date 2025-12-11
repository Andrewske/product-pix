import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { Steps, Step } from '../step-indicator'

describe('Steps', () => {
  it('renders children', () => {
    render(
      <Steps>
        <div>Step content</div>
      </Steps>
    )
    expect(screen.getByText('Step content')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Steps className="custom-class">
        <div>Content</div>
      </Steps>
    )
    const steps = container.firstChild as HTMLElement
    expect(steps.className).toContain('custom-class')
  })
})

describe('Step', () => {
  it('renders step number', () => {
    render(
      <Step number={1} title="First Step">
        Content
      </Step>
    )
    expect(screen.getByText('1')).toBeDefined()
  })

  it('renders step title', () => {
    render(
      <Step number={1} title="First Step">
        Content
      </Step>
    )
    expect(screen.getByText('First Step')).toBeDefined()
  })

  it('renders step content', () => {
    render(
      <Step number={1} title="First Step">
        Step content here
      </Step>
    )
    expect(screen.getByText('Step content here')).toBeDefined()
  })

  it('renders multiple steps with different numbers', () => {
    render(
      <Steps>
        <Step number={1} title="Step One">First</Step>
        <Step number={2} title="Step Two">Second</Step>
        <Step number={3} title="Step Three">Third</Step>
      </Steps>
    )
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Step number={1} title="Title" className="custom-step">
        Content
      </Step>
    )
    const step = container.firstChild as HTMLElement
    expect(step.className).toContain('custom-step')
  })
})
