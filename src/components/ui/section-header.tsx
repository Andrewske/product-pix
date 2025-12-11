import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  badge?: string
  description?: string
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, badge, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-center mb-12", className)}
        {...props}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        {description && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>
    )
  }
)
SectionHeader.displayName = "SectionHeader"

export { SectionHeader }