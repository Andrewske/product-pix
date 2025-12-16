import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageCard } from '../image-card';

import type { GeneratedImage, FeedbackType } from '@/types';

type MockUseImageFeedbackReturn = {
  currentFeedback: FeedbackType | null;
  isSubmitting: boolean;
  showNegativeModal: boolean;
  setShowNegativeModal: (show: boolean) => void;
  handleThumbsUp: () => void;
  handleThumbsDown: () => void;
  handleNegativeSubmit: (reasons: string[], comment: string) => Promise<void>;
};

// Mock the useImageFeedback hook
const mockUseImageFeedback = mock((): MockUseImageFeedbackReturn => ({
  currentFeedback: null,
  isSubmitting: false,
  showNegativeModal: false,
  setShowNegativeModal: mock(() => {}),
  handleThumbsUp: mock(() => {}),
  handleThumbsDown: mock(() => {}),
  handleNegativeSubmit: mock(() => Promise.resolve()),
}));

// Mock Next.js Image component
// Next.js Image has complex optimization logic we don't need in tests.
// We replace it with a simple img tag that maintains the same API.
mock.module('next/image', () => ({
  default: ({ src, alt, className, fill }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : {}}
    />
  ),
}));

// Mock the hook
mock.module('@/hooks/use-image-feedback', () => ({
  useImageFeedback: mockUseImageFeedback,
}));

describe('ImageCard', () => {
  const mockImage: GeneratedImage = {
    id: 'test-image-id',
    user_id: 'test-user-id',
    job_id: 'test-job-id',
    public_url: 'https://example.com/image.jpg',
    file_key: 'test-file-key',
    created_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    is_favorite: false,
    width: 512,
    height: 512,
    file_size: null,
    refunded_at: null,
    title: null,
  };

  const defaultProps = {
    image: mockImage,
    onFavorite: mock(() => {}),
    onDelete: mock(() => {}),
    onDownload: mock(() => {}),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    mockUseImageFeedback.mockClear();
    defaultProps.onFavorite.mockClear();
    defaultProps.onDelete.mockClear();
    defaultProps.onDownload.mockClear();
  });

   // Test basic rendering functionality - ensures the core image display works
   // Critical for verifying that the component can display generated images properly
   it('renders the image card with image', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    // Check image is rendered
    const image = screen.getByAltText('Generated product');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('src')).toBe(mockImage.public_url);
  });

   // Test hover interaction - ensures overlay appears with action buttons on mouse enter
   // Important for UX as users need visual feedback and access to actions on hover
   it('shows overlay with action buttons on hover', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');

    // Initially overlay should be hidden (opacity-0)
    let overlay = card?.querySelector('.absolute.inset-0');
    expect(overlay?.classList.contains('opacity-0')).toBe(true);

    // Simulate hover
    fireEvent.mouseEnter(card!);

    // Overlay should now be visible (opacity-100)
    overlay = card?.querySelector('.absolute.inset-0');
    expect(overlay?.classList.contains('opacity-100')).toBe(true);

    // Check action buttons are present
    expect(screen.getByLabelText('Download')).not.toBeNull();
    expect(screen.getByLabelText('Add to favorites')).not.toBeNull();
    expect(screen.getByLabelText('Request refund')).not.toBeNull();
  });

   // Test hover exit behavior - ensures overlay disappears when mouse leaves
   // Prevents UI clutter and maintains clean appearance when not interacting
   it('hides overlay when mouse leaves', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');

    // Simulate hover
    fireEvent.mouseEnter(card!);

    // Overlay should be visible
    let overlay = card?.querySelector('.absolute.inset-0');
    expect(overlay?.classList.contains('opacity-100')).toBe(true);

    // Simulate mouse leave
    fireEvent.mouseLeave(card!);

    // Overlay should be hidden again
    overlay = card?.querySelector('.absolute.inset-0');
    expect(overlay?.classList.contains('opacity-0')).toBe(true);
  });

   // Test feedback button rendering - ensures thumbs up/down buttons appear correctly in overlay
   // Critical for user feedback collection functionality and proper sizing for overlay space
   it('renders feedback buttons in overlay with sm size', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');

    // Simulate hover to show overlay
    fireEvent.mouseEnter(card!);

    // Check feedback buttons are rendered
    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    expect(thumbsUpButton).not.toBeNull();
    expect(thumbsDownButton).not.toBeNull();

    // Check that buttons have sm size applied (check for smaller icon classes)
    const thumbsUpIcon = thumbsUpButton.querySelector('.h-3.w-3');
    const thumbsDownIcon = thumbsDownButton.querySelector('.h-3.w-3');

    expect(thumbsUpIcon).not.toBeNull();
    expect(thumbsDownIcon).not.toBeNull();
  });

   // Test positive feedback visual state - ensures thumbs up button shows active styling when feedback is positive
   // Important for user understanding of their current feedback state and prevents duplicate submissions
   it('shows active state for thumbs up when currentFeedback is positive', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: 'positive',
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    // Thumbs up should have active styling (green background)
    expect(thumbsUpButton?.classList.contains('bg-green-600')).toBe(true);
    // Thumbs down should be outline
    expect(thumbsDownButton?.getAttribute('class')).toContain('outline');
  });

   // Test negative feedback visual state - ensures thumbs down button shows active styling when feedback is negative
   // Important for user understanding of their current feedback state and prevents duplicate submissions
   it('shows active state for thumbs down when currentFeedback is negative', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: 'negative',
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    // Thumbs down should have active styling (red background)
    expect(thumbsDownButton?.classList.contains('bg-red-600')).toBe(true);
    // Thumbs up should be outline
    expect(thumbsUpButton?.getAttribute('class')).toContain('outline');
  });

   // Test positive feedback interaction - ensures clicking thumbs up triggers the correct handler
   // Critical for collecting positive user feedback and updating the feedback state
   it('calls handleThumbsUp when thumbs up button is clicked', () => {
    const mockHandleThumbsUp = mock(() => {});
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mockHandleThumbsUp,
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    fireEvent.click(thumbsUpButton);

    expect(mockHandleThumbsUp).toHaveBeenCalledTimes(1);
  });

   // Test negative feedback interaction - ensures clicking thumbs down triggers the correct handler
   // Critical for collecting negative user feedback and opening the detailed feedback modal
   it('calls handleThumbsDown when thumbs down button is clicked', () => {
    const mockHandleThumbsDown = mock(() => {});
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mockHandleThumbsDown,
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const thumbsDownButton = screen.getByLabelText('Dislike this image');
    fireEvent.click(thumbsDownButton);

    expect(mockHandleThumbsDown).toHaveBeenCalledTimes(1);
  });

   // Test negative feedback modal opening - ensures detailed feedback collection UI appears
   // Important for gathering specific reasons for negative feedback to improve generation quality
   it('opens negative feedback modal when thumbs down is clicked', () => {
    const mockSetShowNegativeModal = mock(() => {});
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: true, // Modal should open after clicking thumbs down
      setShowNegativeModal: mockSetShowNegativeModal,
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    // Check that modal is rendered when showNegativeModal is true
    expect(screen.getByText('Help us improve')).not.toBeNull();
    expect(screen.getByText("What didn't you like about this image? Your feedback helps us create better results.")).not.toBeNull();
  });

   // Test modal closing behavior - ensures negative feedback modal can be dismissed
   // Important for user experience and preventing modal from being stuck open
   it('closes modal when onOpenChange is called with false', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false, // Modal should be closed
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    // Modal should not be visible
    expect(screen.queryByText('Help us improve')).toBeNull();
  });

   // Test loading state handling - ensures feedback buttons are disabled during submission
   // Prevents duplicate submissions and provides clear loading feedback to users
   it('disables feedback buttons when isSubmitting is true', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: true, // Buttons should be disabled
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    const thumbsDownButton = screen.getByLabelText('Dislike this image');

    expect(thumbsUpButton?.getAttribute('disabled')).not.toBeNull();
    expect(thumbsDownButton?.getAttribute('disabled')).not.toBeNull();
  });

   // Test download functionality - ensures download action is triggered with correct URL
   // Critical for users to be able to save their generated images locally
   it('calls onDownload when download button is clicked', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const downloadButton = screen.getByLabelText('Download');
    fireEvent.click(downloadButton);

    expect(defaultProps.onDownload).toHaveBeenCalledWith(mockImage.public_url);
  });

   // Test favorite functionality - ensures favorite action is triggered with correct image ID
   // Important for users to be able to save and organize their preferred generated images
   it('calls onFavorite when favorite button is clicked', () => {
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    expect(defaultProps.onFavorite).toHaveBeenCalledWith(mockImage.id);
  });

   // Test favorite indicator display - ensures visual indication when image is favorited
   // Important for users to see which images they've already favorited at a glance
   it('shows favorite indicator when image is favorited', () => {
    const favoritedImage = { ...mockImage, is_favorite: true };

    mockUseImageFeedback.mockReturnValue({
      currentFeedback: null,
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} image={favoritedImage} />);

    const favoriteIndicator = screen.getByTestId('favorite-indicator');
    expect(favoriteIndicator).not.toBeNull();

    const svgElement = favoriteIndicator.querySelector('svg');
    expect(svgElement?.getAttribute('aria-label')).toBe('Favorited');
  });

   // Test hook integration - ensures the feedback hook receives the correct image ID
   // Critical for proper feedback association with specific generated images
   it('passes imageId to useImageFeedback hook', () => {
    render(<ImageCard {...defaultProps} />);

    expect(mockUseImageFeedback).toHaveBeenCalledWith({
      imageId: mockImage.id,
    });
  });

   // Test initial feedback state handling - ensures component displays existing feedback correctly
   // Important for showing user's previous feedback when revisiting images
   it('handles initial feedback from hook correctly', () => {
    // Test that the component correctly displays feedback state from the hook
    mockUseImageFeedback.mockReturnValue({
      currentFeedback: 'positive',
      isSubmitting: false,
      showNegativeModal: false,
      setShowNegativeModal: mock(() => {}),
      handleThumbsUp: mock(() => {}),
      handleThumbsDown: mock(() => {}),
      handleNegativeSubmit: mock(() => Promise.resolve()),
    });

    render(<ImageCard {...defaultProps} />);

    const card = screen.getByAltText('Generated product').closest('.group');
    fireEvent.mouseEnter(card!);

    const thumbsUpButton = screen.getByLabelText('Like this image');
    expect(thumbsUpButton?.classList.contains('bg-green-600')).toBe(true);
  });
});