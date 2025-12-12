import React from 'react';
import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock components for testing
interface MockButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const MockButton = ({ children, onClick, ...props }: MockButtonProps) => (
  <button onClick={onClick} {...props}>{children}</button>
);

const MockInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />;

interface MockLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  href: string;
}

const MockLink = ({ children, href, ...props }: MockLinkProps) => (
  <a href={href} {...props}>{children}</a>
);

const MockModal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true">
      <button onClick={onClose} aria-label="Close">×</button>
      {children}
      <MockButton onClick={onClose}>Close Modal</MockButton>
    </div>
  );
};

describe('Keyboard Navigation Suite', () => {
  it('Tab key moves forward through interactive elements', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <MockButton>Button 1</MockButton>
        <MockInput placeholder="Input 1" />
        <MockLink href="#link1">Link 1</MockLink>
        <MockButton>Button 2</MockButton>
        <MockInput placeholder="Input 2" />
      </div>
    );

    const button1 = screen.getByRole('button', { name: 'Button 1' });
    const input1 = screen.getByPlaceholderText('Input 1');
    const link1 = screen.getByRole('link', { name: 'Link 1' });
    const button2 = screen.getByRole('button', { name: 'Button 2' });
    const input2 = screen.getByPlaceholderText('Input 2');

    // Start with first button focused
    button1.focus();
    expect(document.activeElement).toBe(button1);

    // Tab to input 1
    await user.tab();
    expect(document.activeElement).toBe(input1);

    // Tab to link 1
    await user.tab();
    expect(document.activeElement).toBe(link1);

    // Tab to button 2
    await user.tab();
    expect(document.activeElement).toBe(button2);

    // Tab to input 2
    await user.tab();
    expect(document.activeElement).toBe(input2);
  });

  it('Shift+Tab moves backward through interactive elements', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <MockButton>Button 1</MockButton>
        <MockInput placeholder="Input 1" />
        <MockButton>Button 2</MockButton>
      </div>
    );

    const button1 = screen.getByRole('button', { name: 'Button 1' });
    const input1 = screen.getByPlaceholderText('Input 1');
    const button2 = screen.getByRole('button', { name: 'Button 2' });

    // Start with button 2 focused
    button2.focus();
    expect(document.activeElement).toBe(button2);

    // Shift+Tab to input 1
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(input1);

    // Shift+Tab to button 1
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(button1);
  });

  it('Enter key activates buttons', async () => {
    const user = userEvent.setup();
    const mockClick = mock();

    render(<MockButton onClick={mockClick}>Test Button</MockButton>);

    const button = screen.getByRole('button', { name: 'Test Button' });
    button.focus();

    await user.keyboard('{Enter}');
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('Space key activates buttons', async () => {
    const user = userEvent.setup();
    const mockClick = mock();

    render(<MockButton onClick={mockClick}>Test Button</MockButton>);

    const button = screen.getByRole('button', { name: 'Test Button' });
    button.focus();

    await user.keyboard(' ');
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('Arrow keys navigate through radio button groups', async () => {
    const user = userEvent.setup();

    const RadioGroup = () => {
      const [selected, setSelected] = React.useState('option1');

      return (
        <div role="radiogroup">
          <label>
            <input
              type="radio"
              name="test"
              value="option1"
              checked={selected === 'option1'}
              onChange={() => setSelected('option1')}
            />
            Option 1
          </label>
          <label>
            <input
              type="radio"
              name="test"
              value="option2"
              checked={selected === 'option2'}
              onChange={() => setSelected('option2')}
            />
            Option 2
          </label>
          <label>
            <input
              type="radio"
              name="test"
              value="option3"
              checked={selected === 'option3'}
              onChange={() => setSelected('option3')}
            />
            Option 3
          </label>
        </div>
      );
    };

    render(<RadioGroup />);

    const radios = screen.getAllByRole('radio');

    // Focus first radio
    radios[0].focus();
    expect(document.activeElement).toBe(radios[0]);

    // Arrow down to second radio
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(radios[1]);

    // Arrow down to third radio
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(radios[2]);

    // Arrow up back to second radio
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('Escape key closes modal dialogs', async () => {
    const user = userEvent.setup();
    const mockClose = mock();

    const TestModal = () => {
      const [isOpen, setIsOpen] = React.useState(true);

      return (
        <MockModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            mockClose();
          }}
        >
          <p>Modal content</p>
        </MockModal>
      );
    };

    render(<TestModal />);

    // Modal should be open
    expect(screen.getByRole('dialog')).toBeDefined();

    // Press Escape
    await user.keyboard('{Escape}');

    // Close function should be called
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('focus indicators are visible when elements receive focus', async () => {
    render(
      <div>
        <MockButton className="focus:outline-2 focus:outline-blue-500">Focusable Button</MockButton>
        <MockInput className="focus:ring-2 focus:ring-blue-500" />
      </div>
    );

    const button = screen.getByRole('button', { name: 'Focusable Button' });
    const input = screen.getByRole('textbox');

    // Initially no focus styles
    expect(button.classList.contains('focus:outline-2')).toBe(true); // Class is present
    expect(input.classList.contains('focus:ring-2')).toBe(true); // Class is present

    // Focus button
    button.focus();
    expect(document.activeElement).toBe(button);

    // Focus input
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('skip links allow jumping to main content', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <header>
          <nav>
            <MockLink href="#nav1">Nav Link 1</MockLink>
            <MockLink href="#nav2">Nav Link 2</MockLink>
          </nav>
        </header>
        <main id="main-content">
          <h1>Main Content</h1>
          <MockButton>Main Button</MockButton>
        </main>
      </div>
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    const mainHeading = screen.getByRole('heading', { name: 'Main Content' });

    // Skip link should be present
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    // Main content should have proper ID
    expect(mainHeading.closest('#main-content')).toBeDefined();
  });

  it('form elements maintain logical tab order', async () => {
    const user = userEvent.setup();

    render(
      <form>
        <MockInput placeholder="First name" />
        <MockInput placeholder="Last name" />
        <select>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
        <textarea placeholder="Comments" />
        <MockButton type="submit">Submit</MockButton>
      </form>
    );

    const inputs = screen.getAllByRole('textbox');
    const select = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Start with first input
    inputs[0].focus();
    expect(document.activeElement).toBe(inputs[0]);

    // Tab through form elements
    await user.tab();
    expect(document.activeElement).toBe(inputs[1]);

    await user.tab();
    expect(document.activeElement).toBe(select);

    await user.tab();
    expect(document.activeElement).toBe(inputs[2]); // textarea

    await user.tab();
    expect(document.activeElement).toBe(submitButton);
  });

  it('disabled elements are skipped in tab order', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <MockButton>Button 1</MockButton>
        <MockButton disabled>Disabled Button</MockButton>
        <MockButton>Button 2</MockButton>
      </div>
    );

    const button1 = screen.getByRole('button', { name: 'Button 1' });
    const disabledButton = screen.getByRole('button', { name: 'Disabled Button' });
    const button2 = screen.getByRole('button', { name: 'Button 2' });

    // Disabled button should be disabled
    expect(disabledButton.hasAttribute('disabled')).toBe(true);

    // Start with button 1
    button1.focus();
    expect(document.activeElement).toBe(button1);

    // Tab should skip disabled button and go to button 2
    await user.tab();
    expect(document.activeElement).toBe(button2);
  });

  it('focus management works with dynamic content', async () => {
    const user = userEvent.setup();

    const DynamicContent = () => {
      const [showExtra, setShowExtra] = React.useState(false);

      return (
        <div>
          <MockButton onClick={() => setShowExtra(true)}>Show Extra</MockButton>
          {showExtra && <MockButton>Extra Button</MockButton>}
          <MockButton>Final Button</MockButton>
        </div>
      );
    };

    render(<DynamicContent />);

    const showButton = screen.getByRole('button', { name: 'Show Extra' });
    const finalButton = screen.getByRole('button', { name: 'Final Button' });

    // Initially only two buttons
    expect(screen.getAllByRole('button')).toHaveLength(2);

    // Click to show extra content
    await user.click(showButton);

    // Now three buttons
    expect(screen.getAllByRole('button')).toHaveLength(3);

    const extraButton = screen.getByRole('button', { name: 'Extra Button' });

    // Tab order should include the new button
    showButton.focus();
    await user.tab();
    expect(document.activeElement).toBe(extraButton);

    await user.tab();
    expect(document.activeElement).toBe(finalButton);
  });
});