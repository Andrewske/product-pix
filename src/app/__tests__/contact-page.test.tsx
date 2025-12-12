import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '@/components/contact/contact-form'

// Mock fetch
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ success: true, messageId: 'test-id' }),
} as Response))

global.fetch = mockFetch as typeof fetch

describe('ContactForm', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders contact form correctly', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText('Name')).toBeDefined()
    expect(screen.getByLabelText('Email')).toBeDefined()
    expect(screen.getByLabelText('Message')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeDefined()
  })

  it('shows validation errors on blur for invalid email', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeDefined()
    })

    // Check aria-invalid attribute
    expect(emailInput.getAttribute('aria-invalid')).toBe('true')
  })

  it('shows validation errors on blur for empty name', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const nameInput = screen.getByLabelText('Name')
    await user.type(nameInput, 'a') // Type something first
    await user.clear(nameInput) // Clear it
    await user.tab() // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined()
    })

    expect((nameInput as HTMLInputElement).getAttribute('aria-invalid')).toBe('true')
  })

  it('shows validation errors on blur for message too short', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const messageTextarea = screen.getByLabelText('Message')
    await user.type(messageTextarea, 'Hi')
    await user.tab() // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Message must be at least 10 characters')).toBeDefined()
    })

    expect((messageTextarea as HTMLTextAreaElement).getAttribute('aria-invalid')).toBe('true')
  })

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeDefined()
    })

    // Start typing valid email
    await user.type(emailInput, 'valid@example.com')

    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).toBeNull()
    })

    expect((emailInput as HTMLInputElement).getAttribute('aria-invalid')).toBeNull()
  })

  it('prevents submission with validation errors', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const form = document.querySelector('form')
    fireEvent.submit(form!)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined()
      expect(screen.getByText('Please enter a valid email address')).toBeDefined()
      expect(screen.getByText('Message must be at least 10 characters')).toBeDefined()
    })

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('submits successfully with valid data', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Message'), 'This is a valid message with enough content to pass validation.')

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a valid message with enough content to pass validation.',
        }),
      })
    })

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Message sent!')).toBeDefined()
      expect(screen.getByText("Thank you for contacting us. We'll get back to you within 24 hours.")).toBeDefined()
    })
  })

  it('shows error message when API returns 500', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response)

    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Message'), 'This is a valid message with enough content.')

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeDefined()
    })
  })

  it('shows rate limit error when API returns 429', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Too many requests...' }),
    } as Response)

    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Message'), 'This is a valid message with enough content.')

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Too many requests. Please try again later.')).toBeDefined()
    })
  })

  it('shows field errors when API returns 400 with validation details', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Invalid request',
        details: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['message'], message: 'Message too short' },
        ],
      }),
    } as Response)

    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'invalid-email')
    await user.type(screen.getByLabelText('Message'), 'Short')

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeDefined()
      expect(screen.getByText('Message too short')).toBeDefined()
    })
  })

  it('resets form when "Send another message" is clicked', async () => {
    // First submit successfully
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Message'), 'This is a valid message with enough content.')

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Message sent!')).toBeDefined()
    })

    // Click "Send another message"
    const resetButton = screen.getByRole('button', { name: 'Send another message' })
    await user.click(resetButton)

    // Form should be reset
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('')
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeDefined()
  })

  it('disables form during submission', async () => {
    // Make fetch slow to test loading state
    mockFetch.mockImplementation(() => new Promise(resolve =>
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, messageId: 'test-id' }),
      } as Response), 100)
    ))

    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Message'), 'This is a valid message with enough content.')

    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDefined()
    expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByLabelText('Email') as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).disabled).toBe(true)
  })
})