import * as React from 'react'
import { Badge } from '@/components/ui/badge'

interface ProcessStepProps {
  step: number
  title: string
  description: string
  isLast?: boolean
}

export function ProcessStep({
  step,
  title,
  description,
  isLast = false,
}: ProcessStepProps): React.JSX.Element {
  return (
    <div className="relative flex items-start gap-4">
      {/* Badge with step number */}
      <div className="flex shrink-0 items-center justify-center">
        <Badge
          variant="default"
          className="flex h-8 w-8 items-center justify-center rounded-full p-0 text-sm font-medium"
        >
          {step}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 pb-8">
        <h3 className="font-display text-lg font-medium text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Connector line - positioned absolutely to align with badge center */}
      {!isLast && (
        <div
          className="absolute left-4 top-8 h-full w-px bg-border"
          style={{ height: 'calc(100% - 1rem)' }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}