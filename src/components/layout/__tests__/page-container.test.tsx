import { render } from '@testing-library/react';
import { PageContainer } from '../page-container';

describe('PageContainer', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<PageContainer>Test Content</PageContainer>);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<PageContainer>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer).toHaveClass('max-w-6xl');
    expect(pageContainer).toHaveClass('mx-auto');
    expect(pageContainer).toHaveClass('px-4');
    expect(pageContainer).toHaveClass('py-16');
  });

  it('applies narrow max-width when narrow prop is true', () => {
    const { container } = render(<PageContainer narrow>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer).toHaveClass('max-w-5xl');
    expect(pageContainer).not.toHaveClass('max-w-6xl');
  });

  it('adds spotlight effect when spotlight prop is true', () => {
    const { container } = render(<PageContainer spotlight>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer).toHaveClass('relative');

    const spotlight = pageContainer.querySelector('.studio-spotlight');
    expect(spotlight).toBeInTheDocument();
    expect(spotlight).toHaveClass('absolute');
    expect(spotlight).toHaveClass('inset-0');
    expect(spotlight).toHaveClass('pointer-events-none');
  });

  it('does not add spotlight when spotlight prop is false', () => {
    const { container } = render(<PageContainer spotlight={false}>Content</PageContainer>);
    const spotlight = container.querySelector('.studio-spotlight');
    expect(spotlight).not.toBeInTheDocument();
  });

  it('merges className prop correctly', () => {
    const { container } = render(<PageContainer className="custom-class">Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer).toHaveClass('custom-class');
    expect(pageContainer).toHaveClass('max-w-6xl');
  });

  it('passes through other HTML attributes', () => {
    const { container } = render(
      <PageContainer data-testid="test-container" role="main">Content</PageContainer>
    );
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer).toHaveAttribute('data-testid', 'test-container');
    expect(pageContainer).toHaveAttribute('role', 'main');
  });
});
