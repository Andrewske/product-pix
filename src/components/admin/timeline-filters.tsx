'use client';

import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Temporary local type unions until database enums are added
type CriticalErrorDomain = 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system';

// Domain options
const DOMAIN_OPTIONS: Array<{
  value: CriticalErrorDomain;
  label: string;
}> = [
  { value: 'payment', label: 'Payment' },
  { value: 'credit', label: 'Credit' },
  { value: 'generation', label: 'Generation' },
  { value: 'auth', label: 'Auth' },
  { value: 'validation', label: 'Validation' },
  { value: 'rate-limit', label: 'Rate Limit' },
  { value: 'system', label: 'System' },
];

interface TimelineFiltersProps {
  filters: {
    severity?: string;
    domain?: string;
    resolved: 'all' | 'unresolved' | 'resolved';
    days: number;
  };
  onChange: (filters: TimelineFiltersProps['filters']) => void;
}

export const TimelineFilters = memo(function TimelineFilters({ filters, onChange }: TimelineFiltersProps) {
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
            {DOMAIN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
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
});