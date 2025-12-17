import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { SiteFooter } from '../site-footer';

describe('SiteFooter', () => {
  it('renders with default brand section', () => {
    render(<SiteFooter />);

    expect(screen.getByText('ProductPix')).not.toBeNull();
    expect(screen.getByText('Professional Product Photos in Seconds')).not.toBeNull();
  });

  it('renders responsive grid layout', () => {
    render(<SiteFooter />);

    // Check that main grid container exists
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).not.toBeNull();
    expect(gridContainer?.classList.contains('grid-cols-1')).toBe(true);
    expect(gridContainer?.classList.contains('md:grid-cols-2')).toBe(true);
    expect(gridContainer?.classList.contains('lg:grid-cols-4')).toBe(true);
  });

  it('renders all default sections', () => {
    render(<SiteFooter />);

    expect(screen.getByText('Product')).not.toBeNull();
    expect(screen.getByText('Company')).not.toBeNull();
    expect(screen.getByText('Support')).not.toBeNull();
    expect(screen.getByText('Legal')).not.toBeNull();
  });

  it('renders separator between main content and bottom', () => {
    render(<SiteFooter />);

    const separator = document.querySelector('[data-slot="separator"]');
    expect(separator).not.toBeNull();
  });

  it('renders copyright with current year', () => {
    render(<SiteFooter />);

    const currentYear = new Date().getFullYear().toString();
    const copyrightText = screen.getByText(new RegExp(`© ${currentYear} ProductPix`));
    expect(copyrightText).not.toBeNull();
  });

  it('renders legal links in footer bottom', () => {
    render(<SiteFooter />);

    const privacyLink = screen.getByRole('link', { name: /privacy/i });
    const termsLink = screen.getByRole('link', { name: /terms/i });

    expect(privacyLink).not.toBeNull();
    expect(termsLink).not.toBeNull();
    expect(privacyLink.getAttribute('href')).toBe('/privacy');
    expect(termsLink.getAttribute('href')).toBe('/terms');
  });

  it('allows custom brand configuration', () => {
    render(
      <SiteFooter
        brand={{
          name: 'Custom Brand',
          tagline: 'Custom Tagline',
          logo: '/custom-logo.png'
        }}
      />
    );

    expect(screen.getByText('Custom Brand')).not.toBeNull();
    expect(screen.getByText('Custom Tagline')).not.toBeNull();
  });

  it('allows custom sections', () => {
    const customSections = [
      {
        title: 'Custom Section',
        links: [
          { label: 'Custom Link', href: '/custom', description: 'Custom link description' }
        ]
      }
    ];

    render(<SiteFooter sections={customSections} />);

    expect(screen.getByText('Custom Section')).not.toBeNull();
    expect(screen.getByRole('link', { name: /custom link/i })).not.toBeNull();
  });

  it('renders footer with proper semantic structure', () => {
    const { container } = render(<SiteFooter />);

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();

    // Check for navigation landmarks
    const navs = container.querySelectorAll('nav');
    expect(navs.length).toBeGreaterThan(0);
  });

  it('renders links with hover states', () => {
    render(<SiteFooter />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.classList.contains('hover:text-foreground')).toBe(true);
      expect(link.classList.contains('transition-colors')).toBe(true);
    });
  });
});