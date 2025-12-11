'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps extends Omit<React.ComponentProps<'input'>, 'className'> {
  label: string;
  error?: string;
  className?: string; // For the input
  containerClassName?: string; // For the container
}

export function FormField({
  label,
  error,
  className,
  containerClassName,
  id,
  ...inputProps
}: FormFieldProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Label htmlFor={inputId} data-required={inputProps.required}>
        {label}
      </Label>
      <Input id={inputId} className={className} {...inputProps} />
      {error && (
        <p className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}