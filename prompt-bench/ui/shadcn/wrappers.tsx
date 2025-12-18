/**
 * Wrapper components to maintain backward compatibility during migration
 * These wrap shadcn components with the old API signatures
 */

import * as React from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input as ShadcnInput } from '@/components/ui/input';
import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// SimpleSelect - maintains the old Select API
// ============================================================================

interface SimpleSelectProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SimpleSelect({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: SimpleSelectProps): React.ReactElement {
  const id = React.useId();

  // Find placeholder option (empty value) and filter it out from items
  const placeholderOption = options.find((opt) => opt.value === '');
  const validOptions = options.filter((opt) => opt.value !== '');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <ShadcnSelect
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholderOption?.label || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {validOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    </div>
  );
}

// ============================================================================
// ProgressBar - maintains the old ProgressBar API with current/total
// ============================================================================

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  label,
  className,
}: ProgressBarProps): React.ReactElement {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">
          {label || 'Progress'}
        </span>
        <span className="font-medium text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2.5" />
    </div>
  );
}

// ============================================================================
// SimpleCard - maintains the old Card API with title prop
// ============================================================================

interface SimpleCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SimpleCard({
  title,
  children,
  className,
}: SimpleCardProps): React.ReactElement {
  return (
    <ShadcnCard className={cn(className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? undefined : 'pt-6'}>{children}</CardContent>
    </ShadcnCard>
  );
}

// ============================================================================
// SimpleInput - maintains the old Input API with label and onChange(value)
// ============================================================================

interface SimpleInputProps {
  type?: 'text' | 'number' | 'email' | 'password';
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function SimpleInput({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  className,
}: SimpleInputProps): React.ReactElement {
  const id = React.useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <ShadcnInput
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && 'border-destructive')}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================================
// SimpleBadge - maintains the old Badge API with variant mapping
// ============================================================================

interface SimpleBadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const badgeVariantMap: Record<
  NonNullable<SimpleBadgeProps['variant']>,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  success: 'default', // Primary green
  warning: 'secondary',
  error: 'destructive',
  info: 'outline',
};

export function SimpleBadge({
  variant = 'info',
  children,
  className,
}: SimpleBadgeProps): React.ReactElement {
  return (
    <ShadcnBadge
      variant={badgeVariantMap[variant]}
      className={cn(
        // Add custom colors for success/warning since shadcn doesn't have them
        variant === 'success' && 'bg-primary text-primary-foreground',
        variant === 'warning' &&
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        className
      )}
    >
      {children}
    </ShadcnBadge>
  );
}
