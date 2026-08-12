"use client";

/**
 * MotionSmokeTest — verifies motion/react integration with the Zorvai design system.
 *
 * This is a "use client" component. The page that renders it stays a Server Component.
 * Tests: spring physics, AnimatePresence, useReducedMotion, font/color token rendering.
 */

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "motion/react";

// Design system transition presets (from MASTER.md)
const defaultTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

const microTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

const entranceTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
  mass: 1,
};

// Session phase data — mirrors the real product flow
const phases = [
  { key: "learn", label: "Learn", icon: "📖", description: "AI teaches the topic" },
  { key: "recall", label: "Recall", icon: "🧠", description: "Explain what you remember" },
  { key: "challenge", label: "Challenge", icon: "⚡", description: "4 graduated questions" },
  { key: "feedback", label: "Feedback", icon: "✓", description: "See what you mastered" },
] as const;

export default function MotionSmokeTest() {
  const shouldReduceMotion = useReducedMotion();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [streakCount, setStreakCount] = useState(7);

  const handleNextPhase = () => {
    if (currentPhase < phases.length - 1) {
      setCurrentPhase((p) => p + 1);
    } else {
      // Cycle back + trigger celebration
      setShowCelebration(true);
      setStreakCount((s) => s + 1);
      setCurrentPhase(0);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
        gap: "var(--space-10)",
      }}
    >
      {/* --- Header: Fraunces + color tokens --- */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entranceTransition}
        style={{ textAlign: "center", maxWidth: "600px" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "var(--text-display)",
            lineHeight: "var(--lh-display)",
            fontWeight: 700,
            color: "var(--color-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "var(--space-4)",
          }}
        >
          Zorvai
        </h1>
        <p
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "var(--text-body)",
            lineHeight: "var(--lh-body)",
            color: "var(--color-text-muted)",
            maxWidth: "480px",
            margin: "0 auto",
          }}
        >
          Design system smoke test — verifying tokens, fonts, and motion integration.
        </p>
      </motion.div>

      {/* --- Phase Transition: AnimatePresence + spring physics --- */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...entranceTransition, delay: 0.15 }}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-8)",
          boxShadow: "var(--shadow-md)",
          width: "100%",
          maxWidth: "480px",
          minHeight: "220px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-6)",
        }}
      >
        {/* Phase indicator dots */}
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {phases.map((phase, i) => (
            <motion.div
              key={phase.key}
              animate={{
                scale: i === currentPhase ? 1 : 0.75,
                backgroundColor:
                  i === currentPhase
                    ? "var(--color-primary)"
                    : i < currentPhase
                      ? "var(--color-success)"
                      : "var(--color-border)",
              }}
              transition={microTransition}
              style={{
                width: 10,
                height: 10,
                borderRadius: "var(--radius-full)",
              }}
            />
          ))}
        </div>

        {/* Animated phase content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phases[currentPhase].key}
            initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={defaultTransition}
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>
              {phases[currentPhase].icon}
            </span>
            <h2
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: "var(--text-h2)",
                lineHeight: "var(--lh-h2)",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              {phases[currentPhase].label}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-body-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {phases[currentPhase].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA Button — accent color, micro-interaction */}
        <motion.button
          onClick={handleNextPhase}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          transition={microTransition}
          style={{
            background: "var(--color-accent)",
            color: "#FFFFFF",
            border: "none",
            padding: "var(--space-3) var(--space-6)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "var(--text-body)",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {currentPhase < phases.length - 1 ? "Next Phase →" : "Complete Session ✓"}
        </motion.button>
      </motion.div>

      {/* --- Stats Row: Geist Mono numbers + celebration animation --- */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...entranceTransition, delay: 0.3 }}
        style={{
          display: "flex",
          gap: "var(--space-6)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Streak counter */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4) var(--space-6)",
            textAlign: "center",
            boxShadow: "var(--shadow-xs)",
            minWidth: "120px",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={streakCount}
              initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={defaultTransition}
              className="text-number"
              style={{
                fontSize: "var(--text-h1)",
                fontWeight: 600,
                color: "var(--color-accent)",
                display: "block",
              }}
            >
              {streakCount}
            </motion.span>
          </AnimatePresence>
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Day Streak
          </span>
        </div>

        {/* Score */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4) var(--space-6)",
            textAlign: "center",
            boxShadow: "var(--shadow-xs)",
            minWidth: "120px",
          }}
        >
          <span
            className="text-number"
            style={{
              fontSize: "var(--text-h1)",
              fontWeight: 600,
              color: "var(--color-success)",
              display: "block",
            }}
          >
            86%
          </span>
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Mastery
          </span>
        </div>

        {/* Timer */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4) var(--space-6)",
            textAlign: "center",
            boxShadow: "var(--shadow-xs)",
            minWidth: "120px",
          }}
        >
          <span
            className="text-number"
            style={{
              fontSize: "var(--text-h1)",
              fontWeight: 600,
              color: "var(--color-primary)",
              display: "block",
            }}
          >
            24:30
          </span>
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Session Time
          </span>
        </div>
      </motion.div>

      {/* --- Celebration overlay (Tier A motion) --- */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={defaultTransition}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(43, 42, 40, 0.3)",
              backdropFilter: "blur(4px)",
              zIndex: 50,
            }}
          >
            <motion.div
              initial={shouldReduceMotion ? false : { y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ ...defaultTransition, delay: 0.1 }}
              style={{
                background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-8) var(--space-10)",
                boxShadow: "var(--shadow-xl)",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: "var(--text-h2)",
                  fontWeight: 700,
                  color: "var(--color-success)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Topic Mastered!
              </h2>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-body-sm)",
                }}
              >
                Your streak is now{" "}
                <span className="text-number" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                  {streakCount}
                </span>{" "}
                days.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Token verification footer --- */}
      <motion.footer
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{
          marginTop: "var(--space-8)",
          fontSize: "var(--text-caption)",
          color: "var(--color-text-muted)",
          textAlign: "center",
          maxWidth: "520px",
        }}
      >
        <p>
          ✓ Fraunces (headings) · ✓ Inter (body) · ✓ Geist Mono (numbers) ·
          ✓ motion/react spring physics · ✓ AnimatePresence · ✓ useReducedMotion ·
          ✓ Design tokens via CSS custom properties
        </p>
      </motion.footer>
    </div>
  );
}
