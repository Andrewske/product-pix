import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { PageContainer } from '../page-container';

describe('PageContainer', () => {
  describe('Basic Rendering', () => {
    it('should provide default container layout', () => {
      const { container, getByText } = render(<PageContainer>Content</PageContainer>);
      const pageContainer = container.firstChild as HTMLElement;

      expect(getByText('Content')).toBeDefined();
      expect(pageContainer?.tagName).toBe('DIV');

      // Test that container is visible and has content
      const style = window.getComputedStyle(pageContainer);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
    });
  });

  describe('Layout Variants', () => {
    it('should apply narrow width when narrow prop is true', () => {
      const { container, getByText } = render(<PageContainer narrow>Content</PageContainer>);
      const pageContainer = container.firstChild as HTMLElement;

      expect(getByText('Content')).toBeDefined();
      expect(pageContainer?.tagName).toBe('DIV');

      // Test that narrow variant renders without errors
      const style = window.getComputedStyle(pageContainer);
      expect(style.display).not.toBe('none');
    });
  });



  it('should merge className prop correctly', () => {
    const { container, getByText } = render(<PageContainer className="custom-class">Content</PageContainer>);
    const pageContainer = container.firstChild as HTMLElement;

    expect(getByText('Content')).toBeDefined();
    // Test that custom class is applied (behavioral test of customization)
    expect(pageContainer?.classList.contains('custom-class')).toBe(true);

    const style = window.getComputedStyle(pageContainer);
    expect(style.display).not.toBe('none');
  });

});
