'use client';

import { memo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimelineFiltersProps {
  filters: {
    types: string[];
    startDate?: string;
    endDate?: string;
  };
  onChange: (filters: TimelineFiltersProps['filters']) => void;
}

// Event type options
const EVENT_TYPE_OPTIONS: Array<{
  value: string;
  label: string;
  description: string;
}> = [
  { value: 'job', label: 'Jobs', description: 'Image generation jobs' },
  { value: 'transaction', label: 'Transactions', description: 'Credit purchases/refunds' },
  { value: 'message', label: 'Messages', description: 'User-admin communications' },
  { value: 'image', label: 'Images', description: 'Generated images' },
  { value: 'feedback', label: 'Feedback', description: 'User feedback on images' },
  { value: 'error', label: 'Errors', description: 'System errors' },
  { value: 'activity', label: 'Activity', description: 'User activities' },
  { value: 'upload', label: 'Uploads', description: 'File uploads' },
];

export const TimelineFilters = memo(function TimelineFilters({ filters, onChange }: TimelineFiltersProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleTypeToggle = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter(t => t !== type);
    onChange({ ...filters, types: newTypes });
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    onChange({
      ...filters,
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined
    });
    setStartDateOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onChange({
      ...filters,
      endDate: date ? format(date, 'yyyy-MM-dd') : undefined
    });
    setEndDateOpen(false);
  };

  const clearDateRange = () => {
    onChange({ ...filters, startDate: undefined, endDate: undefined });
  };

  return (
    <div className="space-y-4">
      {/* Event Types Filter */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Event Types</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EVENT_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-start space-x-2">
              <Checkbox
                id={`type-${option.value}`}
                checked={filters.types.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleTypeToggle(option.value, checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={`type-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Date Range</div>
          {(filters.startDate || filters.endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
              className="h-auto p-1 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal w-40',
                  !filters.startDate && 'text-muted-foreground'
                )}
                aria-label="Select start date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(new Date(filters.startDate), 'MMM dd') : 'Start date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                onSelect={handleStartDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal w-40',
                  !filters.endDate && 'text-muted-foreground'
                )}
                aria-label="Select end date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(new Date(filters.endDate), 'MMM dd') : 'End date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                onSelect={handleEndDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
});