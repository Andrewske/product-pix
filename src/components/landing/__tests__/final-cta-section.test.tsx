import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinalCTASection } from '../final-cta-section';
import {
  testResponsiveBehavior,
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
      expect(heading).toHaveTextContent('Ready to upgrade your listings?');
      expect(heading).toHaveAttribute('id', 'final-cta-heading');
    });

    it('renders the description text', () => {
      render(<FinalCTASection />);

      const description = screen.getByText('Join thousands of sellers creating professional product photos in seconds.');
      expect(description).toHaveAttribute('id', 'final-cta-description');
    });

    it('renders the trial information', () => {
      render(<FinalCTASection />);

      expect(screen.getByText('No credit card required • 5 free credits')).toBeInTheDocument();
    });
  });

  describe('CTA Button', () => {
    it('renders primary CTA button with correct text and link', () => {
      render(<FinalCTASection />);

      const button = screen.getByRole('link', { name: /get started for free/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/signup');
      expect(button).toHaveAttribute('aria-describedby', 'final-cta-button-description');
    });

    it('has proper button accessibility', () => {
      render(<FinalCTASection />);

      const buttonGroup = screen.getByRole('group', { name: 'Final call-to-action' });
      expect(buttonGroup).toBeInTheDocument();

      const button = screen.getByRole('link', { name: /get started for free/i });
      expect(button).toHaveAttribute('aria-describedby', 'final-cta-button-description');
    });

    it('button is functional with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<FinalCTASection />);

      const button = screen.getByRole('link', { name: /get started for free/i });

      // Test keyboard focus
      button.focus();
      expect(button).toHaveFocus();

      // Test that button can be activated
      await user.keyboard('{Enter}');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing', () => {
      render(<FinalCTASection />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-4xl', 'sm:text-5xl');
    });

    it('applies responsive padding', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('py-24', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('applies responsive button layout', () => {
      render(<FinalCTASection />);

      const buttonContainer = screen.getByRole('group', { name: 'Final call-to-action' });
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('applies responsive button sizing', () => {
      render(<FinalCTASection />);

      const button = screen.getByRole('link', { name: /get started for free/i });
      expect(button).toHaveClass('w-full', 'sm:w-auto');
    });

    testResponsiveBehavior(
      <FinalCTASection />,
      async () => {
        // Test that component renders without layout issues
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toBeVisible();

        // Test that button is accessible
        const button = screen.getByRole('link', { name: /get started for free/i });
        expect(button).toBeVisible();
      }
    );
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<FinalCTASection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveAttribute('id', 'final-cta-heading');
    });

    it('provides descriptive text for screen readers', () => {
      render(<FinalCTASection />);

      expect(screen.getByText('Start your free trial with 5 credits, no credit card required')).toBeInTheDocument();
    });

    it('has proper ARIA labels and descriptions', () => {
      const { container } = render(<FinalCTASection />);

      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'final-cta-heading');
      expect(section).toHaveAttribute('aria-describedby', 'final-cta-description');
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
      expect(section).toHaveClass('bg-card', 'border-t', 'border-border/40');
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
      expect(section).toHaveClass('custom-cta');
    });
  });
});