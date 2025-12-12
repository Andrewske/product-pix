import React from 'react';
import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../../components/ui/error-boundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  it('catches component errors and shows fallback UI', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = mock(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error fallback, not the component
    expect(screen.queryByText('No error')).toBeNull();
    expect(screen.getByText(/something went wrong/i)).toBeDefined();

    console.error = originalError;
  });

  it('shows "Try again" button that resets boundary', async () => {
    const user = userEvent.setup();
    console.error = mock(() => {});

    // Component that starts throwing but can be reset to not throw
    let shouldThrow = true;
    const ResettableComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered successfully</div>;
    };

    render(
      <ErrorBoundary>
        <ResettableComponent />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(screen.getByText(/something went wrong/i)).toBeDefined();

    // Click "Try again" button - this should reset the boundary
    const retryButton = screen.getByRole('button', { name: /try again/i });
    shouldThrow = false; // Fix the error condition
    await user.click(retryButton);

    // Should show recovered content
    expect(screen.getByText('Recovered successfully')).toBeDefined();
  });

  it('logs errors to console when they occur', () => {
    const mockConsoleError = mock(() => {});
    console.error = mockConsoleError;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have logged the error
    expect(mockConsoleError).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );

    console.error = console.error;
  });

  it('does not catch errors outside its tree', () => {
    // Errors outside the boundary should propagate
    const OutsideError = () => {
      throw new Error('Outside error');
    };

    expect(() => {
      render(
        <>
          <ErrorBoundary>
            <div>Protected content</div>
          </ErrorBoundary>
          <OutsideError />
        </>
      );
    }).toThrow('Outside error');
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeDefined();
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error, reset }: { error: Error; reset: () => void }) => (
      <div data-testid="custom-fallback">
        Custom: {error.message}
        <button onClick={reset}>Custom Reset</button>
      </div>
    );

    console.error = mock(() => {});

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeDefined();
    expect(screen.getByText('Custom: Test error')).toBeDefined();
  });

  it('catches errors thrown during async state updates', async () => {
    const AsyncErrorComponent = () => {
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        // Simulate async operation that fails
        setTimeout(() => {
          setError(new Error('Async operation failed'));
        }, 10);
      }, []);

      if (error) {
        throw error;
      }

      return <div>Async component</div>;
    };

    console.error = mock(() => {});

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    // Initially shows normal content
    expect(screen.getByText('Async component')).toBeDefined();

    // Wait for async error to trigger re-render with error
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });

  it('catches errors from async data fetching components', async () => {
    const DataFetchComponent = () => {
      const [data, setData] = React.useState<string | null>(null);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        // Simulate failed API call
        setTimeout(() => {
          setError(new Error('Failed to fetch data'));
        }, 10);
      }, []);

      if (error) {
        throw error;
      }

      return <div>{data ? data : 'Loading...'}</div>;
    };

    console.error = mock(() => {});

    render(
      <ErrorBoundary>
        <DataFetchComponent />
      </ErrorBoundary>
    );

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeDefined();

    // Wait for error to be thrown
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });

  it('handles multiple async errors gracefully', async () => {
    const MultipleAsyncErrors = () => {
      const [errors, setErrors] = React.useState<Error[]>([]);

      React.useEffect(() => {
        // Simulate multiple async failures
        const timer1 = setTimeout(() => {
          setErrors(prev => [...prev, new Error('First async error')]);
        }, 5);

        const timer2 = setTimeout(() => {
          setErrors(prev => [...prev, new Error('Second async error')]);
        }, 15);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }, []);

      if (errors.length > 0) {
        throw errors[0]; // Throw first error
      }

      return <div>Multiple async operations</div>;
    };

    console.error = mock(() => {});

    render(
      <ErrorBoundary>
        <MultipleAsyncErrors />
      </ErrorBoundary>
    );

    // Initially shows normal content
    expect(screen.getByText('Multiple async operations')).toBeDefined();

    // Wait for first error
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(screen.getByText(/something went wrong/i)).toBeDefined();
    expect(screen.getByText('First async error')).toBeDefined();
  });
});
