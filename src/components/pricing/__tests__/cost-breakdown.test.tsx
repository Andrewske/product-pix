import { CostBreakdown } from '@/components/pricing/cost-breakdown';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';

describe('CostBreakdown', () => {
  it('renders without errors', () => {
    render(<CostBreakdown resolution="1k" mode="lightning" />);
    expect(screen.getByLabelText('Cost breakdown')).toBeDefined();
  });

  it('shows base generation cost correctly for lightning mode', () => {
    render(<CostBreakdown resolution="1k" mode="lightning" />);

    expect(screen.getByText('1 image (1024px):')).toBeDefined();
    expect(screen.getByText('30 credits', { selector: '.font-mono:not(.font-semibold)' })).toBeDefined();
    expect(screen.getByText('(lightning rate)')).toBeDefined();
    expect(screen.getByText('Total:')).toBeDefined();
    expect(screen.getByText('30 credits', { selector: '.font-mono.font-semibold.text-lg' })).toBeDefined();
  });

  it('shows base generation cost correctly for snail mode', () => {
    render(<CostBreakdown resolution="1k" mode="snail" />);

    expect(screen.getByText('1 image (1024px):')).toBeDefined();
    expect(screen.getByText('15 credits', { selector: '.font-mono:not(.font-semibold)' })).toBeDefined();
    expect(screen.getByText('Total:')).toBeDefined();
    expect(screen.getByText('15 credits', { selector: '.font-mono.font-semibold.text-lg' })).toBeDefined();
  });

  it('shows snail discount with dynamically calculated percentage', () => {
    render(<CostBreakdown resolution="1k" mode="snail" />);

    expect(screen.getByText('Snail mode discount:')).toBeDefined();
    expect(screen.getByText('-15 credits (50% off)')).toBeDefined();
  });

  it('supports optional addons array', () => {
    render(<CostBreakdown resolution="1k" mode="lightning" addons={['titleGeneration']} />);

    expect(screen.getByText('title generation:')).toBeDefined();
    expect(screen.getByText('50 credits', { selector: '.font-mono:not(.font-semibold)' })).toBeDefined();
    expect(screen.getByText('Total:')).toBeDefined();
    expect(screen.getByText('80 credits', { selector: '.font-mono.font-semibold.text-lg' })).toBeDefined();
  });

  it('calculates total correctly with multiple addons', () => {
    render(<CostBreakdown resolution="1k" mode="lightning" addons={['titleGeneration', 'fancyBackground']} />);

    expect(screen.getByText('title generation:')).toBeDefined();
    expect(screen.getAllByText('50 credits')).toHaveLength(1);
    expect(screen.getByText('fancy background:')).toBeDefined();
    expect(screen.getAllByText('10 credits')).toHaveLength(1);
    expect(screen.getByText('Total:')).toBeDefined();
    expect(screen.getByText('90 credits', { selector: '.font-mono.font-semibold.text-lg' })).toBeDefined();
  });

  it('supports variant prop for different display contexts', () => {
    const { rerender } = render(<CostBreakdown resolution="1k" mode="lightning" variant="default" />);

    expect(screen.getByText('Cost Breakdown:')).toBeDefined();

    rerender(<CostBreakdown resolution="1k" mode="lightning" variant="compact" />);

    expect(screen.queryByText('Cost Breakdown:')).toBeNull();
  });

  it('displays correct resolution labels', () => {
    const { rerender } = render(<CostBreakdown resolution="1k" mode="lightning" />);
    expect(screen.getByText('1 image (1024px):')).toBeDefined();

    rerender(<CostBreakdown resolution="2k" mode="lightning" />);
    expect(screen.getByText('1 image (2048px):')).toBeDefined();

    rerender(<CostBreakdown resolution="4k" mode="lightning" />);
    expect(screen.getByText('1 image (4096px):')).toBeDefined();
  });

  it('has proper accessibility attributes', () => {
    render(<CostBreakdown resolution="1k" mode="lightning" />);

    const section = screen.getByLabelText('Cost breakdown');
    expect(section.tagName).toBe('SECTION');
  });

  it('applies custom className', () => {
    render(<CostBreakdown resolution="1k" mode="lightning" className="custom-class" />);

    const section = screen.getByLabelText('Cost breakdown');
    expect(section.classList.contains('custom-class')).toBe(true);
  });
});