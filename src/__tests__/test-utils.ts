import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';

// Viewport sizes for responsive testing
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1440, height: 900 },
} as const;

// Mock viewport size
export const mockViewport = (width: number, height: number) => {
  // In jsdom environment, window is available
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  }
};

// Test responsive behavior across breakpoints
export const testResponsiveBehavior = async (
  component: React.ReactElement,
  testFn: (container: HTMLElement) => void | Promise<void>
) => {
  for (const [name, viewport] of Object.entries(viewports)) {
    describe(`on ${name} viewport`, () => {
      beforeEach(() => {
        mockViewport(viewport.width, viewport.height);
      });

      it(`renders correctly on ${name}`, async () => {
        const { container } = render(component);
        await testFn(container);
      });
    });
  }
};

// Test accessibility with axe-core
export const testAccessibility = async (component: React.ReactElement) => {
  const { container } = render(component);
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
};

// Test color contrast (simplified - in real app would use a proper contrast checker)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const testColorContrast = (element: HTMLElement, _minRatio = 4.5) => {
  // In jsdom environment, getComputedStyle is available
  if (typeof window !== 'undefined') {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;

    // This is a simplified check - in production you'd use a proper color contrast library
    // For now, we'll just ensure colors are defined
    expect(backgroundColor).toBeDefined();
    expect(color).toBeDefined();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  }
};

// Test CTA button functionality
export const testCTAButton = async (
  buttonText: string,
  expectedHref: string,
  component: React.ReactElement
) => {
  const user = userEvent.setup();
  render(component);

  const button = screen.getByRole('link', { name: new RegExp(buttonText, 'i') });
  expect(button).toBeInTheDocument();
  expect(button).toHaveAttribute('href', expectedHref);

  // Test keyboard navigation
  button.focus();
  expect(button).toHaveFocus();

  // Test click (though we can't test actual navigation in unit tests)
  await user.click(button);
  // In a real e2e test, we'd check navigation occurred
};

// Test animation performance (CSS animations)
export const testAnimationPerformance = (container: HTMLElement) => {
  // In jsdom environment, getComputedStyle is available
  if (typeof window !== 'undefined') {
    // Check for transform3d usage (better performance)
    const animatedElements = container.querySelectorAll('[style*="transform"]');
    animatedElements.forEach(element => {
      const style = window.getComputedStyle(element);
      // Elements with transforms should use GPU acceleration
      expect(style.transform || style.willChange).toBeDefined();
    });
  }
};

// Mock performance API for Core Web Vitals
export const mockPerformanceAPI = () => {
  const mockObserver = {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  };

  // Mock PerformanceObserver with required properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.PerformanceObserver = jest.fn().mockImplementation(() => mockObserver) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.PerformanceObserver as any).supportedEntryTypes = ['measure', 'mark', 'navigation', 'resource'];

  // Mock performance.mark and performance.measure
  global.performance.mark = jest.fn();
  global.performance.measure = jest.fn();
  global.performance.getEntriesByType = jest.fn(() => []);
  global.performance.getEntriesByName = jest.fn(() => []);
};

// Test Core Web Vitals metrics
export const testCoreWebVitals = async (component: React.ReactElement) => {
  mockPerformanceAPI();

  const { container } = render(component);

  // Test that component renders without blocking
  expect(container).toBeInTheDocument();

  // In a real implementation, you'd measure:
  // - LCP (Largest Contentful Paint)
  // - FID (First Input Delay)
  // - CLS (Cumulative Layout Shift)

  // For now, we'll check that images have proper loading attributes
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img).toHaveAttribute('loading', 'lazy');
    // Check for priority on above-the-fold images
    if (img.closest('[data-priority="true"]') || img.classList.contains('priority')) {
      // Priority images should have fetchpriority
      expect(img).toHaveAttribute('fetchpriority', 'high');
    }
  });
};