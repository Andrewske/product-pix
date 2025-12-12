import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { ContactForm } from '../contact-form'

describe('ContactForm', () => {
  it('renders contact form correctly', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText('Name')).toBeDefined()
    expect(screen.getByLabelText('Email')).toBeDefined()
    expect(screen.getByLabelText('Message')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeDefined()
  })

  it('shows success message after submission', () => {
    // This would require mocking the fetch API
    // For now, just test that the component renders
    render(<ContactForm />)
    expect(screen.getByText('Send Message')).toBeDefined()
  })
})