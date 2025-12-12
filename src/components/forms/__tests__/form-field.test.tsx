import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders form field with proper structure', () => {
    const { container, getByText, getByRole } = render(
      <FormField label="Test Label" name="test" />
    );

    const formField = container.firstChild as HTMLElement;
    expect(formField).toBeDefined();
    expect(formField?.tagName).toBe('DIV');

    expect(getByText('Test Label')).toBeDefined();
    expect(getByRole('textbox')).toBeDefined();

    // Test that container is visible
    const style = window.getComputedStyle(formField);
    expect(style.display).not.toBe('none');
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

  it('displays error message when error is provided', () => {
    const { getByText } = render(
      <FormField label="Test Label" name="test" error="This field is required" />
    );

    const errorElement = getByText('This field is required');
    expect(errorElement).toBeDefined();
    expect(errorElement?.tagName).toBe('P');
    expect(errorElement?.textContent).toBe('This field is required');

    // Test that error is visible
    const style = window.getComputedStyle(errorElement);
    expect(style.display).not.toBe('none');
  });

  it('does not display error message when no error is provided', () => {
    const { queryByText } = render(
      <FormField label="Test Label" name="test" />
    );

    expect(queryByText(/error|required|invalid/i)).toBeNull();
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
    const { container, getByText } = render(
      <FormField
        label="Test Label"
        name="test"
        containerClassName="custom-field"
      />
    );

    const formField = container.firstChild as HTMLElement;
    expect(getByText('Test Label')).toBeDefined();

    // Test that custom class is applied (behavioral test of customization)
    expect(formField?.classList.contains('custom-field')).toBe(true);

    const style = window.getComputedStyle(formField);
    expect(style.display).not.toBe('none');
  });

  describe('Validation and User Interactions', () => {
    it('updates input value when user types', async () => {
      const user = userEvent.setup();
      const { getByRole } = render(
        <FormField label="Test Input" name="test" />
      );

      const input = getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    it('displays error message when error prop is provided', () => {
      render(
        <FormField
          label="Email"
          name="email"
          error="This field is required"
        />
      );

      const errorElement = screen.getByText('This field is required');
      expect(errorElement).toBeDefined();
      expect(errorElement.tagName).toBe('P');
      expect(errorElement.classList.contains('text-destructive')).toBe(true);
      expect(errorElement.classList.contains('text-sm')).toBe(true);
    });

    it('clears error display when error prop is removed', () => {
      const { rerender } = render(
        <FormField
          label="Email"
          name="email"
          error="This field is required"
        />
      );

      expect(screen.getByText('This field is required')).toBeDefined();

      // Remove error
      rerender(
        <FormField
          label="Email"
          name="email"
          error=""
        />
      );

      expect(screen.queryByText('This field is required')).toBeNull();
    });

    it('shows email validation error when invalid format provided', () => {
      render(
        <FormField
          label="Email"
          name="email"
          type="email"
          error="Please enter a valid email address"
        />
      );

      const errorElement = screen.getByText('Please enter a valid email address');
      expect(errorElement).toBeDefined();
    });

    it('shows number validation error for out of range values', () => {
      render(
        <FormField
          label="Age"
          name="age"
          type="number"
          error="Age must be between 18 and 120"
        />
      );

      const errorElement = screen.getByText('Age must be between 18 and 120');
      expect(errorElement).toBeDefined();
    });

    it('prevents input when disabled', async () => {
      const user = userEvent.setup();
      const { getByRole } = render(
        <FormField
          label="Disabled Input"
          name="disabled"
          disabled
        />
      );

      const input = getByRole('textbox') as HTMLInputElement;
      expect(input.disabled).toBe(true);

      // Try to type - should not change value
      await user.type(input, 'test');
      expect(input.value).toBe('');
    });

    it('maintains error state while user types correction', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <FormField
          label="Email"
          name="email"
          type="email"
          error="Invalid email format"
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(screen.getByText('Invalid email format')).toBeDefined();

      // User starts typing correction
      await user.clear(input);
      await user.type(input, 'user@');

      // Error should still be visible until validation clears it
      expect(screen.getByText('Invalid email format')).toBeDefined();
    });

    it('clears error when valid input is entered', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <FormField
          label="Email"
          name="email"
          type="email"
          error="Invalid email format"
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(screen.getByText('Invalid email format')).toBeDefined();

      // Simulate correction and error clearing
      await user.clear(input);
      await user.type(input, 'valid@email.com');

      // Re-render without error (simulating validation clearing)
      rerender(
        <FormField
          label="Email"
          name="email"
          type="email"
          error=""
        />
      );

      expect(screen.queryByText('Invalid email format')).toBeNull();
    });

    describe('Accessibility', () => {
      it('associates label with input via htmlFor', () => {
        const { container, getByRole } = render(
          <FormField label="Test Label" name="test" />
        );

        const label = container.querySelector('label');
        const input = getByRole('textbox');

        expect(label?.getAttribute('for')).toBe(input.id);
      });

      it('marks required fields with aria-required', () => {
        const { getByRole } = render(
          <FormField label="Required Field" name="required" required />
        );

        const input = getByRole('textbox');
        expect(input.getAttribute('aria-required')).toBe('true');
      });

      it('does not set aria-required for optional fields', () => {
        const { getByRole } = render(
          <FormField label="Optional Field" name="optional" />
        );

        const input = getByRole('textbox');
        expect(input.hasAttribute('aria-required')).toBe(false);
      });

      it('marks invalid fields with aria-invalid when error present', () => {
        const { getByRole } = render(
          <FormField
            label="Email"
            name="email"
            error="Invalid email"
          />
        );

        const input = getByRole('textbox');
        expect(input.getAttribute('aria-invalid')).toBe('true');
      });

      it('does not set aria-invalid when no error', () => {
        const { getByRole } = render(
          <FormField label="Valid Field" name="valid" />
        );

        const input = getByRole('textbox');
        expect(input.hasAttribute('aria-invalid')).toBe(false);
      });

      it('associates error message with input via aria-describedby', () => {
        const { getByRole, getByText } = render(
          <FormField
            label="Email"
            name="email"
            error="Invalid email"
          />
        );

        const input = getByRole('textbox');
        const errorElement = getByText('Invalid email');

        expect(input.getAttribute('aria-describedby')).toBe(errorElement.id);
        expect(errorElement.getAttribute('role')).toBe('alert');
      });

      it('does not set aria-describedby when no error', () => {
        const { getByRole } = render(
          <FormField label="Valid Field" name="valid" />
        );

        const input = getByRole('textbox');
        expect(input.hasAttribute('aria-describedby')).toBe(false);
      });

      it('supports keyboard navigation with tab order', async () => {
        const user = userEvent.setup();
        const { getByRole } = render(
          <div>
            <FormField label="First Field" name="first" />
            <FormField label="Second Field" name="second" />
          </div>
        );

        const firstInput = screen.getByLabelText('First Field');
        const secondInput = screen.getByLabelText('Second Field');

        // Focus first input
        firstInput.focus();
        expect(document.activeElement).toBe(firstInput);

        // Tab to second input
        await user.tab();
        expect(document.activeElement).toBe(secondInput);

        // Tab back to first input
        await user.tab({ shift: true });
        expect(document.activeElement).toBe(firstInput);
      });
    });
  });
});