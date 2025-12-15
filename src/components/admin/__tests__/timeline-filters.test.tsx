import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineFilters } from '../timeline-filters';

describe('TimelineFilters', () => {
  const mockOnChange = mock();

  const defaultFilters = {
    types: [],
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders component without crashing', () => {
    expect(() => {
      render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
    }).not.toBeNull();
  });

  it('renders event type checkboxes', () => {
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    // Check that event type labels are present
    expect(screen.getByText('Jobs')).toBeDefined();
    expect(screen.getByText('Transactions')).toBeDefined();
    expect(screen.getByText('Messages')).toBeDefined();
    expect(screen.getByText('Images')).toBeDefined();
    expect(screen.getByText('Feedback')).toBeDefined();
    expect(screen.getByText('Errors')).toBeDefined();
    expect(screen.getByText('Activity')).toBeDefined();
    expect(screen.getByText('Uploads')).toBeDefined();
  });

  it('renders date range controls', () => {
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    // Check that date range section is present
    expect(screen.getByText('Date Range')).toBeDefined();
    expect(screen.getByText('Start date')).toBeDefined();
    expect(screen.getByText('End date')).toBeDefined();
  });

  it('toggles event type filters', async () => {
    const user = userEvent.setup();

    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const jobCheckbox = screen.getByLabelText('Jobs');
    await user.click(jobCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      types: ['job'],
    });
  });

  it('removes event type when unchecked', async () => {
    const user = userEvent.setup();
    const filtersWithJob = { types: ['job'] };

    render(<TimelineFilters filters={filtersWithJob} onChange={mockOnChange} />);

    const jobCheckbox = screen.getByLabelText('Jobs');
    await user.click(jobCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...filtersWithJob,
      types: [],
    });
  });

  it('handles multiple event type selections', async () => {
    const user = userEvent.setup();
    const filtersWithJob = { types: ['job'] };

    render(<TimelineFilters filters={filtersWithJob} onChange={mockOnChange} />);

    const transactionCheckbox = screen.getByLabelText('Transactions');
    await user.click(transactionCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...filtersWithJob,
      types: ['job', 'transaction'],
    });
  });
});