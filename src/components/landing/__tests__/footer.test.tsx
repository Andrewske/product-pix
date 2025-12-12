import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer', () => {

  it('renders the brand section with wordmark and tagline', () => {
    render(<Footer />);

    expect(screen.getByText('ProductPix')).not.toBeNull();
    expect(screen.getByText('Professional Product Photos in Seconds')).not.toBeNull();
  });

  it('renders navigation links', () => {
    render(<Footer />);

    const pricingLink = screen.getByText('Pricing');
    const loginLink = screen.getByText('Login');
    const signupLink = screen.getByText('Sign Up');

    expect(pricingLink).not.toBeNull();
    expect(loginLink).not.toBeNull();
    expect(signupLink).not.toBeNull();

    // Check that links have correct href attributes
    expect(pricingLink.closest('a')?.getAttribute('href')).toBe('#pricing');
    expect(loginLink.closest('a')?.getAttribute('href')).toBe('/login');
    expect(signupLink.closest('a')?.getAttribute('href')).toBe('/signup');
  });

  it('renders legal links', () => {
    render(<Footer />);

    const termsLink = screen.getByText('Terms');
    const privacyLink = screen.getByText('Privacy');

    expect(termsLink).not.toBeNull();
    expect(privacyLink).not.toBeNull();

    // Check that links have placeholder href attributes
    expect(termsLink.closest('a')?.getAttribute('href')).toBe('#');
    expect(privacyLink.closest('a')?.getAttribute('href')).toBe('#');
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />);

    expect(screen.getByText((content) => content.includes('©') && content.includes('ProductPix. All rights reserved.'))).not.toBeNull();
  });

  it('has responsive layout classes', () => {
    const { container } = render(<Footer />);

    // Check main container has responsive flex layout
    const mainContainer = container.querySelector('div > div');
    expect(mainContainer?.classList.contains('flex')).toBe(true);
    expect(mainContainer?.classList.contains('flex-col')).toBe(true);
    expect(mainContainer?.classList.contains('md:flex-row')).toBe(true);

    // Check navigation list has flex-wrap for mobile
    const navList = container.querySelector('nav ul');
    expect(navList?.classList.contains('flex', 'flex-wrap', 'justify-center')).toBe(true);
  });

  it('applies muted grey styling to text elements', () => {
    render(<Footer />);

    // Check tagline has muted-foreground class
    const tagline = screen.getByText('Professional Product Photos in Seconds');
    expect(tagline?.classList.contains('text-muted-foreground')).toBe(true);

    // Check navigation links have muted-foreground class
    const pricingLink = screen.getByText('Pricing');
    expect(pricingLink?.classList.contains('text-muted-foreground')).toBe(true);

    // Check legal links have muted-foreground class
    const termsLink = screen.getByText('Terms');
    expect(termsLink?.classList.contains('text-muted-foreground')).toBe(true);

    // Check copyright has muted-foreground class
    const copyright = screen.getByText((content) => content.includes('©') && content.includes('ProductPix. All rights reserved.'));
    expect(copyright?.classList.contains('text-muted-foreground')).toBe(true);
  });

  it('applies hover transition classes to links', () => {
    const { container } = render(<Footer />);

    // Check navigation links have hover classes
    const navLinks = container.querySelectorAll('nav a');
    navLinks.forEach(link => {
      expect(link?.classList.contains('hover:text-foreground')).toBe(true);
      expect(link?.classList.contains('transition-colors')).toBe(true);
    });

    // Check legal links have hover classes
    const legalLinks = container.querySelectorAll('div:last-child a');
    legalLinks.forEach(link => {
      expect(link?.classList.contains('hover:text-foreground')).toBe(true);
      expect(link?.classList.contains('transition-colors')).toBe(true);
    });
  });

  it('has proper semantic structure', () => {
    const { container } = render(<Footer />);

    // Should be wrapped in footer element
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
  });

  it('maintains proper spacing and layout', () => {
    const { container } = render(<Footer />);

    // Check main container has proper padding
    const footer = container.querySelector('footer');
    expect(footer?.classList.contains('py-12', 'px-4', 'sm:px-6', 'lg:px-8')).toBe(true);

    // Check inner container has max width
    const innerContainer = container.querySelector('footer > div');
    expect(innerContainer?.classList.contains('max-w-7xl', 'mx-auto')).toBe(true);

    // Check sections have proper gap
    const mainSection = container.querySelector('div > div');
    expect(mainSection?.classList.contains('gap-8')).toBe(true);

    // Check copyright section has proper margin and border
    const copyrightSection = container.querySelector('footer > div > div:last-child');
    expect(copyrightSection?.classList.contains('mt-12')).toBe(true);
    expect(copyrightSection?.classList.contains('pt-8')).toBe(true);
    expect(copyrightSection?.classList.contains('border-t')).toBe(true);
    expect(copyrightSection?.classList.contains('border-border')).toBe(true);
  });
});