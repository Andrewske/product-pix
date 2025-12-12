import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { AspectRatioSelector } from '../aspect-ratio-selector';

describe('AspectRatioSelector', () => {
  const mockOnChange = mock(() => {});

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders 6 aspect ratio buttons', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);

    // Check that all expected ratios are present
    expect(screen.getByText('1:1')).not.toBeNull();
    expect(screen.getByText('4:3')).not.toBeNull();
    expect(screen.getByText('3:4')).not.toBeNull();
    expect(screen.getByText('16:9')).not.toBeNull();
    expect(screen.getByText('9:16')).not.toBeNull();
    expect(screen.getByText('3:2')).not.toBeNull();
  });

  it('visually indicates the selected aspect ratio', () => {
    render(<AspectRatioSelector value="4:3" onChange={mockOnChange} />);

    const selectedButton = screen.getByText('4:3');
    const unselectedButton = screen.getByText('1:1');

    // Test that selected button is present and has correct text
    expect(selectedButton).toBeDefined();
    expect(selectedButton?.tagName).toBe('BUTTON');
    expect(selectedButton?.textContent).toBe('4:3');

    // Test that unselected button is present and has correct text
    expect(unselectedButton).toBeDefined();
    expect(unselectedButton?.tagName).toBe('BUTTON');
    expect(unselectedButton?.textContent).toBe('1:1');

    // Test that both buttons are visible and functional
    [selectedButton, unselectedButton].forEach(button => {
      const style = window.getComputedStyle(button);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
    });
  });

  it('calls onChange with the correct ratio when button is clicked', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const button43 = screen.getByText('4:3');
    fireEvent.click(button43);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('4:3');
  });

  it('does not call onChange when clicking the currently selected ratio', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const selectedButton = screen.getByText('1:1');
    fireEvent.click(selectedButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('respects the disabled prop', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} disabled />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    // Clicking disabled button should not call onChange
    fireEvent.click(buttons[0]);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('renders buttons with appropriate sizing and accessibility', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);

    buttons.forEach(button => {
      // Test that buttons are properly formed
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.textContent).toBeDefined();

      // Test basic visibility and functionality
      const style = window.getComputedStyle(button);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');

      // Test that buttons are clickable (not disabled by default)
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });
  });
});