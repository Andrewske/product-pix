import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '../signup-form';

// Mock Supabase client
const mockSignUp = mock(() => Promise.resolve({ error: null as any }));

mock.module('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

// Mock window.location
const mockLocation = { origin: 'http://localhost:3000' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('SignupForm - Integration Tests', () => {
  beforeEach(() => {
    mockSignUp.mockClear();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    // Fill form with mismatched passwords
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');

    // Submit
    await user.click(submitButton);

    // Verify error is displayed
    expect(screen.getByText('Passwords do not match')).toBeDefined();

    // Verify API was not called
    expect(mockSignUp).not.toHaveBeenCalled();

    // Button should be enabled again
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    // Fill form with short password
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');
    await user.type(confirmPasswordInput, 'short');

    // Submit
    await user.click(submitButton);

    // Verify error is displayed
    expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();

    // Verify API was not called
    expect(mockSignUp).not.toHaveBeenCalled();

    // Button should be enabled again
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Try to submit - browser validation should prevent
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // Form should not submit due to HTML5 validation
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows validation error for empty required fields', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    const submitButton = screen.getByRole('button', { name: 'Create account' });

    // Try to submit empty form
    await user.click(submitButton);

    // Form should not submit due to HTML5 validation
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('displays server error message on signup failure', async () => {
    const user = userEvent.setup();

    const errorMessage = 'User already registered';
    mockSignUp.mockResolvedValueOnce({
      error: { message: errorMessage } as any
    });

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    // Fill form
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Submit
    await user.click(submitButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeDefined();
    });

    // Button should be enabled again
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    // Mock to never resolve (to keep loading state)
    mockSignUp.mockReturnValueOnce(new Promise(() => {}));

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Create account' }) as HTMLButtonElement;

    // Fill form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Submit
    await user.click(submitButton);

    // Verify loading state is shown
    expect(submitButton.textContent).toBe('Creating account...');
    expect(submitButton.disabled).toBe(true);
    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(confirmPasswordInput.disabled).toBe(true);
  });

  it('shows success message on successful signup', async () => {
    const user = userEvent.setup();

    mockSignUp.mockResolvedValueOnce({ error: null });

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    // Fill form
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Submit
    await user.click(submitButton);

    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeDefined();
      expect(screen.getByText(/We've sent you a confirmation link/)).toBeDefined();
    });

    // Verify API call with correct parameters
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });
  });

  it('clears previous error on new submission attempt', async () => {
    const user = userEvent.setup();

    // First attempt fails
    mockSignUp.mockResolvedValueOnce({
      error: { message: 'First error' } as any
    });

    render(<SignupForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    // First failed attempt
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeDefined();
    });

    // Second attempt succeeds
    mockSignUp.mockResolvedValueOnce({ error: null });

    // Clear and re-enter credentials
    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.clear(confirmPasswordInput);
    await user.type(emailInput, 'correct@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Submit again
    await user.click(submitButton);

    // Error should be cleared and success shown
    await waitFor(() => {
      expect(screen.queryByText('First error')).toBeNull();
      expect(screen.getByText('Check your email')).toBeDefined();
    });
  });
});