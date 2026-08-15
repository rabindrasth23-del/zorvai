"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export default function RoleToggle() {
  const [active, setActive] = useState<"student" | "parent">("student");
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex bg-[var(--color-muted)] p-[var(--space-1)] rounded-[var(--radius-full)] relative">
      {["student", "parent"].map((role) => {
        const isActive = active === role;
        return (
          <button
            key={role}
            onClick={() => setActive(role as "student" | "parent")}
            className={`relative px-[var(--space-4)] py-[var(--space-1)] rounded-[var(--radius-full)] border-none bg-transparent font-sans text-[var(--text-body-sm)] font-medium capitalize z-10 transition-colors duration-200 ${
              isActive
                ? "text-[var(--color-on-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="roleToggleBg"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 30 }
                }
                className="absolute inset-0 bg-[var(--color-primary)] rounded-[var(--radius-full)] -z-10"
              />
            )}
            {role}
          </button>
        );
      })}
    </div>
  );
}
