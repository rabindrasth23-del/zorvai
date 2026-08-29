"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Clock, RotateCcw } from "lucide-react";

interface SessionCardProps {
  title: string;
  description?: string;
  status: "mastered" | "re-queued" | "pending";
  day: number;
  index: number;
}

const statusConfig = {
  mastered: {
    label: "Understood",
    icon: CheckCircle2,
    bgClass: "bg-[var(--color-success)]/10",
    textClass: "text-[var(--color-success)]",
    borderClass: "border-[var(--color-success)]/20",
  },
  "re-queued": {
    label: "Reviewing",
    icon: RotateCcw,
    bgClass: "bg-[var(--color-warning)]/10",
    textClass: "text-[var(--color-warning)]",
    borderClass: "border-[var(--color-warning)]/20",
  },
  pending: {
    label: "Upcoming",
    icon: Clock,
    bgClass: "bg-[var(--color-primary)]/10",
    textClass: "text-[var(--color-primary)]",
    borderClass: "border-[var(--color-primary)]/20",
  },
};

export function SessionCard({
  title,
  description,
  status,
  day,
  index,
}: SessionCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)] transition-all duration-200"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        delay: 0.15 + index * 0.04,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-base font-semibold text-[var(--color-text)] mb-1">
            {title}
          </p>
          {description && (
            <p className="text-sm font-sans text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
          <p className="text-xs font-sans text-[var(--color-text-muted)] mt-2">
            Day {day}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium shrink-0 border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}
