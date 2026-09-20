"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * MotionLink — Link with subtle scale hover (1.02) and press (0.98).
 * GPU-only transform, respects prefers-reduced-motion.
 */
export function MotionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      className="inline-block"
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

/**
 * MotionCard — Card wrapper with gentle lift on hover.
 * translateY -4px + slightly stronger shadow.
 * GPU-only (transform + opacity), respects prefers-reduced-motion.
 */
export function MotionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              transition: { duration: 0.2, ease: "easeOut" },
            }
      }
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
