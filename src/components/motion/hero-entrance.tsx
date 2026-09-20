"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Hero entrance — sequential stagger of direct children on mount.
 * Headline → subtext → CTA animate in cascade, total under 1s.
 * GPU-only (opacity + transform), respects prefers-reduced-motion.
 */

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function HeroEntrance({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Wrap each direct child in an animated item */}
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item}>
              {child}
            </motion.div>
          ))
        : (
            <motion.div variants={item}>
              {children}
            </motion.div>
          )}
    </motion.div>
  );
}
