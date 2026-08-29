"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TopicFlowCardProps {
  title: string;
  description?: string;
  status: "mastered" | "upcoming";
  isCurrent: boolean;
  isLast: boolean;
  index: number;
}

export function TopicFlowCard({
  title,
  description,
  status,
  isCurrent,
  isLast,
  index,
}: TopicFlowCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isMastered = status === "mastered";

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
      {/* ── Timeline line + dot ── */}
      <div className="flex flex-col items-center shrink-0 w-6">
        {/* Dot marker */}
        <div
          className={`w-3 h-3 rounded-full shrink-0 mt-6 z-10 ${
            isCurrent
              ? "bg-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/20"
              : isMastered
                ? "bg-[var(--color-success)]"
                : "bg-[var(--color-border)]"
          }`}
        />
        {/* Dashed connector */}
        {!isLast && (
          <div className="flex-1 w-0 border-l-2 border-dashed border-[var(--color-border)] mt-1" />
        )}
      </div>

      {/* ── Card ── */}
      <div
        className={`flex-1 rounded-[var(--radius-lg)] border p-5 mb-3 transition-all duration-200 ${
          isCurrent
            ? "bg-[var(--color-accent)]/6 border-[var(--color-accent)]/25 shadow-[var(--shadow-md)] ring-1 ring-[var(--color-accent)]/10"
            : "bg-surface border-[var(--color-border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={`font-sans text-base font-semibold mb-1 ${
                isCurrent
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text)]"
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

          {/* Status pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium shrink-0 border ${
              isMastered
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
                : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20"
            }`}
          >
            {isMastered ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            {isMastered ? "Mastered" : "Upcoming"}
          </span>
        </div>

        {/* CTA for current/next topic */}
        {isCurrent && (
          <Link
            href="/checkin"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-sans font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-[var(--shadow-sm)]"
          >
            Start Session
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
