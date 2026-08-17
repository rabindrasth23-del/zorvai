"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SessionProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function SessionProgressIndicator({ currentStep, totalSteps, className }: SessionProgressProps) {
  // Use 1-indexed step number for display
  const safeCurrent = Math.min(Math.max(1, currentStep), totalSteps);

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <div className="flex justify-between items-center text-[var(--text-caption)] font-sans font-medium text-[var(--color-text-muted)] px-1">
        <span>Session Progress</span>
        <span className="text-[var(--color-text)] bg-surface border border-border px-2 py-0.5 rounded-full">
          {safeCurrent} <span className="text-[var(--color-text-muted)]">/ {totalSteps}</span>
        </span>
      </div>
      <div className="flex gap-1.5 h-2.5 w-full">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i < safeCurrent - 1;
          const isCurrent = i === safeCurrent - 1;
          return (
            <div
              key={i}
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-500 ease-out",
                isCompleted ? "bg-[var(--color-accent)]" : 
                isCurrent ? "bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)] scale-y-110 opacity-90" : 
                "bg-border"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
