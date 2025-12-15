'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import type { UserListFilters } from '@/lib/db/admin-stats';

interface UserFiltersProps {
  filters: UserListFilters;
  onFiltersChange: (filters: UserListFilters) => void;
  isLoading?: boolean;
}

const DEBOUNCE_DELAY = 300;

export function UserFilters({ filters, onFiltersChange, isLoading }: UserFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [minCreditsValue, setMinCreditsValue] = useState(filters.minCredits?.toString() || '');
  const [maxCreditsValue, setMaxCreditsValue] = useState(filters.maxCredits?.toString() || '');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({
          ...filters,
          search: searchValue || undefined,
        });
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  const handleHasErrorsChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      hasErrors: checked ? true : undefined,
    });
  };

  const handleHasMessagesChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      hasMessages: checked ? true : undefined,
    });
  };

  const handleMinCreditsChange = (value: string) => {
    setMinCreditsValue(value);
    const numValue = value ? parseInt(value, 10) : undefined;
    if (numValue === undefined || !Number.isNaN(numValue)) {
      onFiltersChange({
        ...filters,
        minCredits: numValue,
      });
    }
  };

  const handleMaxCreditsChange = (value: string) => {
    setMaxCreditsValue(value);
    const numValue = value ? parseInt(value, 10) : undefined;
    if (numValue === undefined || !Number.isNaN(numValue)) {
      onFiltersChange({
        ...filters,
        maxCredits: numValue,
      });
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [UserListFilters['sortBy'], UserListFilters['sortOrder']];
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder,
    });
  };

  const clearFilters = () => {
    setSearchValue('');
    setMinCreditsValue('');
    setMaxCreditsValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.hasErrors !== undefined ||
    filters.hasMessages !== undefined ||
    filters.minCredits !== undefined ||
    filters.maxCredits !== undefined
  );

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by email or name..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Select
          value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`}
          onValueChange={handleSortChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="last_active-desc">Last Active</SelectItem>
            <SelectItem value="last_active-asc">Least Active</SelectItem>
            <SelectItem value="credit_balance-desc">Most Credits</SelectItem>
            <SelectItem value="credit_balance-asc">Least Credits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-errors"
            checked={filters.hasErrors === true}
            onCheckedChange={handleHasErrorsChange}
            disabled={isLoading}
          />
          <Label htmlFor="has-errors" className="text-sm">Has Errors (7 days)</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-messages"
            checked={filters.hasMessages === true}
            onCheckedChange={handleHasMessagesChange}
            disabled={isLoading}
          />
          <Label htmlFor="has-messages" className="text-sm">Has Messages</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="min-credits" className="text-sm">Min Credits:</Label>
          <Input
            id="min-credits"
            type="number"
            placeholder="0"
            value={minCreditsValue}
            onChange={(e) => handleMinCreditsChange(e.target.value)}
            className="w-20"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="max-credits" className="text-sm">Max Credits:</Label>
          <Input
            id="max-credits"
            type="number"
            placeholder="∞"
            value={maxCreditsValue}
            onChange={(e) => handleMaxCreditsChange(e.target.value)}
            className="w-20"
            disabled={isLoading}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={isLoading}
            className="ml-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}