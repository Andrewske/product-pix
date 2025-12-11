import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-muted border-t-accent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof spinnerVariants> {
  centered?: boolean
}

function Spinner({ size, centered = false, className, ...props }: SpinnerProps): React.ReactElement {
  const spinner = (
    <div
      className={cn(spinnerVariants({ size, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
  return centered ? <div className="flex items-center justify-center">{spinner}</div> : spinner
}

export { Spinner, spinnerVariants }
