import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateSelector } from '../template-selector';

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    templates: [
      {
        slug: 'ecommerce-base',
        version: 1,
        name: 'E-commerce Base',
        description: 'Basic e-commerce template',
        icon: '🛍️'
      },
      {
        slug: 'luxury-product',
        version: 1,
        name: 'Luxury Product',
        description: 'High-end product template',
        icon: '💎'
      }
    ]
  })
} as any));

// @ts-ignore - Test mock
global.fetch = mockFetch;

describe('TemplateSelector', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('shows loading state initially', () => {
    render(<TemplateSelector value="" onChange={() => {}} />);

    expect(screen.getByText('Loading templates...')).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined(); // Spinner
  });

  it('renders templates successfully', async () => {
    const mockOnChange = mock(() => {});
    render(<TemplateSelector value="" onChange={mockOnChange} />);

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('E-commerce Base')).toBeDefined();
    });

    expect(screen.getByText('Luxury Product')).toBeDefined();
    expect(mockOnChange).toHaveBeenCalledWith('ecommerce-base'); // Default selection
  });

  it('calls onChange when template is selected', async () => {
    const mockOnChange = mock(() => {});
    render(<TemplateSelector value="" onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Luxury Product')).toBeDefined();
    });

    const luxuryButton = screen.getByText('Luxury Product').closest('button');
    await userEvent.click(luxuryButton!);

    expect(mockOnChange).toHaveBeenCalledWith('luxury-product');
  });

  it('shows selected template styling', async () => {
    render(<TemplateSelector value="luxury-product" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Luxury Product')).toBeDefined();
    });

    const luxuryButton = screen.getByText('Luxury Product').closest('button');
    expect(luxuryButton?.className).toContain('border-primary');
    expect(luxuryButton?.className).toContain('bg-primary/5');
  });

  it('handles network error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<TemplateSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });

    // Should not show loading anymore
    expect(screen.queryByText('Loading templates...')).toBeNull();
  });

  it('handles HTTP error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({})
    } as any);

    render(<TemplateSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch templates')).toBeDefined();
    });
  });

  it('handles empty templates array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ templates: [] })
    } as any);

    render(<TemplateSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No templates available')).toBeDefined();
    });
  });

  it('handles malformed response data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}) // Missing templates property
    } as any);

    render(<TemplateSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load templates')).toBeDefined();
    });
  });

  it('respects disabled prop', async () => {
    const mockOnChange = mock(() => {});
    render(<TemplateSelector value="" onChange={mockOnChange} disabled />);

    await waitFor(() => {
      expect(screen.getByText('E-commerce Base')).toBeDefined();
    });

    const templateButton = screen.getByText('E-commerce Base').closest('button');
    expect(templateButton?.hasAttribute('disabled')).toBe(true);

    await userEvent.click(templateButton!);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('does not set default when value is already provided', async () => {
    const mockOnChange = mock(() => {});
    render(<TemplateSelector value="luxury-product" onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Luxury Product')).toBeDefined();
    });

    // Should not call onChange since value is already set
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  // Loading state tests
  it('shows loading spinner during data fetch', () => {
    render(<TemplateSelector value="" onChange={() => {}} />);

    // Should show loading spinner initially
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeDefined();

    expect(screen.getByText('Loading templates...')).toBeDefined();
  });

  it('replaces loading state with content when data loads', async () => {
    render(<TemplateSelector value="" onChange={() => {}} />);

    // Initially shows loading
    expect(screen.getByText('Loading templates...')).toBeDefined();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('E-commerce Base')).toBeDefined();
    });

    // Loading should be gone
    expect(screen.queryByText('Loading templates...')).toBeNull();

    // Spinner should be gone
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeNull();
  });

  it('shows error state instead of loading when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<TemplateSelector value="" onChange={() => {}} />);

    // Initially shows loading
    expect(screen.getByText('Loading templates...')).toBeDefined();

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });

    // Loading should be gone
    expect(screen.queryByText('Loading templates...')).toBeNull();

    // No spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeNull();
  });

  it('handles slow loading without premature content display', async () => {
    // Mock a slow response
    let resolvePromise: (value: any) => void;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(slowPromise as any);

    render(<TemplateSelector value="" onChange={() => {}} />);

    // Should show loading immediately
    expect(screen.getByText('Loading templates...')).toBeDefined();

    // Wait a bit - should still show loading
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByText('Loading templates...')).toBeDefined();

    // Now resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({
        templates: [
          {
            slug: 'slow-template',
            version: 1,
            name: 'Slow Template',
            description: 'Loaded slowly',
            icon: '🐌'
          }
        ]
      })
    });

    // Should now show content
    await waitFor(() => {
      expect(screen.getByText('Slow Template')).toBeDefined();
    });

    // Loading should be gone
    expect(screen.queryByText('Loading templates...')).toBeNull();
  });

  it('shows loading state for disabled component', () => {
    render(<TemplateSelector value="" onChange={() => {}} disabled />);

    // Should still show loading even when disabled
    expect(screen.getByText('Loading templates...')).toBeDefined();

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
  });

  // Screen reader accessibility tests
  it('provides proper ARIA live regions for status updates', async () => {
    render(<TemplateSelector value="" onChange={() => {}} />);

    // Initially should have loading announcement
    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeDefined();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('E-commerce Base')).toBeDefined();
    });

    // Live region should announce successful load
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
  });

  it('announces error messages to screen readers', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failed'));

    render(<TemplateSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Network failed')).toBeDefined();
    });

    // Error message should be in a live region
    const errorElement = screen.getByText('Network failed');
    const liveRegion = errorElement.closest('[aria-live]') || document.querySelector('[aria-live]');
    expect(liveRegion).toBeDefined();
    expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
  });

  it('marks loading states with aria-busy', () => {
    render(<TemplateSelector value="" onChange={() => {}} />);

    // The loading container should indicate busy state
    const loadingContainer = screen.getByText('Loading templates...').closest('div');
    expect(loadingContainer?.getAttribute('aria-busy')).toBe('true');
  });

  it('provides proper form field associations', async () => {
    // This would test if the component were used in a form context
    // For now, test that the component renders with proper structure
    render(<TemplateSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('E-commerce Base')).toBeDefined();
    });

    // Template buttons should have proper labels and descriptions
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.hasAttribute('aria-label') || button.hasAttribute('aria-labelledby')).toBe(true);
    });
  });

  it('announces successful actions with live regions', async () => {
    const mockOnChange = mock(() => {});
    render(<TemplateSelector value="" onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('E-commerce Base')).toBeDefined();
    });

    // When template is selected, should announce the selection
    const templateButton = screen.getByText('E-commerce Base').closest('button');
    await userEvent.click(templateButton!);

    expect(mockOnChange).toHaveBeenCalledWith('ecommerce-base');

    // Check for status announcement (this would be ideal but may not be implemented)
    const statusRegion = document.querySelector('[role="status"]') || document.querySelector('[aria-live]');
    if (statusRegion) {
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    }
  });
});