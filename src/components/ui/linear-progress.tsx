"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  colorClass?: string;
}

export function LinearProgress({
  value,
  label,
  showValue = true,
  colorClass = "bg-[var(--color-primary)]",
  className,
  ...props
}: LinearProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full flex flex-col gap-[var(--space-2)]", className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-[var(--text-body-sm)] font-sans font-medium text-[var(--color-text)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-[var(--text-body-sm)] font-semibold text-[var(--color-text-muted)]">
              {Math.round(safeValue)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full bg-[var(--color-muted)] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
