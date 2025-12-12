import React from 'react';
import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the UI components
mock.module('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

mock.module('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h1 className={className}>{children}</h1>,
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={className}>{children}</p>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

// Dynamic import after mocking
const { default: Error } = await import('../error');

describe('Error Boundary', () => {
  it('renders error message and reset button', () => {
    const mockError: Error & { digest?: string } = {
      name: 'Error',
      message: 'Test pricing error',
    };
    const mockReset = mock(() => {});

    render(<Error error={mockError} reset={mockReset} />);

    expect(screen.getByText('Something went wrong')).not.toBeNull();
    expect(screen.getByText('We encountered an error while loading the page. This might be a temporary issue with our pricing service.')).not.toBeNull();
    expect(screen.getByText('Test pricing error')).not.toBeNull();
    expect(screen.getByText('Try again')).not.toBeNull();
  });

  it('calls reset function when try again button is clicked', () => {
    const mockError: Error & { digest?: string } = {
      name: 'Error',
      message: 'Network error',
    };
    const mockReset = mock(() => {});

    render(<Error error={mockError} reset={mockReset} />);

    const resetButton = screen.getByText('Try again');
    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('displays error with digest if available', () => {
    const mockError: Error & { digest?: string } = {
      name: 'Error',
      message: 'Database connection failed',
      digest: 'error-digest-123',
    };
    const mockReset = mock(() => {});

    render(<Error error={mockError} reset={mockReset} />);

    expect(screen.getByText('Database connection failed')).not.toBeNull();
  });
});
