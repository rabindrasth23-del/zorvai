"use client";

import { motion, useReducedMotion } from "motion/react";
import { Activity, CalendarCheck2, Clock } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "session" | "checkin";
  title: string;
  description: string;
  date: string;
  accentColor: string;
}

interface ActivitySidebarProps {
  items: ActivityItem[];
  studentName: string;
}

export function ActivitySidebar({ items, studentName }: ActivitySidebarProps) {
  const shouldReduceMotion = useReducedMotion();

  const getIcon = (type: string) => {
    switch (type) {
      case "session":
        return Activity;
      case "checkin":
        return CalendarCheck2;
      default:
        return Clock;
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
        delay: 0.2,
      }}
    >
      <h2 className="text-lg font-display font-medium text-[var(--color-text)]">
        Recent Activity
      </h2>

      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] font-sans">
            No recent activity for {studentName} yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const Icon = getIcon(item.type);
            return (
              <motion.div
                key={item.id}
                className="rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] transition-shadow"
                style={{
                  backgroundColor: `color-mix(in srgb, ${item.accentColor} 8%, var(--color-surface))`,
                }}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: 8 }
                }
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  delay: 0.25 + i * 0.05,
                }}
              >
                <div className="flex">
                  {/* Colored left accent bar */}
                  <div
                    className="w-1 shrink-0"
                    style={{ backgroundColor: item.accentColor }}
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: item.accentColor }}
                        />
                        <span
                          className="text-[10px] font-sans font-semibold uppercase tracking-wider"
                          style={{ color: item.accentColor }}
                        >
                          {item.type === "session" ? "Session" : "Check-in"}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-[var(--color-text-muted)]">
                        {item.date}
                      </span>
                    </div>
                    <p className="text-sm font-sans font-medium text-[var(--color-text)] mb-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs font-sans text-[var(--color-text-muted)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
