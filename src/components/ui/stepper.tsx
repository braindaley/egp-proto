
import * as React from "react"
import { cn } from "@/lib/utils"

const Stepper = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center justify-between w-full p-4", className)}
        {...props}
    />
))
Stepper.displayName = "Stepper"

const Step = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { active?: boolean }
>(({ className, active, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex flex-col items-center relative text-gray-500",
            { "text-indigo-600 font-semibold": active },
            className
        )}
        {...props}
    />
))
Step.displayName = "Step"

const StepLabel = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={cn("mt-2 text-sm text-center", className)}
        {...props}
    />
))
StepLabel.displayName = "StepLabel"

export { Stepper, Step, StepLabel };
