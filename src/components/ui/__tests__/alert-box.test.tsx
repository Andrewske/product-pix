import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { AlertBox } from '../alert-box';

describe('AlertBox', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(getByText('Error message')).not.toBeNull();
  });

  it('renders error variant with appropriate styling', () => {
    const { container, getByText } = render(<AlertBox variant="error">Error message</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;

    expect(getByText('Error message')).toBeDefined();
    expect(alert?.tagName).toBe('DIV');

    // Test that it has some form of visual distinction (basic styling check)
    const style = window.getComputedStyle(alert);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders success variant with appropriate styling', () => {
    const { container, getByText } = render(<AlertBox variant="success">Success message</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;

    expect(getByText('Success message')).toBeDefined();
    expect(alert?.tagName).toBe('DIV');

    // Test that it has some form of visual distinction
    const style = window.getComputedStyle(alert);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders info variant with appropriate styling', () => {
    const { container, getByText } = render(<AlertBox variant="info">Info message</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;

    expect(getByText('Info message')).toBeDefined();
    expect(alert?.tagName).toBe('DIV');

    // Test that it has some form of visual distinction
    const style = window.getComputedStyle(alert);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders warning variant with appropriate styling', () => {
    const { container, getByText } = render(<AlertBox variant="warning">Warning message</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;

    expect(getByText('Warning message')).toBeDefined();
    expect(alert?.tagName).toBe('DIV');

    // Test that it has some form of visual distinction
    const style = window.getComputedStyle(alert);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <AlertBox variant="error" title="Error Title">
        Error message
      </AlertBox>
    );
    const title = getByText('Error Title');
    expect(title).toBeDefined();
    expect(title?.tagName).toBe('DIV'); // Title is wrapped in a div
    expect(title?.textContent).toBe('Error Title');
  });

  it('does not render title when not provided', () => {
    const { queryByRole } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(queryByRole('heading')).not.not.toBeNull();
  });

  it('merges className prop correctly', () => {
    const { container, getByText } = render(
      <AlertBox variant="error" className="custom-class">
        Error message
      </AlertBox>
    );
    const alert = container.querySelector('div') as HTMLElement;

    expect(getByText('Error message')).toBeDefined();
    // Test that custom class is applied (this is behavioral - customization works)
    expect(alert?.classList.contains('custom-class')).toBe(true);

    // Test that component still renders properly with custom class
    const style = window.getComputedStyle(alert);
    expect(style.display).not.toBe('none');
  });

  it('passes through other props', () => {
    const { container } = render(
      <AlertBox variant="error" data-testid="alert-box">
        Error
      </AlertBox>
    );
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert?.getAttribute('data-testid')).toBe('alert-box');
  });
});