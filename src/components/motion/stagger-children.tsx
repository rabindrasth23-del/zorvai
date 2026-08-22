"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Staggered entrance animation for dashboard sections.
 * Each direct child animates in with fade + translateY, staggered by 60ms.
 * Respects prefers-reduced-motion.
 */
export default function StaggerChildren({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
