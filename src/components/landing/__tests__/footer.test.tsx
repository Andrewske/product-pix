import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer', () => {

  it('renders the brand section with wordmark and tagline', () => {
    render(<Footer />);

    expect(screen.getByText('ProductPix')).not.toBeNull();
    expect(screen.getByText('Professional Product Photos in Seconds')).not.toBeNull();
  });

  it('renders navigation links with correct targets', () => {
    render(<Footer />);

    // Test main navigation links
    const pricingLink = screen.getByRole('link', { name: /pricing/i });
    const loginLink = screen.getByRole('link', { name: /login/i });
    const signupLink = screen.getByRole('link', { name: /sign up/i });

    expect(pricingLink).not.toBeNull();
    expect(loginLink).not.toBeNull();
    expect(signupLink).not.toBeNull();

    // Verify correct href attributes
    expect(pricingLink.getAttribute('href')).toBe('#pricing');
    expect(loginLink.getAttribute('href')).toBe('/login');
    expect(signupLink.getAttribute('href')).toBe('/signup');
  });

  it('renders legal links with accessibility descriptions', () => {
    render(<Footer />);

    const termsLink = screen.getByRole('link', { name: /terms/i });
    const privacyLink = screen.getByRole('link', { name: /privacy/i });

    expect(termsLink).not.toBeNull();
    expect(privacyLink).not.toBeNull();

    // Verify placeholder href attributes for legal pages
    expect(termsLink.getAttribute('href')).toBe('#');
    expect(privacyLink.getAttribute('href')).toBe('#');

    // Verify accessibility descriptions are present
    const termsDesc = document.getElementById('terms-link-description');
    const privacyDesc = document.getElementById('privacy-link-description');
    expect(termsDesc?.textContent).toContain('terms of service');
    expect(privacyDesc?.textContent).toContain('privacy policy');
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    const copyrightText = screen.getByText(new RegExp(`© ${currentYear} ProductPix\\. All rights reserved\\.`));
    expect(copyrightText).not.toBeNull();
  });

  it('organizes content in logical navigation sections', () => {
    const { container } = render(<Footer />);

    // Verify semantic footer structure
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.getAttribute('role')).toBe('contentinfo');

    // Verify navigation sections are properly labeled
    const navSections = container.querySelectorAll('nav');
    expect(navSections).toHaveLength(2);

    // First nav should be for footer navigation
    const mainNav = navSections[0];
    expect(mainNav.getAttribute('aria-label')).toBe('Footer navigation');

    // Second nav should be for legal information
    const legalNav = navSections[1];
    expect(legalNav.getAttribute('aria-label')).toBe('Legal information');

    // Verify navigation lists use proper semantic structure
    const navLists = container.querySelectorAll('nav ul[role="list"]');
    expect(navLists).toHaveLength(2);

    // Verify list items are properly structured
    const listItems = container.querySelectorAll('nav li');
    expect(listItems).toHaveLength(5); // 3 main nav + 2 legal
  });

  it('provides accessible link descriptions for screen readers', () => {
    render(<Footer />);

    // Verify each navigation link has an associated description
    const links = screen.getAllByRole('link');

    links.forEach(link => {
      const describedBy = link.getAttribute('aria-describedby');
      expect(describedBy).not.toBeNull();

      const description = document.getElementById(describedBy!);
      expect(description).not.toBeNull();

      // Verify description contains meaningful text for screen readers
      expect(description?.textContent?.trim()).not.toBe('');
      expect(description?.textContent?.length).toBeGreaterThan(10);
    });
  });

  it('maintains proper content hierarchy and organization', () => {
    const { container } = render(<Footer />);

    // Verify brand section comes first
    const brandSection = container.querySelector('div > div > div:first-child');
    const brandLink = brandSection?.querySelector('span');
    expect(brandLink?.textContent).toBe('ProductPix');

    // Verify navigation sections follow brand
    const navSections = container.querySelectorAll('div > div > nav');
    expect(navSections).toHaveLength(2);

    // Verify copyright section is last
    const copyrightSection = container.querySelector('footer > div > div:last-child');
    const copyrightText = copyrightSection?.textContent;
    expect(copyrightText).toMatch(/© \d{4} ProductPix\. All rights reserved\./);
  });

  it('ensures all links are keyboard accessible', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');

    links.forEach(link => {
      // Verify links have focus-visible styles (though we don't test the CSS classes)
      expect(link.getAttribute('tabindex')).not.toBe('-1');

      // Verify focus ring attributes are present
      expect(link.getAttribute('class')).toMatch(/focus-visible/);
    });
  });
});