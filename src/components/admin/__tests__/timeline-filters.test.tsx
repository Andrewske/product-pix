import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineFilters } from '../timeline-filters';

describe('TimelineFilters', () => {
  const mockOnChange = jest.fn();

  const defaultFilters = {
    severity: undefined,
    domain: undefined,
    resolved: 'all' as const,
    days: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders component without crashing', () => {
    expect(() => {
      render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
    }).not.toThrow();
  });

  it('renders all filter controls', () => {
    const { container } = render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    // Check if the component rendered something
    expect(container.firstChild).not.toBeNull();

    // Try to find the labels
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBe(4); // Should have 4 labels
  });

  it('displays all severity options', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const severitySelect = screen.getByText('Severity').nextElementSibling;
    if (severitySelect) {
      await user.click(severitySelect);
    }

    expect(screen.getByText('All')).not.toBeNull();
    expect(screen.getByText('Critical')).not.toBeNull();
    expect(screen.getByText('High')).not.toBeNull();
    expect(screen.getByText('Medium')).not.toBeNull();
    expect(screen.getByText('Low')).not.toBeNull();
  });

  it('displays all domain options from database enum', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const domainSelect = screen.getByLabelText('Domain');
    await user.click(domainSelect);

    expect(screen.getByText('All')).not.toBeNull();
    expect(screen.getByText('Payment')).not.toBeNull();
    expect(screen.getByText('Credit')).not.toBeNull();
    expect(screen.getByText('Generation')).not.toBeNull();
    expect(screen.getByText('Auth')).not.toBeNull();
    expect(screen.getByText('Validation')).not.toBeNull();
    expect(screen.getByText('Rate Limit')).not.toBeNull();
    expect(screen.getByText('System')).not.toBeNull();
  });

  it('displays all status options', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const statusSelect = screen.getByLabelText('Status');
    await user.click(statusSelect);

    expect(screen.getByText('All')).not.toBeNull();
    expect(screen.getByText('Unresolved')).not.toBeNull();
    expect(screen.getByText('Resolved')).not.toBeNull();
  });

  it('displays all time range options', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const timeRangeSelect = screen.getByLabelText('Time Range');
    await user.click(timeRangeSelect);

    expect(screen.getByText('Last 7 days')).not.toBeNull();
    expect(screen.getByText('Last 30 days')).not.toBeNull();
    expect(screen.getByText('Last 90 days')).not.toBeNull();
  });

  it('calls onChange when severity filter is changed', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const severitySelect = screen.getByLabelText('Severity');
    await user.click(severitySelect);
    await user.click(screen.getByText('High'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      severity: 'high',
    });
  });

  it('calls onChange when domain filter is changed', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const domainSelect = screen.getByLabelText('Domain');
    await user.click(domainSelect);
    await user.click(screen.getByText('Payment'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      domain: 'payment',
    });
  });

  it('calls onChange when status filter is changed', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const statusSelect = screen.getByLabelText('Status');
    await user.click(statusSelect);
    await user.click(screen.getByText('Resolved'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      resolved: 'resolved',
    });
  });

  it('calls onChange when time range filter is changed', async () => {
    const user = userEvent.setup();
    render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);

    const timeRangeSelect = screen.getByLabelText('Time Range');
    await user.click(timeRangeSelect);
    await user.click(screen.getByText('Last 7 days'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      days: 7,
    });
  });

  it('resets filter to undefined when "All" is selected', async () => {
    const user = userEvent.setup();
    const filtersWithValues = {
      ...defaultFilters,
      severity: 'high' as const,
      domain: 'payment' as const,
    };

    render(<TimelineFilters filters={filtersWithValues} onChange={mockOnChange} />);

    const severitySelect = screen.getByLabelText('Severity');
    await user.click(severitySelect);
    await user.click(screen.getByText('All'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...filtersWithValues,
      severity: undefined,
    });
  });
});