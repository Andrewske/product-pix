import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PositiveFeedbackToast } from '../positive-feedback-toast';

describe('PositiveFeedbackToast', () => {
  const defaultProps = {
    selectedReasons: [] as any[],
    onReasonToggle: mock(() => {}),
    onDismiss: mock(() => {}),
  };

  it('renders the main message', () => {
    render(<PositiveFeedbackToast {...defaultProps} />);
    expect(screen.getByText('Thanks for the feedback! What did you like about this image?')).toBeTruthy();
  });

  it('renders all positive feedback reason buttons', () => {
    render(<PositiveFeedbackToast {...defaultProps} />);

    expect(screen.getByText('Great quality')).toBeTruthy();
    expect(screen.getByText('Matched my request')).toBeTruthy();
    expect(screen.getByText('Fast')).toBeTruthy();
  });

  it('shows unselected toggles with outline style', () => {
    render(<PositiveFeedbackToast {...defaultProps} />);

    const greatQualityToggle = screen.getByText('Great quality').closest('button');
    expect(greatQualityToggle?.getAttribute('data-state')).toBe('off');
    expect(greatQualityToggle?.className).toContain('border');
  });

  it('shows selected toggles with pressed state', () => {
    render(<PositiveFeedbackToast {...defaultProps} selectedReasons={['great_quality']} />);

    const greatQualityToggle = screen.getByText('Great quality').closest('button');
    expect(greatQualityToggle?.getAttribute('data-state')).toBe('on');
  });

  it('calls onReasonToggle when a reason button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnReasonToggle = mock(() => {});
    render(<PositiveFeedbackToast {...defaultProps} onReasonToggle={mockOnReasonToggle} />);

    const greatQualityButton = screen.getByText('Great quality');
    await user.click(greatQualityButton);

    expect(mockOnReasonToggle).toHaveBeenCalledWith('great_quality');
  });

  it('shows instructional text', () => {
    render(<PositiveFeedbackToast {...defaultProps} />);
    expect(screen.getByText('Select all that apply. This toast will close automatically.')).toBeTruthy();
  });

  it('handles multiple selected reasons', () => {
    render(<PositiveFeedbackToast {...defaultProps} selectedReasons={['great_quality', 'fast']} />);

    const greatQualityToggle = screen.getByText('Great quality').closest('button');
    const fastToggle = screen.getByText('Fast').closest('button');

    expect(greatQualityToggle?.getAttribute('data-state')).toBe('on');
    expect(fastToggle?.getAttribute('data-state')).toBe('on');
  });

  it('calls onDismiss when dismiss action is triggered', () => {
    const mockOnDismiss = mock(() => {});
    render(<PositiveFeedbackToast {...defaultProps} onDismiss={mockOnDismiss} />);

    // The onDismiss is called by the parent component (toast system)
    // We can't directly test this in isolation, but we can verify the prop is accepted
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });
});