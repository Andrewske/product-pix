import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { FormField } from '../form-field';

describe('FormField', () => {
  it('renders label and input with correct structure', () => {
    const { getByText, getByRole } = render(
      <FormField label="Test Label" name="test" />
    );

    expect(getByText('Test Label')).not.toBeNull();
    const input = getByRole('textbox');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('name')).toBe('test');
  });

  it('applies space-y-2 spacing between elements', () => {
    const { container } = render(
      <FormField label="Test Label" name="test" />
    );

    const formField = container.firstChild as HTMLElement;
    expect(formField?.classList.contains('space-y-2')).toBe(true);
  });

  it('forwards all input props correctly', () => {
    const { getByRole } = render(
      <FormField
        label="Test Label"
        name="test"
        type="email"
        placeholder="Enter email"
        disabled
        required
        className="custom-input"
        data-testid="email-input"
      />
    );

    const input = getByRole('textbox');
    expect(input?.getAttribute('type')).toBe('email');
    expect(input?.getAttribute('placeholder')).toBe('Enter email');
    expect((input as HTMLInputElement).disabled).toBe(true);
    expect(input?.hasAttribute('required')).toBe(true);
    expect(input?.getAttribute('name')).toBe('test');
    expect(input?.getAttribute('data-testid')).toBe('email-input');
    expect(input?.classList.contains('custom-input')).toBe(true);
  });

  it('displays error message with destructive styling when error is provided', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" error="This field is required" />
    );

    const errorElement = getByText('This field is required');
    expect(errorElement).not.toBeNull();
    expect(errorElement?.classList.contains('text-destructive')).toBe(true);
  });

  it('does not display error message when no error is provided', () => {
    const { queryByText } = render(
      <FormField label="Test Label" name="test" />
    );

    expect(queryByText(/error|required|invalid/i)).not.not.toBeNull();
  });

  it('shows required indicator when required prop is true', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" required />
    );

    // The label should show some indication of being required
    // This could be an asterisk or aria-required attribute
    const label = getByText('Test Label');
    expect(label?.getAttribute('data-required')).toBe('true');
  });

  it('does not show required indicator when required prop is false or undefined', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" />
    );

    const label = getByText('Test Label');
    expect(label?.hasAttribute('data-required')).toBe(false);
  });

  it('associates label with input via htmlFor', () => {
    const { container, getByRole } = render(
      <FormField label="Test Label" name="test" />
    );

    const label = container.querySelector('label');
    const input = getByRole('textbox');

    expect(label?.getAttribute('for')).toBe(input.id);
  });

  it('applies container className correctly', () => {
    const { container } = render(
      <FormField
        label="Test Label"
        name="test"
        containerClassName="custom-field"
      />
    );

    const formField = container.firstChild as HTMLElement;
    expect(formField?.classList.contains('custom-field')).toBe(true);
    expect(formField?.classList.contains('space-y-2')).toBe(true);
  });
});