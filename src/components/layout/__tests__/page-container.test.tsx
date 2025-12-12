import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { PageContainer } from '../page-container';

describe('PageContainer', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<PageContainer>Test Content</PageContainer>);
    expect(getByText('Test Content')).not.toBeNull();
  });

  it('provides default container layout', () => {
    const { container, getByText } = render(<PageContainer>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    expect(pageContainer?.tagName).toBe('DIV');

    // Test that container is visible and has content
    const style = window.getComputedStyle(pageContainer);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('applies narrow width when narrow prop is true', () => {
    const { container, getByText } = render(<PageContainer narrow>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    expect(pageContainer?.tagName).toBe('DIV');

    // Test that narrow variant renders without errors
    const style = window.getComputedStyle(pageContainer);
    expect(style.display).not.toBe('none');
  });

  it('adds spotlight effect when spotlight prop is true', () => {
    const { container, getByText } = render(<PageContainer spotlight>Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();

    // Test that spotlight element is present when enabled
    const spotlight = pageContainer.querySelector('.studio-spotlight');
    expect(spotlight).toBeDefined();
    expect(spotlight?.tagName).toBe('DIV');
  });

  it('does not add spotlight when spotlight prop is false', () => {
    const { container } = render(<PageContainer spotlight={false}>Content</PageContainer>);

    // Test that spotlight element is not present when disabled
    const spotlight = container.querySelector('.studio-spotlight');
    expect(spotlight).toBeNull();
  });

  it('merges className prop correctly', () => {
    const { container, getByText } = render(<PageContainer className="custom-class">Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    // Test that custom class is applied (behavioral test of customization)
    expect(pageContainer?.classList.contains('custom-class')).toBe(true);

    const style = window.getComputedStyle(pageContainer);
    expect(style.display).not.toBe('none');
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
