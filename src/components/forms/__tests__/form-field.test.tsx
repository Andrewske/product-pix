import { render } from '@testing-library/react';
import { FormField } from '../form-field';

describe('FormField', () => {
  it('renders label and input with correct structure', () => {
    const { getByText, getByRole } = render(
      <FormField label="Test Label" name="test" />
    );

    expect(getByText('Test Label')).toBeInTheDocument();
    const input = getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'test');
  });

  it('applies space-y-2 spacing between elements', () => {
    const { container } = render(
      <FormField label="Test Label" name="test" />
    );

    const formField = container.firstChild as HTMLElement;
    expect(formField).toHaveClass('space-y-2');
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
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('disabled');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('name', 'test');
    expect(input).toHaveAttribute('data-testid', 'email-input');
    expect(input).toHaveClass('custom-input');
  });

  it('displays error message with destructive styling when error is provided', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" error="This field is required" />
    );

    const errorElement = getByText('This field is required');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('text-destructive');
  });

  it('does not display error message when no error is provided', () => {
    const { queryByText } = render(
      <FormField label="Test Label" name="test" />
    );

    expect(queryByText(/error|required|invalid/i)).not.toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" required />
    );

    // The label should show some indication of being required
    // This could be an asterisk or aria-required attribute
    const label = getByText('Test Label');
    expect(label).toHaveAttribute('data-required', 'true');
  });

  it('does not show required indicator when required prop is false or undefined', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" />
    );

    const label = getByText('Test Label');
    expect(label).not.toHaveAttribute('data-required');
  });

  it('associates label with input via htmlFor', () => {
    const { container, getByRole } = render(
      <FormField label="Test Label" name="test" />
    );

    const label = container.querySelector('label');
    const input = getByRole('textbox');

    expect(label).toHaveAttribute('for', input.id);
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
    expect(formField).toHaveClass('custom-field');
    expect(formField).toHaveClass('space-y-2');
  });
});