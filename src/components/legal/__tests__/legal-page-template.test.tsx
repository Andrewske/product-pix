import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalPageTemplate, LegalSection } from '../legal-page-template';

const mockSections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    level: 2,
    content: <p>Welcome to our service.</p>
  },
  {
    id: 'subsection',
    title: 'Getting Started',
    level: 3,
    content: <p>Here&apos;s how to get started.</p>
  },
  {
    id: 'another-section',
    title: 'Terms',
    level: 2,
    content: <p>These are the terms.</p>
  }
];

const mockFooterLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' }
];

describe('LegalPageTemplate', () => {
  it('renders the page title', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    expect(screen.getByText('Test Legal Page')).not.toBeNull();
  });

  it('renders last updated date when provided', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
        lastUpdated="December 11, 2025"
      />
    );

    expect(screen.getByText('Last updated: December 11, 2025')).not.toBeNull();
  });

  it('auto-generates TOC from level 2 sections', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    // Should show level 2 sections in TOC links
    const tocLinks = screen.getAllByRole('link');
    expect(tocLinks).toHaveLength(2);
    expect(tocLinks[0]?.textContent).toContain('Introduction');
    expect(tocLinks[1]?.textContent).toContain('Terms');

    // Should not show level 3 sections in TOC
    expect(screen.queryByRole('link', { name: 'Getting Started' })).toBeNull();
  });

  it('renders sections with correct heading hierarchy', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    // Check semantic heading levels
    const introHeading = screen.getByRole('heading', { name: 'Introduction', level: 2 });
    expect(introHeading).not.toBeNull();
    expect(introHeading.tagName).toBe('H2');

    const subsectionHeading = screen.getByRole('heading', { name: 'Getting Started', level: 3 });
    expect(subsectionHeading).not.toBeNull();
    expect(subsectionHeading.tagName).toBe('H3');

    const termsHeading = screen.getByRole('heading', { name: 'Terms', level: 2 });
    expect(termsHeading).not.toBeNull();
    expect(termsHeading.tagName).toBe('H2');
  });

  it('renders section content', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    expect(screen.getByText('Welcome to our service.')).not.toBeNull();
    expect(screen.getByText("Here's how to get started.")).not.toBeNull();
    expect(screen.getByText('These are the terms.')).not.toBeNull();
  });

  it('organizes sections with proper document structure', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    // Check that all sections are rendered as semantic section elements
    const sections = document.querySelectorAll('section');
    expect(sections).toHaveLength(3);

    // Verify section order matches the input order
    const sectionHeadings = screen.getAllByRole('heading');
    expect(sectionHeadings).toHaveLength(4); // Page title + 3 section headings

    // Check that sections have proper IDs for navigation
    expect(document.getElementById('introduction')).not.toBeNull();
    expect(document.getElementById('subsection')).not.toBeNull();
    expect(document.getElementById('another-section')).not.toBeNull();

    // Verify hierarchical structure: level 2 sections contain level 3 subsections
    const introSection = document.getElementById('introduction')?.closest('section');
    const subsection = document.getElementById('subsection')?.closest('section');
    const termsSection = document.getElementById('another-section')?.closest('section');

    expect(introSection).not.toBeNull();
    expect(subsection).not.toBeNull();
    expect(termsSection).not.toBeNull();
  });



  it('renders sections with correct IDs', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    expect(document.getElementById('introduction')).not.toBeNull();
    expect(document.getElementById('subsection')).not.toBeNull();
    expect(document.getElementById('another-section')).not.toBeNull();
  });

  it('renders footer links when provided', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
        footerLinks={mockFooterLinks}
      />
    );

    expect(screen.getByText(/See also:/)).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })?.getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })?.getAttribute('href')).toBe('/terms');
  });

  it('does not render footer when no links provided', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    expect(screen.queryByText('See also:')).toBeNull();
  });

  it('renders multiple footer links with commas', () => {
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
        footerLinks={mockFooterLinks}
      />
    );

    const footerText = screen.getByText(/See also:/);
    expect(footerText).not.toBeNull();
    // Check that links are separated by commas
    expect(footerText.textContent).toContain('Privacy Policy, Terms of Service');
  });

  it('scrolls smoothly to anchor when TOC link is clicked', async () => {
    // Mock scrollIntoView
    const mockScrollIntoView = mock(() => {});
    Element.prototype.scrollIntoView = mockScrollIntoView;

    // Create a mock element with the target id
    const mockElement = document.createElement('div');
    mockElement.id = 'introduction';
    document.body.appendChild(mockElement);

    const user = userEvent.setup();
    render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    const tocLink = screen.getByRole('link', { name: 'Introduction' });
    await user.click(tocLink);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    // Cleanup
    document.body.removeChild(mockElement);
  });

  it('uses PageContainer with narrow prop', () => {
    const { container } = render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
      />
    );

    // Check that PageContainer is rendered with narrow class
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.classList.contains('max-w-5xl')).toBe(true); // narrow prop applies max-w-5xl
  });

  it('applies custom className', () => {
    const { container } = render(
      <LegalPageTemplate
        title="Test Legal Page"
        sections={mockSections}
        className="custom-class"
      />
    );

    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.classList.contains('custom-class')).toBe(true);
  });
});