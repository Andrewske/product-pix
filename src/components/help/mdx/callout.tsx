import { cva, type VariantProps } from 'class-variance-authority'
import { Info, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const calloutVariants = cva(
  'my-6 flex gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        info: 'border-info/30 bg-info/10 text-foreground [&>svg]:text-info',
        warning: 'border-destructive/30 bg-destructive/10 text-foreground [&>svg]:text-destructive',
        tip: 'border-accent/30 bg-accent/10 text-foreground [&>svg]:text-accent',
        success: 'border-success/30 bg-success/10 text-foreground [&>svg]:text-success',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

const icons = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  success: CheckCircle,
} as const

export type CalloutProps = {
  variant?: 'info' | 'warning' | 'tip' | 'success'
  title?: string
  children: React.ReactNode
  className?: string
}

export function Callout({
  variant = 'info',
  title,
  children,
  className,
}: CalloutProps): React.ReactElement {
  const Icon = icons[variant]

  return (
    <div className={cn(calloutVariants({ variant }), className)} role="alert">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        {title && (
          <p className="font-medium leading-none">{title}</p>
        )}
        <div className="text-foreground/90 [&>p]:m-0 [&>p:not(:first-child)]:mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
