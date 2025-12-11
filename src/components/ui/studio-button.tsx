import * as React from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface StudioButtonProps extends React.ComponentProps<typeof Button> {
  studioVariant?: "primary" | "secondary"
}

const StudioButton = React.forwardRef<HTMLButtonElement, StudioButtonProps>(
  ({ className, studioVariant = "primary", size = "lg", variant, ...props }, ref) => {
    const studioStyles =
      studioVariant === "primary"
        ? "bg-foreground text-background hover:bg-foreground/90 shadow-xl hover:shadow-2xl button-studio h-14 px-8 text-lg"
        : "h-14 px-8 text-lg border-border hover:bg-muted/50"

    const baseVariant = studioVariant === "secondary" ? "outline" : variant

    return (
      <Button
        ref={ref}
        size={size}
        variant={baseVariant}
        className={cn(studioStyles, className)}
        {...props}
      />
    )
  }
)
StudioButton.displayName = "StudioButton"

export { StudioButton }
