import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableOfContents } from '../table-of-contents';

const mockSections = [
  { id: 'section-1', title: 'Introduction' },
  { id: 'section-2', title: 'Getting Started' },
  { id: 'section-3', title: 'Advanced Features' },
];

describe('TableOfContents', () => {
  it('renders numbered list with section titles', () => {
    render(<TableOfContents sections={mockSections} />);

    expect(screen.getByText('Introduction')).not.toBeNull();
    expect(screen.getByText('Getting Started')).not.toBeNull();
    expect(screen.getByText('Advanced Features')).not.toBeNull();
  });

  it('renders in a card container', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const tocElement = container.firstChild as HTMLElement;
    expect(tocElement).toBeDefined();
    expect(tocElement?.tagName).toBe('DIV');

    // Test that container is visible
    const style = window.getComputedStyle(tocElement);
    expect(style.display).not.toBe('none');
  });

  it('renders as an ordered list', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const list = container.querySelector('ol');
    expect(list).toBeDefined();
    expect(list?.tagName).toBe('OL');
    expect(list?.children).toHaveLength(3);
  });

  it('renders links with correct hrefs', () => {
    render(<TableOfContents sections={mockSections} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]?.getAttribute('href')).toBe('#section-1');
    expect(links[1]?.getAttribute('href')).toBe('#section-2');
    expect(links[2]?.getAttribute('href')).toBe('#section-3');
  });

  it('renders interactive links', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(3);

    links.forEach(link => {
      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toMatch(/^#section-/);

      // Test that links are visible and clickable
      const style = window.getComputedStyle(link);
      expect(style.display).not.toBe('none');
      expect(style.pointerEvents).not.toBe('none');
    });
  });

  it('scrolls smoothly to anchor when link is clicked', async () => {
    // Mock scrollIntoView
    const mockScrollIntoView = mock(() => {});
    Element.prototype.scrollIntoView = mockScrollIntoView;

    // Create a mock element with the target id
    const mockElement = document.createElement('div');
    mockElement.id = 'section-1';
    document.body.appendChild(mockElement);

    const user = userEvent.setup();
    render(<TableOfContents sections={mockSections} />);

    const link = screen.getByRole('link', { name: 'Introduction' });
    await user.click(link);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    // Cleanup
    document.body.removeChild(mockElement);
  });
});