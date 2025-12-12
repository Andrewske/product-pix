import { expect } from 'bun:test';
import { render } from '@testing-library/react';
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



// Test accessibility with axe-core
export const testAccessibility = async (component: React.ReactElement) => {
  const { container } = render(component);
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
};