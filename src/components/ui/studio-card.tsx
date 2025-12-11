import * as React from "react"
import { cn } from "@/lib/utils"

export interface StudioCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

const StudioCard = React.forwardRef<HTMLDivElement, StudioCardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "matte-card rounded-2xl overflow-hidden",
          hover && "matte-card-hover",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StudioCard.displayName = "StudioCard"

export { StudioCard }
