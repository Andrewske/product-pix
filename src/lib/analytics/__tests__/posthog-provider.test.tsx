import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { render } from '@testing-library/react';
import { PostHogProvider, usePostHogInit, usePageviewTracking } from '../posthog-provider';

// Mock PostHog
const mockPostHog = {
  init: mock(() => {}),
  debug: mock(() => {}),
  capture: mock(() => {}),
  __loaded: true,
};

mock.module('posthog-js', () => ({
  default: mockPostHog,
}));

// Mock Next.js hooks
const mockUsePathname = mock(() => '/test');
const mockUseSearchParams = mock(() => new URLSearchParams());

mock.module('next/navigation', () => ({
  usePathname: mockUsePathname,
  useSearchParams: mockUseSearchParams,
}));

// Mock environment
mock.module('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
  },
}));

// Mock createClientConfig
mock.module('../config', () => ({
  createClientConfig: mock(() => ({
    api_host: 'https://us.posthog.com',
    loaded: mock(() => {}),
    capture_pageview: false,
    capture_pageleave: true,
    mask_all_inputs: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    person_profiles: 'identified_only',
    session_recording: {
      maskTextSelector: '*',
      maskAllInputs: true,
    },
  })),
}));

describe('PostHog Provider', () => {
  beforeEach(() => {
    // Reset mocks
    mockPostHog.init.mockClear();
    mockPostHog.debug.mockClear();
    mockPostHog.capture.mockClear();
    mockUsePathname.mockClear();
    mockUseSearchParams.mockClear();
  });

  describe('usePostHogInit', () => {
    it('initializes PostHog with correct config', async () => {
      const TestComponent = () => {
        usePostHogInit();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHog.init).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_POSTHOG_KEY!,
        expect.any(Object)
      );
    });

    it('enables debug mode in development', async () => {
      // Mock process.env.NODE_ENV for this test
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });

      const TestComponent = () => {
        usePostHogInit();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHog.debug).toHaveBeenCalled();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });
  });

  describe('usePageviewTracking', () => {
    it('captures pageview on initial mount', async () => {
      const TestComponent = () => {
        usePageviewTracking();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview');
    });

    it('captures pageview on route change', async () => {
      const TestComponent = () => {
        usePageviewTracking();
        return <div>Test</div>;
      };

      const { rerender } = render(<TestComponent />);

      // Wait for initial render
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Simulate route change
      mockUsePathname.mockReturnValue('/new-route');
      rerender(<TestComponent />);

      // Wait for route change effect
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview');
    });
  });

  describe('PostHogProvider', () => {
    it('wraps children without errors', () => {
      expect(() => {
        render(
          <PostHogProvider>
            <div>Test child</div>
          </PostHogProvider>
        );
      }).not.toThrow();
    });
  });
});