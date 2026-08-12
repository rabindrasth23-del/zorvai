"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { BookOpen, Brain, Zap, MessageSquareCheck } from "lucide-react";

const phases = [
  {
    key: "learn",
    label: "Learn",
    icon: BookOpen,
    color: "var(--color-primary)",
    description: "AI teaches the topic",
  },
  {
    key: "recall",
    label: "Recall",
    icon: Brain,
    color: "var(--color-primary)",
    description: "Explain what you remember",
  },
  {
    key: "challenge",
    label: "Challenge",
    icon: Zap,
    color: "var(--color-accent)",
    description: "4 questions, rising difficulty",
  },
  {
    key: "feedback",
    label: "Feedback",
    icon: MessageSquareCheck,
    color: "var(--color-success)",
    description: "See where you stand",
  },
];

const springTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 28,
  mass: 0.8,
};

export default function HeroPhaseVisual() {
  const shouldReduceMotion = useReducedMotion();
  const [activePhase, setActivePhase] = useState(0);

  // Auto-cycle through phases
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase((p) => (p + 1) % phases.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springTransition, delay: 0.3 }}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "400px",
        aspectRatio: "1 / 1",
        margin: "0 auto",
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid var(--color-border)",
          opacity: 0.6,
        }}
      />

      {/* Progress ring */}
      <svg
        viewBox="0 0 200 200"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          transform: "rotate(-90deg)",
        }}
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="2"
          opacity="0.3"
        />
        <motion.circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 96}
          initial={{
            strokeDashoffset:
              2 * Math.PI * 96 * (1 - 1 / phases.length),
          }}
          animate={{
            strokeDashoffset:
              2 * Math.PI * 96 * (1 - (activePhase + 1) / phases.length),
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ opacity: 0.7 }}
        />
      </svg>

      {/* Phase nodes around the circle */}
      {phases.map((phase, i) => {
        const angle = (i / phases.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 42; // percentage from center
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const isActive = i === activePhase;
        const Icon = phase.icon;

        return (
          <motion.button
            key={phase.key}
            onClick={() => setActivePhase(i)}
            animate={{
              scale: isActive ? 1.15 : 1,
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
            transition={springTransition}
            aria-label={`${phase.label} phase${isActive ? " (active)" : ""}`}
            aria-current={isActive ? "step" : undefined}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              width: isActive ? "64px" : "48px",
              height: isActive ? "64px" : "48px",
              borderRadius: "50%",
              border: `2px solid ${isActive ? phase.color : "var(--color-border)"}`,
              background: isActive
                ? "var(--color-surface)"
                : "var(--color-bg)",
              boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition:
                "width 300ms ease, height 300ms ease, border-color 300ms ease, background 300ms ease, box-shadow 300ms ease",
              zIndex: isActive ? 2 : 1,
            }}
          >
            <Icon
              size={isActive ? 24 : 18}
              color={isActive ? phase.color : "var(--color-text-muted)"}
              strokeWidth={1.75}
              style={{ transition: "color 300ms ease" }}
            />
          </motion.button>
        );
      })}

      {/* Center label */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          width: "55%",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={phases[activePhase].key}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <p
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: "var(--text-h3)",
                fontWeight: 600,
                color: "var(--color-text)",
                margin: "0 0 4px 0",
              }}
            >
              {phases[activePhase].label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-caption)",
                color: "var(--color-text-muted)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {phases[activePhase].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Connection lines between nodes */}
      <svg
        viewBox="0 0 200 200"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {phases.map((_, i) => {
          const nextI = (i + 1) % phases.length;
          const angle1 = (i / phases.length) * 2 * Math.PI - Math.PI / 2;
          const angle2 =
            (nextI / phases.length) * 2 * Math.PI - Math.PI / 2;
          const r = 84;
          const x1 = 100 + r * Math.cos(angle1);
          const y1 = 100 + r * Math.sin(angle1);
          const x2 = 100 + r * Math.cos(angle2);
          const y2 = 100 + r * Math.sin(angle2);

          const isActiveEdge = i === activePhase;

          return (
            <line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                isActiveEdge
                  ? "var(--color-accent)"
                  : "var(--color-border)"
              }
              strokeWidth={isActiveEdge ? 2 : 1}
              strokeDasharray={isActiveEdge ? "none" : "4 4"}
              opacity={isActiveEdge ? 0.6 : 0.3}
              style={{ transition: "stroke 300ms ease, opacity 300ms ease" }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}
