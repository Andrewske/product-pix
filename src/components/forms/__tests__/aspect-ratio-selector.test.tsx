import { render, screen, fireEvent } from '@testing-library/react';
import { AspectRatioSelector } from '../aspect-ratio-selector';

describe('AspectRatioSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders 6 aspect ratio buttons', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);

    // Check that all expected ratios are present
    expect(screen.getByText('1:1')).toBeInTheDocument();
    expect(screen.getByText('4:3')).toBeInTheDocument();
    expect(screen.getByText('3:4')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('3:2')).toBeInTheDocument();
  });

  it('applies selected styling to the current value', () => {
    render(<AspectRatioSelector value="4:3" onChange={mockOnChange} />);

    const selectedButton = screen.getByText('4:3');
    const unselectedButton = screen.getByText('1:1');

    // Selected button should have primary styling
    expect(selectedButton).toHaveClass('bg-primary/10');
    expect(selectedButton).toHaveClass('border-primary');
    expect(selectedButton).toHaveClass('text-primary');

    // Unselected button should have default styling
    expect(unselectedButton).toHaveClass('border-border');
    expect(unselectedButton).toHaveClass('hover:border-primary/50');
    expect(unselectedButton).toHaveClass('text-foreground');
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
      expect(button).toBeDisabled();
    });

    // Clicking disabled button should not call onChange
    fireEvent.click(buttons[0]);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('applies correct button styling classes', () => {
    render(<AspectRatioSelector value="1:1" onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm', 'font-medium', 'rounded-lg', 'border', 'transition-colors');
    });
  });
});