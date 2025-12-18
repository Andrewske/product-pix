import React from 'react';
import type { TableProps } from '../../types/index';

interface ExtendedTableProps extends TableProps {
  onRowClick?: (row: Record<string, React.ReactNode>) => void;
}

export function Table({ headers, rows, className, onRowClick }: ExtendedTableProps): React.ReactElement {
  return (
    <div className={`overflow-x-auto ${className || ''}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {Object.values(row).map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}