"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wraps hero content with a fade-in + translateY entrance animation on mount.
 * Respects prefers-reduced-motion.
 */
export default function HeroEntrance({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
      }}
    >
      {children}
    </motion.div>
  );
}
