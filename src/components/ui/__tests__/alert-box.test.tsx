import { render } from '@testing-library/react';
import { AlertBox } from '../alert-box';

describe('AlertBox', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(getByText('Error message')).toBeInTheDocument();
  });

  it('applies error variant styles', () => {
    const { container } = render(<AlertBox variant="error">Error</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert).toHaveClass('bg-destructive/10');
    expect(alert).toHaveClass('border-destructive/20');
    expect(alert).toHaveClass('text-destructive');
    expect(alert).toHaveClass('rounded');
    expect(alert).toHaveClass('border');
    expect(alert).toHaveClass('px-4');
    expect(alert).toHaveClass('py-3');
  });

  it('applies success variant styles', () => {
    const { container } = render(<AlertBox variant="success">Success</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert).toHaveClass('bg-success/10');
    expect(alert).toHaveClass('border-success/20');
    expect(alert).toHaveClass('text-success');
  });

  it('applies info variant styles', () => {
    const { container } = render(<AlertBox variant="info">Info</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert).toHaveClass('bg-info/10');
    expect(alert).toHaveClass('border-info/20');
    expect(alert).toHaveClass('text-info');
  });

  it('applies warning variant styles', () => {
    const { container } = render(<AlertBox variant="warning">Warning</AlertBox>);
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert).toHaveClass('bg-accent/10');
    expect(alert).toHaveClass('border-accent/20');
    expect(alert).toHaveClass('text-accent');
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <AlertBox variant="error" title="Error Title">
        Error message
      </AlertBox>
    );
    const title = getByText('Error Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('font-medium');
  });

  it('does not render title when not provided', () => {
    const { queryByRole } = render(<AlertBox variant="error">Error message</AlertBox>);
    expect(queryByRole('heading')).not.toBeInTheDocument();
  });

  it('merges className prop correctly', () => {
    const { container } = render(
      <AlertBox variant="error" className="custom-class">
        Error
      </AlertBox>
    );
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert).toHaveClass('custom-class');
    expect(alert).toHaveClass('bg-destructive/10');
  });

  it('passes through other props', () => {
    const { container } = render(
      <AlertBox variant="error" data-testid="alert-box">
        Error
      </AlertBox>
    );
    const alert = container.querySelector('div') as HTMLElement;
    expect(alert).toHaveAttribute('data-testid', 'alert-box');
  });
});