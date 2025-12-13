import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';

// Mock Next.js router
const mockPush = mock(() => {});
const mockRefresh = mock(() => {});

mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Supabase client
const mockSignInWithPassword = mock(() => Promise.resolve({ error: null as any }));

mock.module('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));


describe('LoginForm - Integration Tests', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
    mockSignInWithPassword.mockClear();
  });

  it('submits successfully with valid email and password', async () => {
    const user = userEvent.setup();

    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // Fill form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit
    await user.click(submitButton);

    // Verify API call
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    // Verify redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');

    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');

    // Try to submit - browser validation should prevent
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Form should not submit due to HTML5 validation
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // Enter email but leave password empty
    await user.type(emailInput, 'test@example.com');

    // Try to submit
    await user.click(submitButton);

    // Form should not submit due to HTML5 validation
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('displays server error message on authentication failure', async () => {
    const user = userEvent.setup();

    const errorMessage = 'Invalid login credentials';
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: errorMessage } as any
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // Fill form
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');

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
    mockSignInWithPassword.mockReturnValueOnce(new Promise(() => {}));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement;

    // Fill form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit
    await user.click(submitButton);

    // Verify loading state is shown
    expect(submitButton.textContent).toBe('Signing in...');
    expect(submitButton.disabled).toBe(true);
    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
  });

  it('redirects to custom redirectTo path on success', async () => {
    const user = userEvent.setup();

    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    render(<LoginForm redirectTo="/custom-path" />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // Fill form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit
    await user.click(submitButton);

    // Verify custom redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-path');
    });
  });

  it('clears previous error on new submission attempt', async () => {
    const user = userEvent.setup();

    // First attempt fails
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: 'First error' } as any
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // First failed attempt
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeDefined();
    });

    // Second attempt succeeds
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    // Clear and re-enter credentials
    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'correct@example.com');
    await user.type(passwordInput, 'correctpass');

    // Submit again
    await user.click(submitButton);

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('First error')).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});