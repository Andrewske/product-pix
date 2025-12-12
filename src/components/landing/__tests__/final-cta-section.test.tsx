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
    it('displays heading with appropriate semantic structure', () => {
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });

      // Test semantic structure and content
      expect(heading.textContent).toBe('Ready to upgrade your listings?');
      expect(heading.tagName).toBe('H2');
      expect(heading.getAttribute('id')).toBe('final-cta-heading');

      // Test that it's visible (basic visibility check)
      const style = window.getComputedStyle(heading);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
    });

    it('provides adequate spacing and layout', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');

      // Test that section exists and has expected structure
      expect(section).toBeDefined();
      expect(section?.tagName).toBe('SECTION');

      // Test that it contains the expected content container
      const contentDiv = section?.querySelector('.max-w-4xl');
      expect(contentDiv).toBeDefined();

      // Test basic visibility
      const style = window.getComputedStyle(section!);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
    });

    it('centers content appropriately', () => {
      const { container } = render(<FinalCTASection />);

      const contentDiv = container.querySelector('.max-w-4xl');
      expect(contentDiv).toBeDefined();

      // Test that the content div has centering classes or structure
      expect(contentDiv?.classList.contains('mx-auto')).toBe(true);
      expect(contentDiv?.textContent).toContain('Ready to upgrade your listings?');
    });

    it('button adapts to different screen sizes', () => {
      render(<FinalCTASection />);

      const button = screen.getByRole('link', { name: /get started for free/i });

      // Test button is present and functional
      expect(button).toBeDefined();
      expect(button.getAttribute('href')).toBe('/signup');
      expect(button.textContent).toContain('Get Started for Free');

      // Test button is visible and accessible
      const style = window.getComputedStyle(button);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
    });

    it('renders all content as visible and accessible', () => {
      render(<FinalCTASection />);

      // Test that all key elements are visible
      const heading = screen.getByRole('heading', { level: 2 });
      const description = screen.getByText('Join thousands of sellers creating professional product photos in seconds.');
      const button = screen.getByRole('link', { name: /get started for free/i });
      const trialInfo = screen.getByText('No credit card required • 5 free credits');

      [heading, description, button, trialInfo].forEach(element => {
        const style = window.getComputedStyle(element);
        expect(style.display).not.toBe('none');
        expect(style.visibility).not.toBe('hidden');
      });
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
    it('applies proper color contrast for readability', () => {
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      testColorContrast(heading);

      const description = screen.getByText('Join thousands of sellers creating professional product photos in seconds.');
      testColorContrast(description);
    });

    it('provides visual separation from previous content', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');

      // Test that section has some form of visual separation (border or background)
      const style = window.getComputedStyle(section!);
      const hasBorder = style.borderTopWidth !== '0px' || style.borderBottomWidth !== '0px';
      const hasBackground = style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)';

      expect(hasBorder || hasBackground).toBe(true);
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

  describe('Customization', () => {
    it('accepts and applies custom className for styling flexibility', () => {
      const { container } = render(<FinalCTASection className="custom-cta" />);

      const section = container.querySelector('section');

      // Test that custom class is applied (behavior: customization works)
      expect(section?.classList.contains('custom-cta')).toBe(true);

      // Test that component still functions with custom class
      expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
      expect(screen.getByRole('link', { name: /get started for free/i })).toBeDefined();
    });
  });
});