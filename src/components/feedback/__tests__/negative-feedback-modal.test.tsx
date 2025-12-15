import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NegativeFeedbackModal } from '../negative-feedback-modal';

describe('NegativeFeedbackModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: mock(() => {}),
    onSubmit: mock(() => {}),
    isSubmitting: false,
  };

  it('renders modal when open is true', () => {
    render(<NegativeFeedbackModal {...defaultProps} />);

    expect(screen.getByText('Help us improve')).toBeTruthy();
    expect(screen.getByText(/What didn't you like about this image/)).toBeTruthy();
  });

  it('does not render modal when open is false', () => {
    render(<NegativeFeedbackModal {...defaultProps} open={false} />);

    expect(screen.queryByText('Help us improve')).toBeFalsy();
  });

  it('renders all negative feedback reason toggle buttons', () => {
    render(<NegativeFeedbackModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Quality issues' })).toBeTruthy();
    expect(screen.getByRole('button', { name: "Doesn't match my request" })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Product not visible/clear' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Wrong style/aesthetic' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Background problems' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Other' })).toBeTruthy();
  });

  it('shows comment textarea when "Other" is selected', async () => {
    const user = userEvent.setup();
    render(<NegativeFeedbackModal {...defaultProps} />);

    const otherToggle = screen.getByRole('button', { name: 'Other' });
    await user.click(otherToggle);

    expect(screen.getByPlaceholderText("Describe what didn't work for you...")).toBeTruthy();
  });

  it('enables submit button when reasons are selected', async () => {
    const user = userEvent.setup();
    render(<NegativeFeedbackModal {...defaultProps} />);

    const qualityToggle = screen.getByRole('button', { name: 'Quality issues' });
    await user.click(qualityToggle);

    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);
  });

  it('disables submit button when no reasons selected', () => {
    render(<NegativeFeedbackModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('disables submit button when "Other" selected but no comment', async () => {
    const user = userEvent.setup();
    render(<NegativeFeedbackModal {...defaultProps} />);

    const otherToggle = screen.getByRole('button', { name: 'Other' });
    await user.click(otherToggle);

    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('enables submit button when "Other" selected and comment provided', async () => {
    const user = userEvent.setup();
    render(<NegativeFeedbackModal {...defaultProps} />);

    const otherToggle = screen.getByRole('button', { name: 'Other' });
    await user.click(otherToggle);

    const commentTextarea = screen.getByPlaceholderText("Describe what didn't work for you...");
    await user.type(commentTextarea, 'Test comment');

    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);
  });

  it('calls onSubmit with selected reasons and comment', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = mock(() => {});
    render(<NegativeFeedbackModal {...defaultProps} onSubmit={mockOnSubmit} />);

    // Select reasons
    const qualityToggle = screen.getByRole('button', { name: 'Quality issues' });
    const otherToggle = screen.getByRole('button', { name: 'Other' });
    await user.click(qualityToggle);
    await user.click(otherToggle);

    // Add comment
    const commentTextarea = screen.getByPlaceholderText("Describe what didn't work for you...");
    await user.type(commentTextarea, 'Test comment');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(['quality_issues', 'other'], 'Test comment');
  });

  it('calls onOpenChange with false when Cancel button clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = mock(() => {});
    render(<NegativeFeedbackModal {...defaultProps} onOpenChange={mockOnOpenChange} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows submitting state when isSubmitting is true', () => {
    render(<NegativeFeedbackModal {...defaultProps} isSubmitting={true} />);

    const submitButton = screen.getByRole('button', { name: 'Submitting...' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement;
    expect(cancelButton.disabled).toBe(true);
  });


});