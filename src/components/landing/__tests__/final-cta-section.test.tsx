import { describe, it, expect, beforeEach } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinalCTASection } from '../final-cta-section';
import {
  testAccessibility,
  testColorContrast,
  testAnimationPerformance,
  testCoreWebVitals,
  viewports,
  mockViewport
} from '@/__tests__/test-utils';

describe('FinalCTASection', () => {
  beforeEach(() => {
    // Reset viewport to desktop default
    mockViewport(viewports.desktop.width, viewports.desktop.height);
  });

  describe('Basic Rendering', () => {
    it('renders the main heading', () => {
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading?.textContent).toContain('Ready to upgrade your listings?');
      expect(heading?.getAttribute('id')).toBe('final-cta-heading');
    });

    it('renders the description text', () => {
      render(<FinalCTASection />);

      const description = screen.getByText('Join thousands of sellers creating professional product photos in seconds.');
      expect(description?.getAttribute('id')).toBe('final-cta-description');
    });

    it('renders the trial information', () => {
      render(<FinalCTASection />);

      expect(screen.getByText('No credit card required • 5 free credits')).not.toBeNull();
    });
  });

  describe('CTA Button', () => {
    it('renders primary CTA button with correct text and link', () => {
      render(<FinalCTASection />);

      const button = screen.getByRole('link', { name: /get started for free/i });
      expect(button).not.toBeNull();
      expect(button?.getAttribute('href')).toBe('/signup');
      expect(button?.getAttribute('aria-describedby')).toBe('final-cta-button-description');
    });

    it('has proper button accessibility', () => {
      render(<FinalCTASection />);

      const buttonGroup = screen.getByRole('group', { name: 'Final call-to-action' });
      expect(buttonGroup).not.toBeNull();

      const button = screen.getByRole('link', { name: /get started for free/i });
      expect(button?.getAttribute('aria-describedby')).toBe('final-cta-button-description');
    });

    it('button is functional with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<FinalCTASection />);

      const button = screen.getByRole('link', { name: /get started for free/i });

      // Test keyboard focus
      button.focus();
      expect(button).toBe(document.activeElement as HTMLElement);

      // Test that button can be activated
      await user.keyboard('{Enter}');
      expect(button).not.toBeNull();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing', () => {
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading?.classList.contains('text-4xl')).toBe(true);
      expect(heading?.classList.contains('sm:text-5xl')).toBe(true);
    });

    it('applies responsive padding', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');
      expect(section?.classList.contains('py-24')).toBe(true);
      expect(section?.classList.contains('px-4')).toBe(true);
      expect(section?.classList.contains('sm:px-6')).toBe(true);
      expect(section?.classList.contains('lg:px-8')).toBe(true);
    });

    it('applies responsive button layout', () => {
      render(<FinalCTASection />);

      const buttonContainer = screen.getByRole('group', { name: 'Final call-to-action' });
      expect(buttonContainer?.classList.contains('flex-col')).toBe(true);
      expect(buttonContainer?.classList.contains('sm:flex-row')).toBe(true);
    });

    it('applies responsive button sizing', () => {
      render(<FinalCTASection />);

      const button = screen.getByRole('button', { name: /get started for free/i });
      expect(button?.classList.contains('w-full', 'sm:w-auto')).toBe(true);
    });

    it('renders correctly on mobile viewport', () => {
      mockViewport(viewports.mobile.width, viewports.mobile.height);
      render(<FinalCTASection />);

      // Test that component renders without layout issues
      const heading = screen.getByRole('heading', { level: 2 });
      const headingStyle = window.getComputedStyle(heading);
      expect(headingStyle.display).not.toBe('none');
      expect(headingStyle.visibility).not.toBe('hidden');

      // Test that button is accessible
      const button = screen.getByRole('link', { name: /get started for free/i });
      const buttonStyle = window.getComputedStyle(button);
      expect(buttonStyle.display).not.toBe('none');
      expect(buttonStyle.visibility).not.toBe('hidden');
    });

    it('renders correctly on tablet viewport', () => {
      mockViewport(viewports.tablet.width, viewports.tablet.height);
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      const headingStyle = window.getComputedStyle(heading);
      expect(headingStyle.display).not.toBe('none');
      expect(headingStyle.visibility).not.toBe('hidden');
    });

    it('renders correctly on desktop viewport', () => {
      mockViewport(viewports.desktop.width, viewports.desktop.height);
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      const headingStyle = window.getComputedStyle(heading);
      expect(headingStyle.display).not.toBe('none');
      expect(headingStyle.visibility).not.toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<FinalCTASection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).not.toBeNull();
      expect(h2?.getAttribute('id')).toBe('final-cta-heading');
    });

    it('provides descriptive text for screen readers', () => {
      render(<FinalCTASection />);

      expect(screen.getByText('Start your free trial with 5 credits, no credit card required')).not.toBeNull();
    });

    it('has proper ARIA labels and descriptions', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('final-cta-heading');
      expect(section?.getAttribute('aria-describedby')).toBe('final-cta-description');
    });

    it('passes accessibility audit', async () => {
      await testAccessibility(<FinalCTASection />);
    });
  });

  describe('Visual Design', () => {
    it('applies proper color contrast', () => {
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      testColorContrast(heading);

      const description = screen.getByText('Join thousands of sellers creating professional product photos in seconds.');
      testColorContrast(description);
    });

    it('has proper background styling', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');
      expect(section?.classList.contains('bg-card')).toBe(true);
      expect(section?.classList.contains('border-t')).toBe(true);
      expect(section?.classList.contains('border-border/40')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('renders without performance issues', async () => {
      await testCoreWebVitals(<FinalCTASection />);
    });

    it('has optimized animations', () => {
      const { container } = render(<FinalCTASection />);

      testAnimationPerformance(container);
    });
  });

  describe('Custom ClassName Support', () => {
    it('accepts and applies custom className', () => {
      const { container } = render(<FinalCTASection className="custom-cta" />);

      const section = container.querySelector('section');
      expect(section?.classList.contains('custom-cta')).toBe(true);
    });
  });
});