import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../auth-layout';

describe('AuthLayout', () => {
  it('renders children with studio card variant', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    const card = document.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('matte-card', 'rounded-2xl', 'overflow-hidden');
  });

  it('displays title with text-3xl styling', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Content</div>
      </AuthLayout>
    );

    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-3xl');
  });

  it('displays error message using AlertBox when error prop provided', () => {
    render(
      <AuthLayout title="Test Title" error="Test error message">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    // AlertBox should be rendered with error variant
    const alertBox = screen.getByText('Test error message').closest('div');
    expect(alertBox).toHaveClass('bg-destructive/10', 'border-destructive/20', 'text-destructive');
  });

  it('renders spotlight background when showSpotlight is true', () => {
    render(
      <AuthLayout title="Test Title" showSpotlight>
        <div>Content</div>
      </AuthLayout>
    );

    const spotlight = document.querySelector('.studio-spotlight');
    expect(spotlight).toBeInTheDocument();
  });

  it('does not render spotlight background when showSpotlight is false', () => {
    render(
      <AuthLayout title="Test Title" showSpotlight={false}>
        <div>Content</div>
      </AuthLayout>
    );

    const spotlight = document.querySelector('.studio-spotlight');
    expect(spotlight).not.toBeInTheDocument();
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

    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders with default props (no error, no spotlight, no footer)', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();

    // Should not have error, spotlight, or footer
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.querySelector('.studio-spotlight')).not.toBeInTheDocument();
  });
});