import React from 'react';
import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button studio variant', () => {
  it('renders as a button element with correct content', () => {
    render(<Button variant="studio">Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('Click Me');
  });

  it('accepts type attribute when specified', () => {
    render(<Button variant="studio" type="button">Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.getAttribute('type')).toBe('button');
  });

  it('handles click events', async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(<Button variant="studio" onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents interaction when disabled', async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(
      <Button variant="studio" disabled onClick={handleClick}>
        Click Me
      </Button>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.hasAttribute('disabled')).toBe(true);

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation and activation', async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(<Button variant="studio" onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });

    // Test focus
    button.focus();
    expect(document.activeElement).toBe(button);

    // Test Enter key activation
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test Space key activation
    handleClick.mockClear();
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('passes through all Button props correctly', () => {
    const onClick = mock(() => {});

    render(
      <Button
        variant="studio"
        onClick={onClick}
        disabled
        data-testid="test-button"
        aria-label="Test button"
      >
        Button
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Test button' });
    expect(button.getAttribute('data-testid')).toBe('test-button');
    expect(button.getAttribute('aria-label')).toBe('Test button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('renders as link when using asChild with anchor element', () => {
    render(
      <Button variant="studio" asChild>
        <a href="/studio">Go to Studio</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: /go to studio/i });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/studio');
    expect(link.textContent).toBe('Go to Studio');
  });

  it('maintains accessibility attributes', () => {
    render(
      <Button variant="studio" aria-describedby="description">
        Accessible Button
      </Button>
    );

    const button = screen.getByRole('button', { name: /accessible button/i });
    expect(button.getAttribute('aria-describedby')).toBe('description');
  });

  // Async button state tests
  it('can be disabled during async operations', async () => {
    const AsyncButtonComponent = () => {
      const [loading, setLoading] = React.useState(false);

      const handleClick = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        setLoading(false);
      };

      return (
        <Button
          variant="studio"
          disabled={loading}
          onClick={handleClick}
        >
          {loading ? 'Loading...' : 'Submit'}
        </Button>
      );
    };

    const user = userEvent.setup();
    render(<AsyncButtonComponent />);

    const button = screen.getByRole('button');

    // Initially enabled
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.textContent).toBe('Submit');

    // Click to start async operation
    await user.click(button);

    // Should be disabled and show loading text
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.textContent).toBe('Loading...');

    // Wait for async operation to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be enabled again
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.textContent).toBe('Submit');
  });

  it('prevents multiple clicks during async operations', async () => {
    const mockAsyncAction = mock(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const AsyncButtonComponent = () => {
      const [loading, setLoading] = React.useState(false);

      const handleClick = async () => {
        if (loading) return;
        setLoading(true);
        await mockAsyncAction();
        setLoading(false);
      };

      return (
        <Button
          variant="studio"
          disabled={loading}
          onClick={handleClick}
        >
          {loading ? 'Processing...' : 'Click me'}
        </Button>
      );
    };

    const user = userEvent.setup();
    render(<AsyncButtonComponent />);

    const button = screen.getByRole('button');

    // Click multiple times quickly
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Should only trigger once
    expect(mockAsyncAction).toHaveBeenCalledTimes(1);

    // Button should be disabled during operation
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('shows error state after failed async operation', async () => {
    const AsyncButtonWithError = () => {
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState(false);

      const handleClick = async () => {
        setLoading(true);
        setError(false);
        try {
          await new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), 50));
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <Button
            variant="studio"
            disabled={loading}
            onClick={handleClick}
            className={error ? 'border-destructive' : ''}
          >
            {loading ? 'Loading...' : error ? 'Retry' : 'Submit'}
          </Button>
          {error && <span className="text-destructive text-sm">Operation failed</span>}
        </div>
      );
    };

    const user = userEvent.setup();
    render(<AsyncButtonWithError />);

    const button = screen.getByRole('button');

    // Initially normal state
    expect(button.textContent).toBe('Submit');
    expect(button.classList.contains('border-destructive')).toBe(false);

    // Click to trigger error
    await user.click(button);

    // Should show loading
    expect(button.textContent).toBe('Loading...');
    expect(button.hasAttribute('disabled')).toBe(true);

    // Wait for error
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show error state
    expect(button.textContent).toBe('Retry');
    expect(button.classList.contains('border-destructive')).toBe(true);
    expect(screen.getByText('Operation failed')).toBeDefined();
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('handles loading timeout gracefully', async () => {
    const AsyncButtonWithTimeout = () => {
      const [loading, setLoading] = React.useState(false);
      const [timedOut, setTimedOut] = React.useState(false);

      const handleClick = async () => {
        setLoading(true);
        setTimedOut(false);

        const timeout = setTimeout(() => {
          setTimedOut(true);
          setLoading(false);
        }, 200);

        try {
          await new Promise(resolve => setTimeout(resolve, 300)); // Longer than timeout
          clearTimeout(timeout);
          setLoading(false);
        } catch {
          // Handle error
        }
      };

      return (
        <Button
          variant="studio"
          disabled={loading || timedOut}
          onClick={handleClick}
        >
          {loading ? 'Loading...' : timedOut ? 'Timeout - Retry' : 'Start'}
        </Button>
      );
    };

    const user = userEvent.setup();
    render(<AsyncButtonWithTimeout />);

    const button = screen.getByRole('button');

    // Click to start operation
    await user.click(button);
    expect(button.textContent).toBe('Loading...');
    expect(button.hasAttribute('disabled')).toBe(true);

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 250));

    // Should show timeout state
    expect(button.textContent).toBe('Timeout - Retry');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('maintains button styling during loading states', async () => {
    const LoadingButton = () => {
      const [loading, setLoading] = React.useState(false);

      const handleClick = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 50));
        setLoading(false);
      };

      return (
        <Button
          variant="studio"
          size="lg"
          disabled={loading}
          onClick={handleClick}
          className="custom-loading-class"
        >
          {loading ? '⏳ Processing...' : '🚀 Launch'}
        </Button>
      );
    };

    const user = userEvent.setup();
    render(<LoadingButton />);

    const button = screen.getByRole('button');

    // Check initial styling
    expect(button.classList.contains('custom-loading-class')).toBe(true);
    expect(button.textContent).toBe('🚀 Launch');

    // Click and check loading styling is maintained
    await user.click(button);
    expect(button.classList.contains('custom-loading-class')).toBe(true);
    expect(button.textContent).toBe('⏳ Processing...');
    expect(button.hasAttribute('disabled')).toBe(true);

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(button.textContent).toBe('🚀 Launch');
    expect(button.hasAttribute('disabled')).toBe(false);
  });
});
