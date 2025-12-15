import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useImageFeedback } from '../use-image-feedback';

// Mock toast
mock.module('sonner', () => ({
  toast: {
    custom: mock(() => {}),
    error: mock(() => {}),
  },
}));

// Mock components
const mockPositiveFeedbackToast = mock(() => null);
mock.module('@/components/feedback/positive-feedback-toast', () => ({
  PositiveFeedbackToast: mockPositiveFeedbackToast,
}));

// Mock fetch
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve(null),
})) as any;
global.fetch = mockFetch;

// Create query client wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const TestProvider = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
}

describe('useImageFeedback', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockPositiveFeedbackToast.mockClear();
  });

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentFeedback).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.showNegativeModal).toBe(false);
      expect(result.current.selectedPositiveReasons).toEqual([]);
      expect(result.current.submissionError).toBeNull();
      expect(result.current.isError).toBe(false);
    });
  });

  describe('handleThumbsUp', () => {
    it('submits positive feedback and shows toast on success', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'feedback-123' }),
      }));

      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.handleThumbsUp();

      expect(result.current.isSubmitting).toBe(true);

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/images/test-image/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: 'test-image',
          feedbackType: 'positive',
          reasons: [],
        }),
      });
    });

    it('shows error toast on submission failure', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      }));

      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.handleThumbsUp();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.submissionError).toBeInstanceOf(Error);
    });
  });

  describe('handleThumbsDown', () => {
    it('opens negative feedback modal', () => {
      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.handleThumbsDown();

      expect(result.current.showNegativeModal).toBe(true);
    });
  });

  describe('handleNegativeSubmit', () => {
    it('submits negative feedback and closes modal on success', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'feedback-456' }),
      }));

      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.setShowNegativeModal(true);
      expect(result.current.showNegativeModal).toBe(true);

      await result.current.handleNegativeSubmit(['quality_issues'], 'Poor quality');

      expect(result.current.showNegativeModal).toBe(false);

      expect(mockFetch).toHaveBeenCalledWith('/api/images/test-image/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: 'test-image',
          feedbackType: 'negative',
          reasons: ['quality_issues'],
          comment: 'Poor quality',
        }),
      });
    });

    it('keeps modal open on submission failure', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      }));

      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.setShowNegativeModal(true);
      expect(result.current.showNegativeModal).toBe(true);

      await result.current.handleNegativeSubmit(['quality_issues'], 'Poor quality');

      // Modal should still be open on error
      expect(result.current.showNegativeModal).toBe(true);
      expect(result.current.isError).toBe(true);
    });
  });

  describe('handlePositiveDismiss', () => {
    it('submits feedback with selected reasons and clears state', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'feedback-789' }),
      }));

      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      // Add some positive reasons
      result.current.togglePositiveReason('great_quality');
      result.current.togglePositiveReason('fast');
      expect(result.current.selectedPositiveReasons).toEqual(['great_quality', 'fast']);

      result.current.handlePositiveDismiss();

      await waitFor(() => {
        expect(result.current.selectedPositiveReasons).toEqual([]);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/images/test-image/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: 'test-image',
          feedbackType: 'positive',
          reasons: ['great_quality', 'fast'],
        }),
      });
    });

    it('clears state immediately when no reasons selected', () => {
      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.handlePositiveDismiss();

      expect(result.current.selectedPositiveReasons).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('togglePositiveReason', () => {
    it('adds reason when not selected', () => {
      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.togglePositiveReason('great_quality');

      expect(result.current.selectedPositiveReasons).toEqual(['great_quality']);
    });

    it('removes reason when already selected', () => {
      const { result } = renderHook(() => useImageFeedback({ imageId: 'test-image' }), {
        wrapper: createWrapper(),
      });

      result.current.togglePositiveReason('great_quality');
      expect(result.current.selectedPositiveReasons).toEqual(['great_quality']);

      result.current.togglePositiveReason('great_quality');
      expect(result.current.selectedPositiveReasons).toEqual([]);
    });
  });
});