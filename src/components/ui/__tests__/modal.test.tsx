import { describe, it, expect, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '../dialog';

describe('Dialog/Modal Interaction Tests', () => {
  it('opens modal when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    // Initially, dialog content should not be visible
    expect(screen.queryByText('Dialog Title')).toBeNull();

    // Click trigger
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);

    // Dialog should now be visible
    await waitFor(() => {
      expect(screen.getByText('Dialog Title')).toBeDefined();
      expect(screen.getByText('Dialog content')).toBeDefined();
    });
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    // Dialog should be initially open
    expect(screen.getByText('Dialog Title')).toBeDefined();

    // Click close button
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Dialog Title')).toBeNull();
    });
  });

  it('closes modal when Escape key is pressed', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    // Dialog should be initially open
    expect(screen.getByText('Dialog Title')).toBeDefined();

    // Press Escape
    await user.keyboard('{Escape}');

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Dialog Title')).toBeNull();
    });
  });

  it('closes modal when clicking outside (on overlay)', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );

    // Dialog should be initially open
    expect(screen.getByText('Dialog Title')).toBeDefined();

    // Click on the overlay (outside the dialog content)
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeDefined();
    await user.click(overlay!);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Dialog Title')).toBeNull();
    });
  });

  it('maintains focus trap within modal', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <div>
            <button>First Button</button>
            <button>Second Button</button>
            <input type="text" placeholder="Input field" />
          </div>
        </DialogContent>
      </Dialog>
    );

    // Focus should be trapped within the dialog
    const firstButton = screen.getByRole('button', { name: 'First Button' });
    const secondButton = screen.getByRole('button', { name: 'Second Button' });
    const input = screen.getByPlaceholderText('Input field');
    const closeButton = screen.getByRole('button', { name: 'Close' });

    // Tab through elements
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    await user.tab();
    expect(document.activeElement).toBe(secondButton);

    await user.tab();
    expect(document.activeElement).toBe(input);

    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    // Next tab should cycle back to first button (focus trap)
    await user.tab();
    expect(document.activeElement).toBe(firstButton);
  });

  it('renders modal with proper structure when open', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <p>Long content that would normally cause scrolling</p>
        </DialogContent>
      </Dialog>
    );

    // Modal should be rendered with proper structure
    expect(screen.getByText('Dialog Title')).toBeDefined();
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeDefined();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeDefined();
  });

  it('shows backdrop/overlay when modal is open', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Overlay should be present
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeDefined();

    // Overlay should have the correct data attribute and classes
    expect(overlay?.getAttribute('data-slot')).toBe('dialog-overlay');
    expect(overlay?.classList.contains('fixed')).toBe(true);
    expect(overlay?.classList.contains('inset-0')).toBe(true);
  });

  it('renders modal content with proper accessibility attributes', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessible Dialog</DialogTitle>
            <DialogDescription>This is a description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Check ARIA attributes
    const dialog = document.querySelector('[data-slot="dialog-content"]');
    expect(dialog).toBeDefined();
    expect(dialog?.getAttribute('role')).toBe('dialog');

    // Title should have proper heading role
    const title = screen.getByText('Accessible Dialog');
    expect(title.tagName).toBe('H2'); // DialogTitle renders as h2

    // Description should be associated
    const description = screen.getByText('This is a description');
    expect(description.getAttribute('data-slot')).toBe('dialog-description');
  });

  it('supports custom close button behavior', async () => {
    const user = userEvent.setup();
    const onClose = mock(() => {});

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose onClick={onClose}>Custom Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const customClose = screen.getByRole('button', { name: 'Custom Close' });
    await user.click(customClose);

    expect(onClose).toHaveBeenCalled();
  });

  it('can be controlled programmatically', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Should be closed
    expect(screen.queryByText('Controlled Dialog')).toBeNull();

    // Re-render with open=true
    rerender(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Should be open
    expect(screen.getByText('Controlled Dialog')).toBeDefined();
  });

  it('supports custom styling and className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-dialog-class">
          <DialogTitle className="custom-title-class">Styled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const dialog = document.querySelector('[data-slot="dialog-content"]');
    const title = screen.getByText('Styled Dialog');

    expect(dialog?.classList.contains('custom-dialog-class')).toBe(true);
    expect(title.classList.contains('custom-title-class')).toBe(true);
  });
});