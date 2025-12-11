import { cn } from '@/lib/utils'

export type StepsProps = {
  children: React.ReactNode
  className?: string
}

export function Steps({ children, className }: StepsProps): React.ReactElement {
  return (
    <div className={cn('my-6 space-y-4', className)}>
      {children}
    </div>
  )
}

export type StepProps = {
  number: number
  title: string
  children: React.ReactNode
  className?: string
}

export function Step({ number, title, children, className }: StepProps): React.ReactElement {
  return (
    <div className={cn('flex gap-4', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="font-semibold text-foreground mb-2">{title}</h4>
        <div className="text-foreground/90 text-sm [&>p]:m-0 [&>p:not(:first-child)]:mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
