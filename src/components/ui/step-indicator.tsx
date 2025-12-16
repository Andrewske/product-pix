import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface StepIndicatorProps {
  currentStep: "upload" | "preview" | "creating"
  className?: string
}

const steps = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Review & Configure" },
  { key: "creating", label: "Creating" },
] as const

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.key === currentStep)

  return (
    <div className={cn("flex items-center justify-center space-x-8", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isUpcoming = index > currentIndex

        return (
          <div key={step.key} className="flex items-center space-x-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted && "bg-accent border-accent text-accent-foreground",
                isCurrent && "border-primary text-primary",
                isUpcoming && "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                isCompleted && "text-accent",
                isCurrent && "text-primary",
                isUpcoming && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}