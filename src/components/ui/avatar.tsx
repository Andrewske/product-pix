import * as React from "react"
import { cn } from "@/lib/utils"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Avatar.displayName = "Avatar"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt = "", ...props }, ref) => {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cn("aspect-square h-full w-full object-cover", className)}
        ref={ref}
        alt={alt}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }