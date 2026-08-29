"use client";

import { cn } from "@/lib/utils";

interface StatChipProps {
  value: number;
  label: string;
  colorClass?: string;
  borderColorClass?: string;
}

export function StatChip({
  value,
  label,
  colorClass = "text-[var(--color-text)]",
  borderColorClass = "border-[var(--color-border)]",
}: StatChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border bg-surface shadow-[var(--shadow-xs)]",
        borderColorClass
      )}
    >
      <span className={cn("font-mono text-lg font-semibold", colorClass)}>
        {value}
      </span>
      <span className="text-sm font-sans text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
