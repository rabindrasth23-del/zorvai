"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import HeroPhaseVisual from "./HeroPhaseVisual";

const entranceTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
  mass: 1,
};

const microTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

const stats = [
  { number: "4", label: "phases per session", color: "var(--color-primary)" },
  { number: "7", label: "days to first results", color: "var(--color-accent)" },
  { number: "1", label: "guarantee — backed", color: "var(--color-success)" },
];

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: "calc(64px + var(--space-8))", // clear navbar
        paddingBottom: "var(--space-12)",
        background: "var(--color-bg)",
      }}
    >
      <div
        className="hero-container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 var(--space-6)",
          width: "100%",
          display: "grid",
          gap: "var(--space-12)",
          alignItems: "center",
        }}
      >
        {/* --- Left Column: Copy --- */}
        <div className="hero-copy" style={{ maxWidth: "560px" }}>
          {/* Eyebrow */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...entranceTransition, delay: 0.1 }}
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: "var(--color-accent)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "var(--space-4)",
            }}
          >
            AI Study Coach
          </motion.p>

          {/* Headline */}
          <motion.h1
            id="hero-headline"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...entranceTransition, delay: 0.15 }}
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              lineHeight: 1.1,
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
              marginBottom: "var(--space-6)",
              fontOpticalSizing: "auto",
            }}
          >
            Study smarter,{" "}
            <span style={{ color: "var(--color-primary)" }}>not longer.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...entranceTransition, delay: 0.25 }}
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-h4)",
              lineHeight: 1.6,
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-8)",
              maxWidth: "480px",
            }}
          >
            An AI coach that teaches, listens, challenges, and gives
            feedback — not just another homework answer engine.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...entranceTransition, delay: 0.35 }}
            className="hero-ctas"
            style={{
              display: "flex",
              gap: "var(--space-4)",
              flexWrap: "wrap",
            }}
          >
            {/* Primary CTA */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={microTransition}
            >
              <Link
                href="/signup?role=student"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "var(--text-body)",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "var(--color-accent)",
                  padding: "var(--space-3) var(--space-6)",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 200ms ease",
                }}
              >
                Start Learning
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={microTransition}
            >
              <Link
                href="/signup?role=parent"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "var(--text-body)",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  background: "transparent",
                  border: "1.5px solid var(--color-primary)",
                  padding: "var(--space-3) var(--space-6)",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  transition: "background 200ms ease",
                }}
              >
                I&apos;m a Parent
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* --- Right Column: Phase Visual --- */}
        <div
          className="hero-visual"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <HeroPhaseVisual />
        </div>
      </div>

      {/* --- Stat Bar --- */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...entranceTransition, delay: 0.5 }}
        style={{
          maxWidth: "1200px",
          margin: "var(--space-16) auto 0",
          padding: "0 var(--space-6)",
          width: "100%",
        }}
      >
        <div
          className="hero-stats"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-8)",
            flexWrap: "wrap",
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...entranceTransition, delay: 0.55 + i * 0.08 }}
              style={{
                textAlign: "center",
                minWidth: "140px",
              }}
            >
              <span
                className="text-number"
                style={{
                  fontSize: "var(--text-display)",
                  fontWeight: 700,
                  color: stat.color,
                  display: "block",
                  lineHeight: 1,
                  marginBottom: "var(--space-2)",
                }}
              >
                {stat.number}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "var(--text-body-sm)",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Responsive grid */}
      <style>{`
        .hero-container {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .hero-copy {
            max-width: 600px !important;
            margin: 0 auto;
          }
          .hero-ctas {
            justify-content: center !important;
          }
          .hero-visual {
            order: -1;
            max-width: 320px;
            margin: 0 auto;
          }
        }
        @media (max-width: 640px) {
          .hero-stats {
            gap: var(--space-6) !important;
          }
          .hero-ctas {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .hero-ctas a {
            justify-content: center !important;
          }
        }
      `}</style>
    </section>
  );
}
