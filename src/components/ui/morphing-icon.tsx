"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconState = "idle" | "success" | "warning";

interface MorphingIconProps {
  state: IconState;
  className?: string;
  size?: number;
}

export function MorphingIcon({ state, className, size = 24 }: MorphingIconProps) {
  // Using motion/react as required by MASTER.md rules
  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Info size={size} className="text-[var(--color-text-muted)]" />
          </motion.div>
        )}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Check size={size} className="text-[var(--color-success)]" />
          </motion.div>
        )}
        {state === "warning" && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <AlertTriangle size={size} className="text-[var(--color-warning)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
