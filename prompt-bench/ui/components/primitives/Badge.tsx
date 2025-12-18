import React from 'react';
import type { BadgeProps } from '../../types/index';

const variantStyles = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-gray-100 text-gray-800',
};

export function Badge({ variant = 'info', children }: BadgeProps): React.ReactElement {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}