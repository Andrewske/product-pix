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
      expect(heading).toHaveTextContent('Professional Product Photos');
      expect(heading).toHaveTextContent('in Seconds');
      expect(heading).toHaveAttribute('id', 'hero-heading');
    });

    it('renders the description text', () => {
      render(<HeroSection example={mockExample} />);

      const description = screen.getByText(/Transform phone photos into studio-quality product images/);
      expect(description).toHaveAttribute('id', 'hero-description');
    });

    it('renders the before/after slider', () => {
      render(<HeroSection example={mockExample} />);

      // The slider should be present within the hero section
      const sliderContainer = document.querySelector('[role="img"]');
      expect(sliderContainer).toBeInTheDocument();
      expect(sliderContainer!.getAttribute('aria-label')).toContain('Test Product');
    });
  });

  describe('CTA Buttons', () => {
    it('renders primary CTA button with correct text and link', () => {
      render(<HeroSection example={mockExample} />);

      const primaryButton = screen.getByText('Get 5 Free Photos');
      expect(primaryButton).toBeInTheDocument();

      // Check that it's a button inside a link
      expect(primaryButton.tagName).toBe('BUTTON');
      const link = primaryButton.closest('a');
      expect(link).toHaveAttribute('href', '/signup');

      expect(primaryButton).toHaveAttribute('aria-describedby', 'signup-description');
    });

    it('renders secondary CTA button', () => {
      render(<HeroSection example={mockExample} />);

      const secondaryButton = screen.getByRole('link', { name: /see how it works/i });
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveAttribute('href', '#how-it-works');

      // The aria-describedby is on the button inside the link
      const button = screen.getByRole('button', { name: /see how it works/i });
      expect(button).toHaveAttribute('aria-describedby', 'how-it-works-description');
    });

    it('has proper button grouping and accessibility', () => {
      render(<HeroSection example={mockExample} />);

      const buttonGroup = screen.getByRole('group', { name: 'Primary actions' });
      expect(buttonGroup).toBeInTheDocument();

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
      expect(primaryButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing', () => {
      render(<HeroSection example={mockExample} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-5xl', 'sm:text-6xl', 'lg:text-7xl');
    });

    it('applies responsive padding and spacing', () => {
      const { container } = render(<HeroSection example={mockExample} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('py-24', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('applies responsive button layout', () => {
      render(<HeroSection example={mockExample} />);

      const buttonContainer = screen.getByRole('group', { name: 'Primary actions' });
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('applies responsive aspect ratio to slider container', () => {
      render(<HeroSection example={mockExample} />);

      const sliderContainer = document.querySelector('[role="img"]');
      expect(sliderContainer).toHaveClass('aspect-square', 'md:aspect-video');
    });

    testResponsiveBehavior(
      <HeroSection example={mockExample} />,
      async (container) => {
        // Test that component renders without layout issues
        expect(container).toBeInTheDocument();

        // Test that text is readable and properly sized
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeVisible();

        // Test that buttons are accessible
        const buttons = screen.getAllByRole('link');
        buttons.forEach(button => {
          expect(button).toBeVisible();
        });
      }
    );
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HeroSection example={mockExample} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveAttribute('id', 'hero-heading');
    });

    it('provides descriptive text for screen readers', () => {
      render(<HeroSection example={mockExample} />);

      expect(screen.getByText('Start with 5 free product photo generations, no credit card required')).toBeInTheDocument();
      expect(screen.getByText('Learn about our three-step process for transforming product photos')).toBeInTheDocument();
    });

    it('has proper ARIA labels and descriptions', () => {
      const { container } = render(<HeroSection example={mockExample} />);

      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'hero-heading');
      expect(section).toHaveAttribute('aria-describedby', 'hero-description');
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
      expect(section).toHaveClass('relative', 'overflow-hidden');
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
      expect(section).toHaveClass('custom-hero');
    });
  });
});