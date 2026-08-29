"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Clock, RotateCcw, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

interface TopicFlowCardProps {
  title: string;
  description?: string;
  status: "mastered" | "upcoming" | "review";
  isCurrent: boolean;
  isLast: boolean;
  index: number;
}

const statusConfig = {
  mastered: {
    label: "Mastered",
    icon: CheckCircle2,
    pillBg: "bg-[var(--color-success)]/10",
    pillText: "text-[var(--color-success)]",
    pillBorder: "border-[var(--color-success)]/20",
    dotColor: "bg-[var(--color-success)]",
  },
  upcoming: {
    label: "Upcoming",
    icon: Clock,
    pillBg: "bg-[var(--color-warning)]/10",
    pillText: "text-[var(--color-warning)]",
    pillBorder: "border-[var(--color-warning)]/20",
    dotColor: "bg-[var(--color-border)]",
  },
  review: {
    label: "Review Again",
    icon: RotateCcw,
    pillBg: "bg-[var(--color-accent)]/10",
    pillText: "text-[var(--color-accent)]",
    pillBorder: "border-[var(--color-accent)]/20",
    dotColor: "bg-[var(--color-accent)]",
  },
};

export function TopicFlowCard({
  title,
  description,
  status,
  isCurrent,
  isLast,
  index,
}: TopicFlowCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      className="relative flex gap-4"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        delay: 0.1 + index * 0.04,
      }}
    >
      {/* ── Timeline dot + dashed connector ── */}
      <div className="flex flex-col items-center shrink-0 w-6">
        <div
          className={`w-3 h-3 rounded-full shrink-0 mt-6 z-10 ${
            isCurrent
              ? "bg-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/20"
              : config.dotColor
          }`}
        />
        {!isLast && (
          <div className="flex-1 w-0 border-l-2 border-dashed border-[var(--color-border)] mt-1" />
        )}
      </div>

      {/* ── Card ── */}
      <div
        className={`relative flex-1 rounded-[var(--radius-lg)] border mb-3 transition-all duration-200 ${
          isCurrent
            ? "bg-[var(--color-accent)]/6 border-[var(--color-accent)]/25 shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-accent)]/10 p-6"
            : "bg-surface border-[var(--color-border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)] p-5"
        }`}
      >
        {/* ⚡ Active badge for current topic */}
        {isCurrent && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-md)] z-10">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={`font-sans font-semibold mb-1 ${
                isCurrent
                  ? "text-[var(--color-accent)] text-lg"
                  : "text-[var(--color-text)] text-base"
              }`}
            >
              {title}
            </p>
            {description && (
              <p className="text-sm font-sans text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Status pill — 3 distinct states */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium shrink-0 border ${config.pillBg} ${config.pillText} ${config.pillBorder}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>

        {/* Pulsing CTA for current topic */}
        {isCurrent && (
          <motion.div
            className="inline-block mt-4"
            style={{ borderRadius: "9999px" }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    boxShadow: [
                      "0 0 0 0 rgba(255,122,69,0)",
                      "0 0 0 8px rgba(255,122,69,0.15)",
                      "0 0 0 0 rgba(255,122,69,0)",
                    ],
                  }
            }
            transition={
              shouldReduceMotion
                ? {}
                : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Link
              href="/checkin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-white text-sm font-sans font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-[var(--shadow-md)]"
            >
              Start Session
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
