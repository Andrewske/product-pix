import React from 'react';
import type { CardProps } from '../../types/index';

export function Card({ title, children, className }: CardProps): React.ReactElement {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className || ''}`}>
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
}