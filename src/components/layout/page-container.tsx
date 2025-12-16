import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  narrow?: boolean
}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, narrow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto px-4 py-16",
          narrow ? "max-w-5xl" : "max-w-6xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageContainer.displayName = "PageContainer"

export { PageContainer }
