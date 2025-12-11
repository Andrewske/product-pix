import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertBoxVariants = cva(
  'rounded border px-4 py-3',
  {
    variants: {
      variant: {
        error: 'bg-destructive/10 border-destructive/20 text-destructive',
        success: 'bg-success/10 border-success/20 text-success',
        info: 'bg-info/10 border-info/20 text-info',
        warning: 'bg-accent/10 border-accent/20 text-accent',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

interface AlertBoxProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof alertBoxVariants> {
  title?: string
}

function AlertBox({
  className,
  variant,
  title,
  children,
  ...props
}: AlertBoxProps): React.ReactElement {
  return (
    <div
      className={cn(alertBoxVariants({ variant }), className)}
      {...props}
    >
      {title && (
        <div className="font-medium">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

export { AlertBox, alertBoxVariants }