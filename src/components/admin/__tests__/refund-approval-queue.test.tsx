import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefundApprovalQueue } from '../refund-approval-queue';
import { logger } from '@/lib/logging';

// Mock fetch
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ refunds: [] }),
}));

global.fetch = mockFetch;

describe('RefundApprovalQueue', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ refunds: [] }),
    });
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('fetches pending requests on mount', async () => {
    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/refunds/image');
    });
  });

  it('displays loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RefundApprovalQueue />);

    // Should show skeleton loading cards
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays empty state when no requests', async () => {
    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(screen.getByText('No pending refund requests')).toBeDefined();
    });
  });

  it('displays refund requests correctly', async () => {
    const mockRequests = [
      {
        id: 'refund-1',
        reason: 'poor_quality',
        feedback: 'Image is blurry',
        requested_at: '2024-01-01T10:00:00Z',
        credits_refunded: 50,
        users: {
          email: 'user@example.com',
          display_name: 'John Doe',
        },
        generated_images: {
          public_url: 'https://example.com/image.jpg',
          title: 'Product Image',
        },
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ refunds: mockRequests }),
    });

    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('user@example.com')).toBeDefined();
      expect(screen.getByText('Poor Quality')).toBeDefined();
      expect(screen.getByText(/Image is blurry/)).toBeDefined();
      expect(screen.getByRole('button', { name: 'Approve Refund' })).toBeDefined();
    });
  });

  it('calls approve API when approve button is clicked', async () => {
    const user = userEvent.setup();
    const mockRequests = [
      {
        id: 'refund-1',
        reason: 'poor_quality',
        feedback: 'Image is blurry',
        requested_at: '2024-01-01T10:00:00Z',
        credits_refunded: 50,
        users: {
          email: 'user@example.com',
          display_name: 'John Doe',
        },
        generated_images: {
          public_url: 'https://example.com/image.jpg',
          title: 'Product Image',
        },
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ refunds: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve Refund' })).toBeDefined();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve Refund' });
    await user.click(approveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/refunds/image/refund-1/approve', {
        method: 'POST',
      });
    });
  });

  it('removes request from list after successful approval', async () => {
    const user = userEvent.setup();
    const mockRequests = [
      {
        id: 'refund-1',
        reason: 'poor_quality',
        feedback: 'Image is blurry',
        requested_at: '2024-01-01T10:00:00Z',
        credits_refunded: 50,
        users: {
          email: 'user@example.com',
          display_name: 'John Doe',
        },
        generated_images: {
          public_url: 'https://example.com/image.jpg',
          title: 'Product Image',
        },
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ refunds: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve Refund' });
    await user.click(approveButton);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).toBeNull();
    });
  });

  it('shows error toast when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Properly save and restore logger.error
    const originalLoggerError = logger.error;
    const loggerSpy = mock(() => {});
    logger.error = loggerSpy;

    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith('Error fetching pending requests', { error: expect.any(Error) });
    });

    // Properly restore
    logger.error = originalLoggerError;
  });

  it('shows error toast when approve fails', async () => {
    const user = userEvent.setup();
    const mockRequests = [
      {
        id: 'refund-1',
        reason: 'poor_quality',
        feedback: 'Image is blurry',
        requested_at: '2024-01-01T10:00:00Z',
        credits_refunded: 50,
        users: {
          email: 'user@example.com',
          display_name: 'John Doe',
        },
        generated_images: {
          public_url: 'https://example.com/image.jpg',
          title: 'Product Image',
        },
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ refunds: mockRequests }),
      })
      .mockRejectedValueOnce(new Error('Approve failed'));

    // Properly save and restore logger.error
    const originalLoggerError = logger.error;
    const loggerSpy = mock(() => {});
    logger.error = loggerSpy;

    render(<RefundApprovalQueue />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve Refund' })).toBeDefined();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve Refund' });
    await user.click(approveButton);

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith('Error approving refund', { error: expect.any(Error), refundId: 'refund-1' });
    });

    // Properly restore
    logger.error = originalLoggerError;
  });
});