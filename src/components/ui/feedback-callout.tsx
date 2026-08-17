"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackState = "understood" | "missed" | "passed" | "info";

export interface FeedbackCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  state: FeedbackState;
  title?: string;
  message: string;
}

export function FeedbackCallout({ state, title, message, className, ...props }: FeedbackCalloutProps) {
  const StateConfig = {
    understood: {
      icon: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mt-0.5" />,
      bg: "bg-[var(--color-success)]/10",
      border: "border-[var(--color-success)]/20",
      text: "text-[var(--color-success)]",
      titleColor: "text-[var(--color-success)]"
    },
    missed: {
      icon: <XCircle className="h-5 w-5 text-red-600 mt-0.5" />,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      titleColor: "text-red-900"
    },
    passed: {
      icon: <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] mt-0.5" />,
      bg: "bg-[var(--color-warning)]/10",
      border: "border-[var(--color-warning)]/20",
      text: "text-[var(--color-warning)]",
      titleColor: "text-[var(--color-warning)]"
    },
    info: {
      icon: <Info className="h-5 w-5 text-[var(--color-primary)] mt-0.5" />,
      bg: "bg-[var(--color-primary)]/10",
      border: "border-[var(--color-primary)]/20",
      text: "text-[var(--color-primary)]",
      titleColor: "text-[var(--color-primary)]"
    }
  };

  const config = StateConfig[state];

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-[var(--radius-lg)] border",
        config.bg,
        config.border,
        className
      )}
      {...props}
    >
      <div className="shrink-0">{config.icon}</div>
      <div className="flex flex-col gap-1">
        {title && (
          <span className={cn("font-sans font-semibold text-sm", config.titleColor)}>
            {title}
          </span>
        )}
        <span className={cn("font-sans text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text)]")}>
          {message}
        </span>
      </div>
    </div>
  );
}
