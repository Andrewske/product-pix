import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { AlertBox } from '../alert-box';

describe('AlertBox', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(getByText('Error message')).not.toBeNull();
  });

  it('applies error variant styles', () => {
    const { container } = render(<AlertBox variant="error">Error</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert?.classList.contains('bg-destructive/10')).toBe(true);
    expect(alert?.classList.contains('border-destructive/20')).toBe(true);
    expect(alert?.classList.contains('text-destructive')).toBe(true);
    expect(alert?.classList.contains('rounded')).toBe(true);
    expect(alert?.classList.contains('border')).toBe(true);
    expect(alert?.classList.contains('px-4')).toBe(true);
    expect(alert?.classList.contains('py-3')).toBe(true);
  });

  it('applies success variant styles', () => {
    const { container } = render(<AlertBox variant="success">Success</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert?.classList.contains('bg-success/10')).toBe(true);
    expect(alert?.classList.contains('border-success/20')).toBe(true);
    expect(alert?.classList.contains('text-success')).toBe(true);
  });

  it('applies info variant styles', () => {
    const { container } = render(<AlertBox variant="info">Info</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert?.classList.contains('bg-info/10')).toBe(true);
    expect(alert?.classList.contains('border-info/20')).toBe(true);
    expect(alert?.classList.contains('text-info')).toBe(true);
  });

  it('applies warning variant styles', () => {
    const { container } = render(<AlertBox variant="warning">Warning</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert?.classList.contains('bg-accent/10')).toBe(true);
    expect(alert?.classList.contains('border-accent/20')).toBe(true);
    expect(alert?.classList.contains('text-accent')).toBe(true);
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <AlertBox variant="error" title="Error Title">
        Error message
      </AlertBox>
    );
    const title = getByText('Error Title');
    expect(title).not.toBeNull();
    expect(title?.classList.contains('font-medium')).toBe(true);
  });

  it('does not render title when not provided', () => {
    const { queryByRole } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(queryByRole('heading')).not.not.toBeNull();
  });

  it('merges className prop correctly', () => {
    const { container } = render(
      <AlertBox variant="error" className="custom-class">
        Error
      </AlertBox>
    );
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert?.classList.contains('custom-class')).toBe(true);
    expect(alert?.classList.contains('bg-destructive/10')).toBe(true);
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