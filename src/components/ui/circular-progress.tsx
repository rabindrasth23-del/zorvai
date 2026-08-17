"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  colorClass?: string; // e.g., "text-[var(--color-success)]"
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  showValue = true,
  label,
  colorClass = "text-[var(--color-primary)]",
  className,
  ...props
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-border"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-1000 ease-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {(showValue || label) && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          {showValue && (
            <span className="font-mono text-2xl font-semibold text-[var(--color-text)] tracking-tight">
              {Math.round(value)}%
            </span>
          )}
          {label && (
            <span className="text-[var(--text-caption)] font-sans text-[var(--color-text-muted)] mt-0.5">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
