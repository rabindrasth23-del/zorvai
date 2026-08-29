"use client";

import { Bell } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface StudentDashboardHeaderProps {
  studentName: string;
}

export function StudentDashboardHeader({ studentName }: StudentDashboardHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      className="flex items-center justify-between w-full"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar circle with initials */}
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-sans font-semibold text-lg shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-[var(--color-text)] tracking-tight">
            Hey, {studentName}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] font-sans mt-0.5">
            Student
          </p>
        </div>
      </div>

      {/* Notification bell */}
      <button
        className="relative w-10 h-10 rounded-full bg-surface border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-focus)] transition-colors shadow-[var(--shadow-xs)] cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
