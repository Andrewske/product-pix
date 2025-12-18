/**
 * Primitives re-exported from shadcn/ui
 *
 * This file provides backward-compatible exports during the migration.
 * Components maintain the old API signatures through wrapper components.
 */

import * as React from 'react';
import {
  Table as ShadcnTableBase,
  TableBody as ShadcnTableBody,
  TableCell as ShadcnTableCell,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
  cn,
} from '../../shadcn';

// Re-export shadcn Button directly (variant names are compatible enough)
// Note: 'primary' -> 'default', so components may need updating
export { Button } from '../../shadcn';

// Re-export wrapper components that maintain the old API
export { SimpleSelect as Select } from '../../shadcn/wrappers';
export { SimpleInput as Input } from '../../shadcn/wrappers';
export { SimpleCard as Card } from '../../shadcn/wrappers';
export { SimpleBadge as Badge } from '../../shadcn/wrappers';
export { ProgressBar } from '../../shadcn/wrappers';

// Re-export shadcn Table components for direct use
export {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../shadcn';

// SimpleTable - maintains the old Table API with headers/rows
interface TableProps {
  headers: string[];
  rows: Array<Record<string, React.ReactNode>>;
  className?: string;
  onRowClick?: (row: Record<string, React.ReactNode>) => void;
}

export function Table({
  headers,
  rows,
  className,
  onRowClick,
}: TableProps): React.ReactElement {
  return (
    <div className={cn('overflow-x-auto rounded-md border', className)}>
      <ShadcnTableBase>
        <ShadcnTableHeader>
          <ShadcnTableRow>
            {headers.map((header) => (
              <ShadcnTableHead key={header}>{header}</ShadcnTableHead>
            ))}
          </ShadcnTableRow>
        </ShadcnTableHeader>
        <ShadcnTableBody>
          {rows.map((row, idx) => (
            <ShadcnTableRow
              key={idx}
              className={cn(onRowClick && 'cursor-pointer')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {Object.values(row).map((cell, cellIdx) => (
                <ShadcnTableCell key={cellIdx}>{cell}</ShadcnTableCell>
              ))}
            </ShadcnTableRow>
          ))}
        </ShadcnTableBody>
      </ShadcnTableBase>
    </div>
  );
}

// Also re-export commonly used shadcn components for direct use
export {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../shadcn';

export { Label, Textarea, Checkbox } from '../../shadcn';
export { Progress } from '../../shadcn';
export { Badge as ShadcnBadge, badgeVariants } from '../../shadcn';
export { Separator } from '../../shadcn';
export { Alert, AlertTitle, AlertDescription } from '../../shadcn';
export { Skeleton } from '../../shadcn';
export { cn } from '../../shadcn';
