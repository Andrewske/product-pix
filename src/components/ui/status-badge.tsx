import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      status: {
        pending: 'bg-info/10 text-info border-info/30',
        processing: 'bg-accent/10 text-accent border-accent/30',
        completed: 'bg-success/10 text-success border-success/30',
        failed: 'bg-destructive/10 text-destructive border-destructive/30',
        cancelled: 'bg-muted text-muted-foreground border-muted',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  },
)

interface StatusBadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({
  className,
  status,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    />
  )
}

export { StatusBadge, statusBadgeVariants }