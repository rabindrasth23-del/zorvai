"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * AnimatedCounter — counts up from 0 to `value` on first render,
 * then smoothly transitions when `value` changes (e.g. on poll).
 * Uses requestAnimationFrame for GPU-friendly performance.
 * Only animates the REAL count — never simulates or increments artificially.
 */
export default function AnimatedCounter({
  value,
  duration = 1000,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);
  const prevValue = useRef(shouldReduceMotion ? value : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      prevValue.current = value;
      return;
    }

    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevValue.current = value;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, shouldReduceMotion]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
