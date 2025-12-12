import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../auth-layout';

describe('AuthLayout', () => {
  it('renders children in a card layout', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test content')).toBeDefined();
    const card = document.querySelector('[data-slot="card"]');
    expect(card).toBeDefined();
    expect(card?.tagName).toBe('DIV');

    // Test that card is visible
    const style = window.getComputedStyle(card!);
    expect(style.display).not.toBe('none');
  });

  it('displays title prominently', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Content</div>
      </AuthLayout>
    );

    const title = screen.getByText('Test Title');
    expect(title).toBeDefined();
    expect(title?.tagName).toBe('DIV'); // CardTitle renders as div
    expect(title?.textContent).toBe('Test Title');

    // Test that title is visible
    const style = window.getComputedStyle(title);
    expect(style.display).not.toBe('none');
  });

  it('displays error message when error prop provided', () => {
    render(
      <AuthLayout title="Test Title" error="Test error message">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test error message')).toBeDefined();
    // Test that error is visually present
    const errorElement = screen.getByText('Test error message');
    const style = window.getComputedStyle(errorElement);
    expect(style.display).not.toBe('none');
  });

  it('renders spotlight background when showSpotlight is true', () => {
    render(
      <AuthLayout title="Test Title" showSpotlight>
        <div>Content</div>
      </AuthLayout>
    );

    const spotlight = document.querySelector('.studio-spotlight');
    expect(spotlight).not.toBeNull();
  });

  it('does not render spotlight background when showSpotlight is false', () => {
    render(
      <AuthLayout title="Test Title" showSpotlight={false}>
        <div>Content</div>
      </AuthLayout>
    );

    const spotlight = document.querySelector('.studio-spotlight');
    expect(spotlight).not.not.toBeNull();
  });

  it('renders footer slot content', () => {
    render(
      <AuthLayout
        title="Test Title"
        footer={<div>Footer content</div>}
      >
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Footer content')).not.toBeNull();
  });

  it('renders with default props (no error, no spotlight, no footer)', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test Title')).not.toBeNull();
    expect(screen.getByText('Content')).not.toBeNull();

    // Should not have error, spotlight, or footer
    expect(screen.queryByRole('alert')).not.not.toBeNull();
    expect(document.querySelector('.studio-spotlight')).not.not.toBeNull();
  });
});