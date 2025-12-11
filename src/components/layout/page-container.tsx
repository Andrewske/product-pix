import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlight?: boolean
  narrow?: boolean
}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, spotlight = false, narrow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto px-4 py-16",
          narrow ? "max-w-5xl" : "max-w-6xl",
          spotlight && "relative",
          className
        )}
        {...props}
      >
        {spotlight && (
          <div className="absolute inset-0 studio-spotlight pointer-events-none" />
        )}
        {children}
      </div>
    )
  }
)
PageContainer.displayName = "PageContainer"

export { PageContainer }
