import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackButtons } from '../feedback-buttons';

describe('FeedbackButtons', () => {
  it('renders both thumbs up and thumbs down buttons', () => {
    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback={null}
        onThumbsUp={() => {}}
        onThumbsDown={() => {}}
      />
    );

    expect(screen.getByLabelText('Like this image')).toBeTruthy();
    expect(screen.getByLabelText('Dislike this image')).toBeTruthy();
  });

  it('shows positive feedback as selected when currentFeedback is positive', () => {
    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback="positive"
        onThumbsUp={() => {}}
        onThumbsDown={() => {}}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Like this image');
    expect(thumbsUpButton.className).toContain('bg-green-600');
  });

  it('shows negative feedback as selected when currentFeedback is negative', () => {
    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback="negative"
        onThumbsUp={() => {}}
        onThumbsDown={() => {}}
      />
    );

    const thumbsDownButton = screen.getByLabelText('Dislike this image');
    expect(thumbsDownButton.className).toContain('bg-red-600');
  });

  it('calls onThumbsUp when thumbs up button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnThumbsUp = mock(() => {});

    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback={null}
        onThumbsUp={mockOnThumbsUp}
        onThumbsDown={() => {}}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Like this image');
    await user.click(thumbsUpButton);

    expect(mockOnThumbsUp).toHaveBeenCalledTimes(1);
  });

  it('calls onThumbsDown when thumbs down button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnThumbsDown = mock(() => {});

    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback={null}
        onThumbsUp={() => {}}
        onThumbsDown={mockOnThumbsDown}
      />
    );

    const thumbsDownButton = screen.getByLabelText('Dislike this image');
    await user.click(thumbsDownButton);

    expect(mockOnThumbsDown).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state when disabled prop is true', () => {
    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback={null}
        onThumbsUp={() => {}}
        onThumbsDown={() => {}}
        disabled={true}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Like this image') as HTMLButtonElement;
    const thumbsDownButton = screen.getByLabelText('Dislike this image') as HTMLButtonElement;

    expect(thumbsUpButton.disabled).toBe(true);
    expect(thumbsDownButton.disabled).toBe(true);
  });

  it('applies small size when size prop is sm', () => {
    render(
      <FeedbackButtons
        imageId="test-image-id"
        currentFeedback={null}
        onThumbsUp={() => {}}
        onThumbsDown={() => {}}
        size="sm"
      />
    );

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const svgIcon = thumbsUpButton.querySelector('svg');
    expect(svgIcon?.className).toContain('h-3');
    expect(svgIcon?.className).toContain('w-3');
  });
});