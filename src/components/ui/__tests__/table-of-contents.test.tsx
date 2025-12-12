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

  it('applies card styling', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const tocElement = container.firstChild as HTMLElement;
    expect(tocElement?.classList.contains('bg-card')).toBe(true);
    expect(tocElement?.classList.contains('rounded-lg')).toBe(true);
    expect(tocElement?.classList.contains('border')).toBe(true);
  });

  it('renders as numbered list', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const list = container.querySelector('ol');
    expect(list?.classList.contains('list-decimal')).toBe(true);
  });

  it('renders links with correct hrefs', () => {
    render(<TableOfContents sections={mockSections} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]?.getAttribute('href')).toBe('#section-1');
    expect(links[1]?.getAttribute('href')).toBe('#section-2');
    expect(links[2]?.getAttribute('href')).toBe('#section-3');
  });

  it('applies hover effects to links', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link?.classList.contains('hover:underline')).toBe(true);
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