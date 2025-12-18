import React from 'react';
import type { ButtonProps } from '../../types/index';

const variantClasses = {
  primary: 'bg-green-600 hover:bg-green-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
  ghost: 'hover:bg-gray-100 text-gray-700'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}: ButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={`
        rounded font-medium transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}