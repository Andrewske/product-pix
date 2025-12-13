'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimelineFiltersProps {
  filters: {
    severity?: string;
    domain?: string;
    resolved: 'all' | 'unresolved' | 'resolved';
    days: number;
  };
  onChange: (filters: TimelineFiltersProps['filters']) => void;
}

export function TimelineFilters({ filters, onChange }: TimelineFiltersProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex flex-col gap-1">
        <label htmlFor="severity-select" className="text-sm font-medium">Severity</label>
        <Select
          value={filters.severity || 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              severity: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger id="severity-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="domain-select" className="text-sm font-medium">Domain</label>
        <Select
          value={filters.domain || 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              domain: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger id="domain-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
            <SelectItem value="generation">Generation</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
            <SelectItem value="rate-limit">Rate Limit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status-select" className="text-sm font-medium">Status</label>
        <Select
          value={filters.resolved}
          onValueChange={(value: 'all' | 'unresolved' | 'resolved') =>
            onChange({
              ...filters,
              resolved: value,
            })
          }
        >
          <SelectTrigger id="status-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="time-range-select" className="text-sm font-medium">Time Range</label>
        <Select
          value={filters.days.toString()}
          onValueChange={(value) =>
            onChange({
              ...filters,
              days: parseInt(value, 10),
            })
          }
        >
          <SelectTrigger id="time-range-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}