import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { PageContainer } from '../page-container';

describe('PageContainer', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<PageContainer>Test Content</PageContainer>);
    expect(getByText('Test Content')).not.toBeNull();
  });

  it('applies default styles', () => {
    const { container } = render(<PageContainer>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.classList.contains('max-w-6xl')).toBe(true);
    expect(pageContainer?.classList.contains('mx-auto')).toBe(true);
    expect(pageContainer?.classList.contains('px-4')).toBe(true);
    expect(pageContainer?.classList.contains('py-16')).toBe(true);
  });

  it('applies narrow max-width when narrow prop is true', () => {
    const { container } = render(<PageContainer narrow>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.classList.contains('max-w-5xl')).toBe(true);
    expect(pageContainer?.classList.contains('max-w-6xl')).toBe(false);
  });

  it('adds spotlight effect when spotlight prop is true', () => {
    const { container } = render(<PageContainer spotlight>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.classList.contains('relative')).toBe(true);

    const spotlight = pageContainer.querySelector('.studio-spotlight');
    expect(spotlight).not.toBeNull();
    expect(spotlight?.classList.contains('absolute')).toBe(true);
    expect(spotlight?.classList.contains('inset-0')).toBe(true);
    expect(spotlight?.classList.contains('pointer-events-none')).toBe(true);
  });

  it('does not add spotlight when spotlight prop is false', () => {
    const { container } = render(<PageContainer spotlight={false}>Content</PageContainer>);
    const spotlight = container.querySelector('.studio-spotlight');
    expect(spotlight).not.not.toBeNull();
  });

  it('merges className prop correctly', () => {
    const { container } = render(<PageContainer className="custom-class">Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.classList.contains('custom-class')).toBe(true);
    expect(pageContainer?.classList.contains('max-w-6xl')).toBe(true);
  });

  it('passes through other HTML attributes', () => {
    const { container } = render(
      <PageContainer data-testid="test-container" role="main">Content</PageContainer>
    );
    const pageContainer = container.firstChild as HTMLElement;
    expect(pageContainer?.getAttribute('data-testid')).toBe('test-container');
    expect(pageContainer?.getAttribute('role')).toBe('main');
  });
});
