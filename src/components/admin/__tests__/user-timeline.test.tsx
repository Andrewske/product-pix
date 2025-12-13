import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserTimeline } from '../user-timeline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the admin API client
jest.mock('@/lib/admin-api/client', () => ({
  getUserTimeline: jest.fn(),
  resolveError: jest.fn(),
  unresolveError: jest.fn(),
}));

const mockGetUserTimeline = require('@/lib/admin-api/client').getUserTimeline;
const mockResolveError = require('@/lib/admin-api/client').resolveError;
const mockUnresolveError = require('@/lib/admin-api/client').unresolveError;

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

  const mockTimelineResponse = {
    events: [
      {
        id: 'event-1',
        title: 'Payment Failed',
        description: 'Credit card declined',
        severity: 'high' as const,
        domain: 'payment' as const,
        source: 'database' as const,
        timestamp: '2024-01-01T10:00:00Z',
        resolvedAt: null,
        metadata: { transactionId: 'txn_123' },
      },
      {
        id: 'event-2',
        title: 'Image Generation',
        description: 'Generated product image',
        severity: 'low' as const,
        domain: 'generation' as const,
        source: 'other' as const,
        timestamp: '2024-01-01T09:00:00Z',
        resolvedAt: null,
        metadata: { imageId: 'img_456' },
      },
    ],
    nextCursor: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserTimeline.mockResolvedValue(mockTimelineResponse);
    mockResolveError.mockResolvedValue(undefined);
    mockUnresolveError.mockResolvedValue(undefined);
  });

  it('renders timeline filters and events', async () => {
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    // Check that filters are rendered
    expect(screen.getByText('Severity')).not.toBeNull();
    expect(screen.getByText('Domain')).not.toBeNull();
    expect(screen.getByText('Status')).not.toBeNull();
    expect(screen.getByText('Time Range')).not.toBeNull();

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    expect(screen.getByText('Image Generation')).not.toBeNull();
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
    const user = userEvent.setup();

    // Mock response with nextCursor to enable "Load More"
    mockGetUserTimeline.mockResolvedValueOnce({
      ...mockTimelineResponse,
      nextCursor: 'cursor-123',
    });

    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    expect(loadMoreButton).not.toBeNull();

    // Mock loading state
    mockGetUserTimeline.mockResolvedValueOnce({
      events: [],
      nextCursor: null,
    });

    await user.click(loadMoreButton);

    // Button should show loading text
    expect(screen.getByText('Loading...')).not.toBeNull();
  });

  it('filters events by severity', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    // Change severity filter to "low"
    const severitySelect = screen.getByLabelText('Severity');
    await user.click(severitySelect);
    await user.click(screen.getByText('Low'));

    // Should refetch with new filters
    expect(mockGetUserTimeline).toHaveBeenLastCalledWith(
      mockUserId,
      expect.objectContaining({ severity: 'low' }),
      undefined
    );
  });

  it('filters events by domain', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserTimeline userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).not.toBeNull();
    });

    // Change domain filter to "generation"
    const domainSelect = screen.getByLabelText('Domain');
    await user.click(domainSelect);
    await user.click(screen.getByText('Generation'));

    // Should refetch with new filters
    expect(mockGetUserTimeline).toHaveBeenLastCalledWith(
      mockUserId,
      expect.objectContaining({ domain: 'generation' }),
      undefined
    );
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUserTimeline.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<UserTimeline userId={mockUserId} />);

    // Should not crash and should log error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Error')
      );
    });

    consoleSpy.mockRestore();
  });
});