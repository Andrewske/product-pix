import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-muted',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
      },
      variant: {
        default: 'border-t-accent',
        teal: 'border-t-teal',
      },
    },
    defaultVariants: { size: 'md', variant: 'default' },
  }
)

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof spinnerVariants> {
  centered?: boolean
}

function Spinner({ size, variant, centered = false, className, ...props }: SpinnerProps): React.ReactElement {
  const spinner = (
    <div
      className={cn(spinnerVariants({ size, variant, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
  return centered ? <div className="flex items-center justify-center">{spinner}</div> : spinner
}

export { Spinner, spinnerVariants }
