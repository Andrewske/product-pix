import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../auth-layout';

describe('AuthLayout', () => {
  it('renders children with studio card variant', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test content')).not.toBeNull();
    const card = document.querySelector('[data-slot="card"]');
    expect(card?.classList.contains('matte-card')).toBe(true);
    expect(card?.classList.contains('rounded-2xl')).toBe(true);
    expect(card?.classList.contains('overflow-hidden')).toBe(true);
  });

  it('displays title with text-3xl styling', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Content</div>
      </AuthLayout>
    );

    const title = screen.getByText('Test Title');
    expect(title?.classList.contains('text-3xl')).toBe(true);
  });

  it('displays error message using AlertBox when error prop provided', () => {
    render(
      <AuthLayout title="Test Title" error="Test error message">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test error message')).not.toBeNull();
    // AlertBox should be rendered with error variant
    const alertBox = screen.getByText('Test error message').closest('div');
    expect(alertBox?.classList.contains('bg-destructive/10')).toBe(true);
    expect(alertBox?.classList.contains('border-destructive/20')).toBe(true);
    expect(alertBox?.classList.contains('text-destructive')).toBe(true);
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