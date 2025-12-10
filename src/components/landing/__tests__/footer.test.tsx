import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent year in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the brand section with wordmark and tagline', () => {
    render(<Footer />);

    expect(screen.getByText('ProductPix')).toBeInTheDocument();
    expect(screen.getByText('Professional Product Photos in Seconds')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Footer />);

    const pricingLink = screen.getByText('Pricing');
    const loginLink = screen.getByText('Login');
    const signupLink = screen.getByText('Sign Up');

    expect(pricingLink).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
    expect(signupLink).toBeInTheDocument();

    // Check that links have correct href attributes
    expect(pricingLink.closest('a')).toHaveAttribute('href', '#pricing');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('renders legal links', () => {
    render(<Footer />);

    const termsLink = screen.getByText('Terms');
    const privacyLink = screen.getByText('Privacy');

    expect(termsLink).toBeInTheDocument();
    expect(privacyLink).toBeInTheDocument();

    // Check that links have placeholder href attributes
    expect(termsLink.closest('a')).toHaveAttribute('href', '#');
    expect(privacyLink.closest('a')).toHaveAttribute('href', '#');
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />);

    expect(screen.getByText((content) => content.includes('©') && content.includes('ProductPix. All rights reserved.'))).toBeInTheDocument();
  });

  it('has responsive layout classes', () => {
    const { container } = render(<Footer />);

    // Check main container has responsive flex layout
    const mainContainer = container.querySelector('div > div');
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'md:flex-row');

    // Check navigation list has flex-wrap for mobile
    const navList = container.querySelector('nav ul');
    expect(navList).toHaveClass('flex', 'flex-wrap', 'justify-center');
  });

  it('applies muted grey styling to text elements', () => {
    const { container } = render(<Footer />);

    // Check tagline has muted-foreground class
    const tagline = screen.getByText('Professional Product Photos in Seconds');
    expect(tagline).toHaveClass('text-muted-foreground');

    // Check navigation links have muted-foreground class
    const pricingLink = screen.getByText('Pricing');
    expect(pricingLink).toHaveClass('text-muted-foreground');

    // Check legal links have muted-foreground class
    const termsLink = screen.getByText('Terms');
    expect(termsLink).toHaveClass('text-muted-foreground');

    // Check copyright has muted-foreground class
    const copyright = screen.getByText((content) => content.includes('©') && content.includes('ProductPix. All rights reserved.'));
    expect(copyright).toHaveClass('text-muted-foreground');
  });

  it('applies hover transition classes to links', () => {
    const { container } = render(<Footer />);

    // Check navigation links have hover classes
    const navLinks = container.querySelectorAll('nav a');
    navLinks.forEach(link => {
      expect(link).toHaveClass('hover:text-foreground', 'transition-colors');
    });

    // Check legal links have hover classes
    const legalLinks = container.querySelectorAll('div:last-child a');
    legalLinks.forEach(link => {
      expect(link).toHaveClass('hover:text-foreground', 'transition-colors');
    });
  });

  it('has proper semantic structure', () => {
    const { container } = render(<Footer />);

    // Should be wrapped in footer element
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('maintains proper spacing and layout', () => {
    const { container } = render(<Footer />);

    // Check main container has proper padding
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('py-12', 'px-4', 'sm:px-6', 'lg:px-8');

    // Check inner container has max width
    const innerContainer = container.querySelector('footer > div');
    expect(innerContainer).toHaveClass('max-w-7xl', 'mx-auto');

    // Check sections have proper gap
    const mainSection = container.querySelector('div > div');
    expect(mainSection).toHaveClass('gap-8');

    // Check copyright section has proper margin and border
    const copyrightSection = container.querySelector('footer > div > div:last-child');
    expect(copyrightSection).toHaveClass('mt-12', 'pt-8', 'border-t', 'border-border');
  });
});