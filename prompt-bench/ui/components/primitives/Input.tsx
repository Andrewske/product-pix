import React from 'react';
import type { InputProps } from '../../types/index';

export function Input({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  disabled,
  error
}: InputProps): React.ReactElement {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
}