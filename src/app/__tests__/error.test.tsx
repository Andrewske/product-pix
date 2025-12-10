import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Error from '../error';

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h1 className={className}>{children}</h1>,
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={className}>{children}</p>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

describe('Error Boundary', () => {
  it('renders error message and reset button', () => {
    const mockError: Error & { digest?: string } = {
      name: 'Error',
      message: 'Test pricing error',
    };
    const mockReset = jest.fn();

    render(<Error error={mockError} reset={mockReset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an error while loading the page. This might be a temporary issue with our pricing service.')).toBeInTheDocument();
    expect(screen.getByText('Test pricing error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls reset function when try again button is clicked', () => {
    const mockError: Error & { digest?: string } = {
      name: 'Error',
      message: 'Network error',
    };
    const mockReset = jest.fn();

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
    const mockReset = jest.fn();

    render(<Error error={mockError} reset={mockReset} />);

    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });
});