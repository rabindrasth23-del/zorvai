"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, type LucideIcon } from "lucide-react";

export type BadgeStatus = "success" | "error" | "warning" | "neutral" | "guaranteed";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: BadgeStatus;
  label: string;
  icon?: LucideIcon;
}

export function StatusBadge({ status, label, icon: Icon, className, ...props }: StatusBadgeProps) {
  
  const DefaultIconMap: Record<BadgeStatus, LucideIcon> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    neutral: Clock,
    guaranteed: ShieldCheck
  };

  const ResolvedIcon = Icon || DefaultIconMap[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-[var(--space-3)] py-[var(--space-1)] rounded-[var(--radius-full)] font-sans font-medium text-[var(--text-caption)] shadow-sm border",
        status === "success" && "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
        status === "error" && "bg-red-50 text-red-600 border-red-200",
        status === "warning" && "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
        status === "neutral" && "bg-[var(--color-muted)] text-[var(--color-text-muted)] border-border",
        status === "guaranteed" && "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20",
        className
      )}
      {...props}
    >
      <ResolvedIcon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}
