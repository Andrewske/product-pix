import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserTimeline } from '../user-timeline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';

const mockTimelineResponse = {
  events: [
    {
      id: 'event-1',
      type: 'error' as const,
      subtype: 'high',
      timestamp: '2024-01-01T10:00:00Z',
      title: 'Payment Failed',
      metadata: {
        severity: 'high',
        domain: 'payment',
        error_message: 'Credit card declined',
        resolved_at: null,
      },
    },
    {
      id: 'event-2',
      type: 'job' as const,
      subtype: 'completed',
      timestamp: '2024-01-01T09:00:00Z',
      title: 'Image Generation',
      metadata: {
        template_slug: 'product-photo',
        status: 'completed',
        credits_charged: 10,
        prompt: 'A beautiful product photo',
      },
    },
  ],
  nextCursor: null,
};

// Mock fetch for the new API implementation
const mockFetch = mock(global.fetch);
mockFetch.mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockTimelineResponse),
} as Response);

const mockResolveError = mock(() => Promise.resolve(undefined));
const mockUnresolveError = mock(() => Promise.resolve(undefined));

// Mock the admin API client for error resolution
mock.module('@/lib/admin-api/client', () => ({
  resolveError: mockResolveError,
  unresolveError: mockUnresolveError,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserTimeline', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTimelineResponse),
    } as Response);
    mockResolveError.mockReset();
    mockResolveError.mockResolvedValue(undefined);
    mockUnresolveError.mockReset();
    mockUnresolveError.mockResolvedValue(undefined);
  });

  it('renders timeline filters', async () => {
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    // Check that filters are rendered
    expect(screen.getByText('Event Types')).not.toBeNull();
    expect(screen.getByText('Date Range')).not.toBeNull();

    // Check that fetch was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/'),
        expect.any(Object)
      );
    });
  });

  it('displays event details correctly', async () => {
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    // Check severity and domain badges
    expect(screen.getByText('High')).not.toBeNull();
    expect(screen.getByText('Payment')).not.toBeNull();
    expect(screen.getByText('DB')).not.toBeNull(); // Database source badge
  });

  it('shows resolve button for unresolved database events', async () => {
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    const resolveButton = screen.getByRole('button', { name: /resolve/i });
    expect(resolveButton).not.toBeNull();
  });

  it('calls resolveError when resolve button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    const resolveButton = screen.getByRole('button', { name: /resolve/i });
    await user.click(resolveButton);

    expect(mockResolveError).toHaveBeenCalledWith('event-1');
  });

  it('shows loading state when fetching more events', async () => {
    const _user = userEvent.setup();

    // Mock response with nextCursor to enable infinite scroll
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockTimelineResponse,
        nextCursor: 'cursor-123',
      }),
    } as Response);

    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    // With infinite scroll, there should be a loading indicator when more data is available
    expect(screen.getByText('Loading more events...')).not.toBeNull();
  });

  it('filters events by type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    // Find and click on the "Errors" checkbox to filter
    const errorCheckbox = screen.getByLabelText('Errors');
    await user.click(errorCheckbox);

    // Should refetch with new filters - check that fetch was called with types parameter
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('types=error'),
      expect.any(Object)
    );
  });

  it('filters events by date range', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    // Find the start date button and click it
    const startDateButton = screen.getByLabelText('Select start date');
    await user.click(startDateButton);

    // Should open calendar (we can't easily test the full date selection in this test)
    expect(screen.getByText('Date Range')).not.toBeNull();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<UserTimeline userId={mockUserId} />);

    // Should not crash - the component should handle errors gracefully
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});