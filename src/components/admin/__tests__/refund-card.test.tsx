import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefundCard } from '../refund-card';
import type { PendingRefundWithDetails } from '@/types';

describe('RefundCard', () => {
  const mockRequest: PendingRefundWithDetails = {
    id: 'refund-1',
    reason: 'poor_quality',
    feedback: 'Image is blurry',
    requested_at: '2024-01-01T10:00:00Z',
    credits_refunded: 50,
    user_id: 'user-1',
    image_id: 'image-1',
    status: 'pending_admin',
    users: {
      email: 'user@example.com',
      display_name: 'John Doe',
    },
    generated_images: {
      public_url: 'https://example.com/image.jpg',
      title: 'Product Image',
    },
  };

  it('renders user information', () => {
    const mockOnApprove = mock(async () => {});
    render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('user@example.com')).toBeDefined();
  });

  it('renders reason badge', () => {
    const mockOnApprove = mock(async () => {});
    render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

    expect(screen.getByText('Poor Quality')).toBeDefined();
  });

  it('renders feedback if provided', () => {
    const mockOnApprove = mock(async () => {});
    render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

    expect(screen.getByText(/Image is blurry/)).toBeDefined();
  });

  it('calls onApprove when button clicked', async () => {
    const user = userEvent.setup();
    const mockOnApprove = mock(async () => {});
    render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

    const button = screen.getByRole('button', { name: 'Approve Refund' });
    await user.click(button);

    expect(mockOnApprove).toHaveBeenCalledWith('refund-1');
  });

  it('disables button when processing', () => {
    const mockOnApprove = mock(async () => {});
    render(<RefundCard request={mockRequest} isProcessing={true} onApprove={mockOnApprove} />);

    const button = screen.getByRole('button', { name: 'Approving...' });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('renders image with correct alt text', () => {
    const mockOnApprove = mock(async () => {});
    const { container } = render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Product Image');
  });
});