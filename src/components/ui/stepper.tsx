"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-col sm:flex-row sm:items-center w-full gap-4 sm:gap-0" : "flex-col gap-4",
        className
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex group",
              orientation === "horizontal"
                ? "flex-row items-start sm:items-center flex-1 sm:last:flex-none gap-4 sm:gap-0"
                : "flex-row items-start gap-4"
            )}
          >
            {/* Step Indicator */}
            <div
              className={cn(
                "flex flex-col items-center",
                orientation === "horizontal" ? "sm:flex-row w-full sm:items-center" : ""
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] font-sans text-sm font-semibold transition-colors duration-300",
                  isCompleted && "bg-[var(--color-success)] border-[var(--color-success)] text-white",
                  isCurrent && "bg-surface border-[var(--color-primary)] text-[var(--color-primary)]",
                  isUpcoming && "bg-surface border-border text-[var(--color-text-muted)]"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : <span aria-hidden="true">{index + 1}</span>}
                <span className="sr-only">Step {index + 1}: {step.title} {isCompleted ? "(Completed)" : isCurrent ? "(Current)" : ""}</span>
              </div>

              {/* Connecting Line */}
              {index !== steps.length - 1 && (
                <>
                  {/* Horizontal Line for sm+ */}
                  <div
                    className={cn(
                      "transition-colors duration-300",
                      orientation === "horizontal" ? "hidden sm:block h-[1.5px] w-full mx-2" : "hidden",
                      isCompleted ? "bg-[var(--color-success)]" : "bg-border"
                    )}
                    aria-hidden="true"
                  />
                  {/* Vertical Line for mobile or vertical orientation */}
                  <div
                    className={cn(
                      "transition-colors duration-300 w-[1.5px] h-full min-h-[2rem] my-2",
                      orientation === "horizontal" ? "block sm:hidden" : "block",
                      isCompleted ? "bg-[var(--color-success)]" : "bg-border"
                    )}
                    aria-hidden="true"
                  />
                </>
              )}
            </div>

            {/* Step Content */}
            <div
              className={cn(
                "flex flex-col justify-center",
                orientation === "horizontal" 
                  ? "pt-1 sm:pt-0 sm:absolute sm:-bottom-6 sm:translate-y-full sm:opacity-0" 
                  : "pt-1"
              )}
            >
              <span
                className={cn(
                  "text-[var(--text-body-sm)] font-sans font-semibold tracking-wide",
                  isCurrent || isCompleted ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                )}
                aria-hidden="true"
              >
                {step.title}
              </span>
              {step.description && (
                <span className={cn(
                  "text-[var(--text-caption)] text-[var(--color-text-muted)] font-sans mt-0.5",
                  orientation === "horizontal" ? "block sm:hidden" : "block"
                )} aria-hidden="true">
                  {step.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
