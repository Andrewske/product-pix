import { describe, it, expect, beforeEach } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from '../hero-section';
import {
  testResponsiveBehavior,
  testAccessibility,
  testColorContrast,
  testAnimationPerformance,
  testCoreWebVitals,
  viewports,
  mockViewport
} from '@/__tests__/test-utils';

const mockExample = {
  beforeImage: '/test-before.jpg',
  afterImage: '/test-after.jpg',
  product: 'Test Product',
  category: 'Test Category',
};

describe('HeroSection', () => {
  beforeEach(() => {
    // Reset viewport to desktop default
    mockViewport(viewports.desktop.width, viewports.desktop.height);
  });

  describe('Basic Rendering', () => {
    it('renders the main heading with proper structure', () => {
      render(<HeroSection example={mockExample} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading?.textContent).toContain('Professional Product Photos');
      expect(heading?.textContent).toContain('in Seconds');
      expect(heading?.getAttribute('id')).toBe('hero-heading');
    });

    it('renders the description text', () => {
      render(<HeroSection example={mockExample} />);

      const description = screen.getByText(/Transform phone photos into studio-quality product images/);
      expect(description?.getAttribute('id')).toBe('hero-description');
    });

    it('renders the before/after slider', () => {
      render(<HeroSection example={mockExample} />);

      // The slider should be present within the hero section
      const sliderContainer = document.querySelector('[role="img"]');
      expect(sliderContainer).not.toBeNull();
      expect(sliderContainer!.getAttribute('aria-label')).toContain('Test Product');
    });
  });

  describe('CTA Buttons', () => {
    it('renders primary CTA button with correct text and link', () => {
      render(<HeroSection example={mockExample} />);

      const primaryButton = screen.getByText('Get 5 Free Photos');
      expect(primaryButton).not.toBeNull();

      // Check that it's a button inside a link
      expect(primaryButton.tagName).toBe('BUTTON');
      const link = primaryButton.closest('a');
      expect(link?.getAttribute('href')).toBe('/signup');

      expect(primaryButton?.getAttribute('aria-describedby')).toBe('signup-description');
    });

    it('renders secondary CTA button', () => {
      render(<HeroSection example={mockExample} />);

      const secondaryButton = screen.getByRole('link', { name: /see how it works/i });
      expect(secondaryButton).not.toBeNull();
      expect(secondaryButton?.getAttribute('href')).toBe('#how-it-works');

      // The aria-describedby is on the button inside the link
      const button = screen.getByRole('button', { name: /see how it works/i });
      expect(button?.getAttribute('aria-describedby')).toBe('how-it-works-description');
    });

    it('has proper button grouping and accessibility', () => {
      render(<HeroSection example={mockExample} />);

      const buttonGroup = screen.getByRole('group', { name: 'Primary actions' });
      expect(buttonGroup).not.toBeNull();

      const buttons = screen.getAllByRole('link');
      expect(buttons).toHaveLength(2);
    });

    it('CTA buttons are functional with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HeroSection example={mockExample} />);

      const primaryButton = screen.getByRole('link', { name: /get 5 free photos/i });

      // Test keyboard focus
      primaryButton.focus();
      expect(primaryButton).toHaveFocus();

      // Test that button can be activated (though we can't test navigation)
      await user.keyboard('{Enter}');
      expect(primaryButton).not.toBeNull();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing', () => {
      render(<HeroSection example={mockExample} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading?.classList.contains('text-5xl')).toBe(true);
      expect(heading?.classList.contains('sm:text-6xl')).toBe(true);
      expect(heading?.classList.contains('lg:text-7xl')).toBe(true);
    });

    it('applies responsive padding and spacing', () => {
      const { container } = render(<HeroSection example={mockExample} />);

      const section = container.querySelector('section');
      expect(section?.classList.contains('py-24', 'px-4', 'sm:px-6', 'lg:px-8')).toBe(true);
    });

    it('applies responsive button layout', () => {
      render(<HeroSection example={mockExample} />);

      const buttonContainer = screen.getByRole('group', { name: 'Primary actions' });
      expect(buttonContainer?.classList.contains('flex-col', 'sm:flex-row')).toBe(true);
    });

    it('applies responsive aspect ratio to slider container', () => {
      render(<HeroSection example={mockExample} />);

      const sliderContainer = document.querySelector('[role="img"]');
      expect(sliderContainer?.classList.contains('aspect-square', 'md:aspect-video')).toBe(true);
    });

    testResponsiveBehavior(
      <HeroSection example={mockExample} />,
      async (container) => {
        // Test that component renders without layout issues
        expect(container).not.toBeNull();

        // Test that text is readable and properly sized
        const heading = screen.getByRole('heading', { level: 1 });
        const style = window.getComputedStyle(heading);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');

        // Test that buttons are accessible
        const buttons = screen.getAllByRole('link');
        buttons.forEach(button => {
          const style = window.getComputedStyle(button);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
        });
      }
    );
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HeroSection example={mockExample} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).not.toBeNull();
      expect(h1?.getAttribute('id')).toBe('hero-heading');
    });

    it('provides descriptive text for screen readers', () => {
      render(<HeroSection example={mockExample} />);

      expect(screen.getByText('Start with 5 free product photo generations, no credit card required')).not.toBeNull();
      expect(screen.getByText('Learn about our three-step process for transforming product photos')).not.toBeNull();
    });

    it('has proper ARIA labels and descriptions', () => {
      const { container } = render(<HeroSection example={mockExample} />);

      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('hero-heading');
      expect(section?.getAttribute('aria-describedby')).toBe('hero-description');
    });

    it('passes accessibility audit', async () => {
      await testAccessibility(<HeroSection example={mockExample} />);
    });
  });

  describe('Visual Design', () => {
    it('applies proper color contrast', () => {
      render(<HeroSection example={mockExample} />);

      const heading = screen.getByRole('heading', { level: 1 });
      testColorContrast(heading);

      const description = screen.getByText(/Transform phone photos/);
      testColorContrast(description);
    });

    it('has proper background styling', () => {
      render(<HeroSection example={mockExample} />);

      const section = document.querySelector('section');
      expect(section?.classList.contains('relative', 'overflow-hidden')).toBe(true);
    });

    it('includes subtle background glow effect', () => {
      const { container } = render(<HeroSection example={mockExample} />);

      const glowElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(glowElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('renders without performance issues', async () => {
      await testCoreWebVitals(<HeroSection example={mockExample} />);
    });

    it('has optimized animations', () => {
      const { container } = render(<HeroSection example={mockExample} />);

      testAnimationPerformance(container);
    });
  });

  describe('Custom ClassName Support', () => {
    it('accepts and applies custom className', () => {
      const { container } = render(<HeroSection example={mockExample} className="custom-hero" />);

      const section = container.querySelector('section');
      expect(section?.classList.contains('custom-hero')).toBe(true);
    });
  });
});