"use client";

import { motion, useReducedMotion } from "motion/react";

export default function TestimonialArc() {
  const shouldReduceMotion = useReducedMotion();
  const text = "• [PILOT FEEDBACK PLACEHOLDER] • [PILOT FEEDBACK PLACEHOLDER] ";

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { rotate: 360 }}
      transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path
          id="textCurve"
          d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
          fill="transparent"
        />
        <text className="font-sans text-[12px] md:text-[14px] font-normal fill-[var(--color-text-muted)] opacity-50 tracking-[2px] uppercase">
          <textPath href="#textCurve" startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>
    </motion.div>
  );
}
