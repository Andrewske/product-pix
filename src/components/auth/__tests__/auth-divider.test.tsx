import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { AuthDivider } from '../auth-divider';

describe('AuthDivider', () => {
  it('provides accessible separator between auth methods', () => {
    render(<AuthDivider />);

    const separator = screen.getByRole('separator');
    expect(separator.textContent).toBe('Or continue with email');
    expect(separator.getAttribute('aria-label')).toBe('or continue with email');
  });
});