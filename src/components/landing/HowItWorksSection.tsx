"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { BookOpen, Brain, Zap, MessageSquareCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    label: "Learn",
    icon: BookOpen,
    headline: "AI teaches, you focus",
    description:
      "Your coach explains the topic at your pace. No quizzing until you're ready — this is pure learning time.",
    color: "var(--color-primary)",
  },
  {
    number: "02",
    label: "Recall",
    icon: Brain,
    headline: "Close notes, explain back",
    description:
      "Say what you remember — by voice. Your coach listens without interrupting. This is where real retention starts.",
    color: "var(--color-primary)",
  },
  {
    number: "03",
    label: "Challenge",
    icon: Zap,
    headline: "4 questions, rising difficulty",
    description:
      "From basic facts to applied thinking. Each session proves what you actually know — not what you think you know.",
    color: "var(--color-accent)",
  },
  {
    number: "04",
    label: "Feedback",
    icon: MessageSquareCheck,
    headline: "See exactly where you stand",
    description:
      "What you understood, what you missed, what to review next. Topics re-queue until you've mastered them — not just until time runs out.",
    color: "var(--color-success)",
  },
];

const entranceTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
  mass: 1,
};

export default function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      aria-labelledby="how-it-works-heading"
      style={{
        paddingTop: "var(--space-20)",
        paddingBottom: "var(--space-20)",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 var(--space-6)",
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={entranceTransition}
          style={{ textAlign: "center", marginBottom: "var(--space-16)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: "var(--color-accent)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "var(--space-3)",
            }}
          >
            The Method
          </p>
          <h2
            id="how-it-works-heading"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.015em",
              marginBottom: "var(--space-4)",
            }}
          >
            Four phases. Every session.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body)",
              color: "var(--color-text-muted)",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Not a chatbot. Not a quiz app. A structured cycle built on how
            learning actually works.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div
          className="steps-grid"
          style={{
            display: "grid",
            gap: "var(--space-6)",
          }}
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.label}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: 20 }
                }
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...entranceTransition,
                  delay: 0.1 + i * 0.08,
                }}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-8)",
                  boxShadow: "var(--shadow-xs)",
                  transition:
                    "box-shadow 200ms ease, border-color 200ms ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.borderColor = "var(--color-border-focus)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-xs)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                {/* Step number watermark */}
                <span
                  className="text-number"
                  style={{
                    position: "absolute",
                    top: "var(--space-4)",
                    right: "var(--space-6)",
                    fontSize: "4rem",
                    fontWeight: 700,
                    color: "var(--color-border)",
                    lineHeight: 1,
                    opacity: 0.5,
                    userSelect: "none",
                  }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-md)",
                    background: `color-mix(in srgb, ${step.color} 10%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-5)",
                  }}
                >
                  <Icon size={24} color={step.color} strokeWidth={1.75} />
                </div>

                {/* Content */}
                <h3
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: "var(--text-h3)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {step.headline}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "var(--text-body)",
                    lineHeight: 1.6,
                    color: "var(--color-text-muted)",
                    maxWidth: "400px",
                  }}
                >
                  {step.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>

      <style>{`
        .steps-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
