"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

/* =============================================================================
   FLOATING CHAT BUTTON
   Fixed bottom-right (desktop) / bottom-center (mobile)
   Slides in from bottom-right with 800ms delay on page load
   ============================================================================= */

export function FloatingChatButton() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 0, x: 80, y: 80 }
      }
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 40,
      }}
      className="max-md:right-auto max-md:left-1/2 max-md:-translate-x-1/2 max-md:bottom-[80px]"
    >
      <Link
        href="/chat"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--dash-teal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 4px 16px rgba(78, 205, 196, 0.25)",
          border: "none",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(78, 205, 196, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(78, 205, 196, 0.25)";
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--dash-bg)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </Link>
    </motion.div>
  );
}
