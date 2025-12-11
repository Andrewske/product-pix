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

    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Advanced Features')).toBeInTheDocument();
  });

  it('applies card styling', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const tocElement = container.firstChild as HTMLElement;
    expect(tocElement).toHaveClass('bg-card');
    expect(tocElement).toHaveClass('rounded-lg');
    expect(tocElement).toHaveClass('border');
  });

  it('renders as numbered list', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const list = container.querySelector('ol');
    expect(list).toHaveClass('list-decimal');
  });

  it('renders links with correct hrefs', () => {
    render(<TableOfContents sections={mockSections} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '#section-1');
    expect(links[1]).toHaveAttribute('href', '#section-2');
    expect(links[2]).toHaveAttribute('href', '#section-3');
  });

  it('applies hover effects to links', () => {
    const { container } = render(<TableOfContents sections={mockSections} />);

    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link).toHaveClass('hover:underline');
    });
  });

  it('scrolls smoothly to anchor when link is clicked', async () => {
    // Mock scrollIntoView
    const mockScrollIntoView = jest.fn();
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