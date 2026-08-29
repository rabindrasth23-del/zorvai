"use client";

import { motion, useReducedMotion } from "motion/react";

interface WeeklyChartProps {
  /** Study minutes per day: [Mon, Tue, Wed, Thu, Fri, Sat, Sun] */
  data: number[];
  totalMinutes: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyChart({ data, totalMinutes }: WeeklyChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const maxMinutes = Math.max(...data, 1);

  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  const totalLabel =
    hours > 0
      ? `${hours}hr ${mins.toString().padStart(2, "0")}min`
      : `${mins}min`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-display font-medium text-[var(--color-text)]">
          Weekly Study Time
        </h3>
        <span className="font-mono text-sm font-medium text-[var(--color-text-muted)]">
          {totalLabel}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((minutes, i) => {
          const heightPercent =
            maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
          const hasData = minutes > 0;

          return (
            <div
              key={DAYS[i]}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div
                className="w-full flex items-end justify-center"
                style={{ height: "100%" }}
              >
                <motion.div
                  className="w-full max-w-[32px] rounded-t-[var(--radius-sm)]"
                  style={{
                    backgroundColor: hasData
                      ? "var(--color-primary)"
                      : "var(--color-muted)",
                    minHeight: hasData ? "4px" : "2px",
                    opacity: hasData ? 1 : 0.4,
                  }}
                  initial={
                    shouldReduceMotion
                      ? { height: `${heightPercent}%` }
                      : { height: 0 }
                  }
                  animate={{ height: hasData ? `${heightPercent}%` : "2px" }}
                  transition={
                    shouldReduceMotion
                      ? {}
                      : {
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                          delay: 0.1 + i * 0.05,
                        }
                  }
                />
              </div>
              <span className="text-[10px] font-sans font-medium text-[var(--color-text-muted)] uppercase">
                {DAYS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
