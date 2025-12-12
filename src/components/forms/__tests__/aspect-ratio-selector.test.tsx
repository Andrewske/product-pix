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

  it('applies selected styling to the current value', () => {
    render(<AspectRatioSelector value="4:3" onChange={mockOnChange} />);

    const selectedButton = screen.getByText('4:3');
    const unselectedButton = screen.getByText('1:1');

    // Selected button should have primary styling
    expect(selectedButton?.classList.contains('bg-primary/10')).toBe(true);
    expect(selectedButton?.classList.contains('border-primary')).toBe(true);
    expect(selectedButton?.classList.contains('text-primary')).toBe(true);

    // Unselected button should have default styling
    expect(unselectedButton?.classList.contains('border-border')).toBe(true);
    expect(unselectedButton?.classList.contains('hover:border-primary/50')).toBe(true);
    expect(unselectedButton?.classList.contains('text-foreground')).toBe(true);
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

  it('applies correct button styling classes', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button?.classList.contains('px-4')).toBe(true);
      expect(button?.classList.contains('py-2')).toBe(true);
      expect(button?.classList.contains('text-sm')).toBe(true);
      expect(button?.classList.contains('font-medium')).toBe(true);
      expect(button?.classList.contains('rounded-lg')).toBe(true);
      expect(button?.classList.contains('border')).toBe(true);
      expect(button?.classList.contains('transition-colors')).toBe(true);
    });
  });
});