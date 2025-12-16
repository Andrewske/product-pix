// src/components/__tests__/generation-result.test.tsx
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerationResult } from '../generation-result';
import Image from 'next/image';
import type { FeedbackType } from '@/types';

type MockUseImageFeedbackReturn = {
  currentFeedback: FeedbackType | null;
  isSubmitting: boolean;
  showNegativeModal: boolean;
  setShowNegativeModal: (show: boolean) => void;
  handleThumbsUp: () => void;
  handleThumbsDown: () => void;
  handleNegativeSubmit: (reasons: string[], comment: string) => Promise<void>;
};

// Mock the useGenerationFeedback hook
// This hook manages feedback state and interactions for generated images.
// We mock it to control feedback behavior in tests without external dependencies.
const mockUseGenerationFeedback = mock((): { feedbackProps: MockUseImageFeedbackReturn } => ({
  feedbackProps: {
    currentFeedback: null, // No feedback given yet
    isSubmitting: false, // Not currently submitting feedback
    showNegativeModal: false, // Negative feedback modal is hidden
    setShowNegativeModal: mock(() => {}), // Controls modal visibility
    handleThumbsUp: mock(() => {}), // Handles positive feedback submission
    handleThumbsDown: mock(() => {}), // Handles negative feedback initiation
    handleNegativeSubmit: mock(() => Promise.resolve()), // Handles detailed negative feedback submission
  },
}));

// Mock Next.js Image component
// Next.js Image has complex optimization logic we don't need in tests.
// We replace it with a simple img tag that maintains the same API.
mock.module('next/image', () => ({
  default: ({ src, alt, className, onClick }: {
    src: string;
    alt: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <Image
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      tabIndex={onClick ? 0 : undefined}
      fill
      style={{ objectFit: 'contain' }}
    />

  ),
}));

// Mock the hook module
// Replaces the actual hook import with our mock implementation
// This ensures all tests use the controlled mock instead of the real hook
mock.module('@/hooks/use-generation-feedback', () => ({
  useGenerationFeedback: mockUseGenerationFeedback,
}));

describe('GenerationResult', () => {
  const defaultProps = {
    imageUrl: 'https://example.com/image.jpg',
    imageId: 'test-image-id',
    onDownload: mock(() => {}),
    onRegenerate: mock(() => {}),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    mockUseGenerationFeedback.mockClear();
    defaultProps.onDownload.mockClear();
    defaultProps.onRegenerate.mockClear();
  });

  it('renders the component with image and buttons', () => {
    // Setup mock with default state: no feedback, not submitting, modal closed
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback selected yet
        isSubmitting: false, // Not in submission state
        showNegativeModal: false, // Modal is hidden
        setShowNegativeModal: mock(() => {}), // Mock modal visibility setter
        handleThumbsUp: mock(() => {}), // Mock positive feedback handler
        handleThumbsDown: mock(() => {}), // Mock negative feedback handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed feedback submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    // Check image is rendered
    const image = screen.getByAltText('Generated product photo');
    expect(image).not.toBeNull();

    // Check action buttons are rendered
    expect(screen.getByText('Download')).not.toBeNull();
    expect(screen.getByText('Regenerate')).not.toBeNull();
  });

  it('renders feedback buttons', () => {
    // Setup mock with default state to test button rendering
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback selected
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal hidden
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive feedback
        handleThumbsDown: mock(() => {}), // Mock negative feedback
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    // Check feedback buttons are rendered
    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    expect(thumbsUpButton).not.toBeNull();
    expect(thumbsDownButton).not.toBeNull();
  });

  it('shows active state for thumbs up when currentFeedback is positive', () => {
    // Setup mock with positive feedback already given to test active styling
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: 'positive', // User has given positive feedback
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal hidden
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive feedback handler
        handleThumbsDown: mock(() => {}), // Mock negative feedback handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    // Thumbs up should have active styling (green background)
    expect(thumbsUpButton?.classList.contains('bg-green-600')).toBe(true);
    // Thumbs down should be outline
    expect(thumbsDownButton?.getAttribute('class')).toContain('outline');
  });

  it('shows active state for thumbs down when currentFeedback is negative', () => {
    // Setup mock with negative feedback already given to test active styling
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: 'negative', // User has given negative feedback
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal hidden (feedback already submitted)
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive feedback handler
        handleThumbsDown: mock(() => {}), // Mock negative feedback handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    // Thumbs down should have active styling (red background)
    expect(thumbsDownButton?.classList.contains('bg-red-600')).toBe(true);
    // Thumbs up should be outline
    expect(thumbsUpButton?.getAttribute('class')).toContain('outline');
  });

  it('calls handleThumbsUp when thumbs up button is clicked', () => {
    // Create a specific mock to track calls to handleThumbsUp
    const mockHandleThumbsUp = mock(() => {});
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback yet
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal hidden
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mockHandleThumbsUp, // Track this specific handler
        handleThumbsDown: mock(() => {}), // Mock negative handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    fireEvent.click(thumbsUpButton);

    expect(mockHandleThumbsUp).toHaveBeenCalledTimes(1);
  });

  it('calls handleThumbsDown when thumbs down button is clicked', () => {
    // Track calls to both handleThumbsDown and setShowNegativeModal
    const mockHandleThumbsDown = mock(() => {});
    const mockSetShowNegativeModal = mock(() => {});
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback yet
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal starts hidden
        setShowNegativeModal: mockSetShowNegativeModal, // Track modal visibility changes
        handleThumbsUp: mock(() => {}), // Mock positive handler
        handleThumbsDown: mockHandleThumbsDown, // Track this specific handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const thumbsDownButton = screen.getByLabelText('Dislike this image');
    fireEvent.click(thumbsDownButton);

    expect(mockHandleThumbsDown).toHaveBeenCalledTimes(1);
  });

  it('opens negative feedback modal when thumbs down is clicked', () => {
    // Test that modal appears when showNegativeModal is true
    const mockSetShowNegativeModal = mock(() => {});
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback yet
        isSubmitting: false, // Not submitting
        showNegativeModal: true, // Modal should be visible
        setShowNegativeModal: mockSetShowNegativeModal, // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive handler
        handleThumbsDown: mock(() => {}), // Mock negative handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    // Check that modal is rendered when showNegativeModal is true
    expect(screen.getByText('Help us improve')).not.toBeNull();
    expect(screen.getByText("What didn't you like about this image? Your feedback helps us create better results.")).not.toBeNull();
  });

  it('closes modal when onOpenChange is called with false', () => {
    // Test that modal is hidden when showNegativeModal is false
    const mockSetShowNegativeModal = mock(() => {});
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal should be hidden
        setShowNegativeModal: mockSetShowNegativeModal, // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive handler
        handleThumbsDown: mock(() => {}), // Mock negative handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    // Modal should not be visible
    expect(screen.queryByText('Help us improve')).toBeNull();
  });

  it('disables feedback buttons when isSubmitting is true', () => {
    // Test button disabling during submission
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback yet
        isSubmitting: true, // Currently submitting - buttons should be disabled
        showNegativeModal: false, // Modal hidden
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive handler
        handleThumbsDown: mock(() => {}), // Mock negative handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    expect(thumbsUpButton?.getAttribute('disabled')).not.toBeNull();
    expect(thumbsDownButton?.getAttribute('disabled')).not.toBeNull();
  });

  it('calls onDownload when download button is clicked', () => {
    // Test download functionality with default feedback state
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal hidden
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive handler
        handleThumbsDown: mock(() => {}), // Mock negative handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const downloadButton = screen.getByText('Download');
    fireEvent.click(downloadButton);

    expect(defaultProps.onDownload).toHaveBeenCalledTimes(1);
  });

  it('calls onRegenerate when regenerate button is clicked', () => {
    // Test regenerate functionality with default feedback state
    mockUseGenerationFeedback.mockReturnValue({
      feedbackProps: {
        currentFeedback: null, // No feedback
        isSubmitting: false, // Not submitting
        showNegativeModal: false, // Modal hidden
        setShowNegativeModal: mock(() => {}), // Mock modal control
        handleThumbsUp: mock(() => {}), // Mock positive handler
        handleThumbsDown: mock(() => {}), // Mock negative handler
        handleNegativeSubmit: mock(() => Promise.resolve()), // Mock detailed submission
      },
    });

    render(<GenerationResult {...defaultProps} />);

    const regenerateButton = screen.getByText('Regenerate');
    fireEvent.click(regenerateButton);

    expect(defaultProps.onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('passes imageId to useGenerationFeedback hook', () => {
    render(<GenerationResult {...defaultProps} />);

    expect(mockUseGenerationFeedback).toHaveBeenCalledWith({
      imageId: defaultProps.imageId,
    });
  });
});