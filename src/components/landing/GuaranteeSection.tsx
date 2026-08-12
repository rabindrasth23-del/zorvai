"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

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

export default function GuaranteeSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="guarantee"
      ref={sectionRef}
      aria-labelledby="guarantee-heading"
      style={{
        paddingTop: "var(--space-20)",
        paddingBottom: "var(--space-20)",
        background:
          "linear-gradient(160deg, #1B4F5C 0%, #174753 40%, #1A4B58 70%, #1E5462 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background texture — abstract phase-cycle rings at low opacity */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          right: "-8%",
          width: "600px",
          height: "600px",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="300" cy="300" r="280" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="220" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="300" cy="300" r="160" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="8 6" />
          <circle cx="300" cy="300" r="100" stroke="#FFFFFF" strokeWidth="0.5" />
          {/* Phase node markers */}
          <circle cx="300" cy="20" r="8" fill="#FFFFFF" opacity="0.5" />
          <circle cx="580" cy="300" r="8" fill="#FFFFFF" opacity="0.5" />
          <circle cx="300" cy="580" r="8" fill="#FFFFFF" opacity="0.5" />
          <circle cx="20" cy="300" r="8" fill="#FFFFFF" opacity="0.5" />
        </svg>
      </div>

      {/* Secondary subtle texture — dots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      <div
        className="guarantee-container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 var(--space-6)",
          display: "grid",
          gap: "var(--space-12)",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* --- Left Column: Copy + CTA --- */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={entranceTransition}
        >
          <p
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
            The Guarantee
          </p>

          <h2
            id="guarantee-heading"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              lineHeight: 1.15,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              marginBottom: "var(--space-6)",
            }}
          >
            We back it with{" "}
            <span
              style={{
                color: "var(--color-accent)",
              }}
            >
              real numbers.
            </span>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body)",
              lineHeight: 1.7,
              color: "rgba(255, 255, 255, 0.75)",
              marginBottom: "var(--space-4)",
              maxWidth: "460px",
            }}
          >
            Take a baseline quiz. Study with Zorvai. Take a follow-up.
            If your scores haven&apos;t improved by the agreed amount, you
            get a full refund.
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body)",
              lineHeight: 1.7,
              color: "rgba(255, 255, 255, 0.6)",
              marginBottom: "var(--space-8)",
              maxWidth: "460px",
            }}
          >
            No asterisks, no fine print about &ldquo;engagement minimums.&rdquo;
            Your improvement is measured, not estimated.
          </p>

          {/* CTA */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            transition={microTransition}
            style={{ display: "inline-block" }}
          >
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-body)",
                fontWeight: 600,
                color: "var(--color-primary)",
                background: "#FFFFFF",
                padding: "var(--space-3) var(--space-8)",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
                transition: "box-shadow 200ms ease",
              }}
            >
              Start Learning
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>

        {/* --- Right Column: Before/After Visual --- */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...entranceTransition, delay: 0.15 }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(12px)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              >
                Improvement Proof
              </span>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  background: "rgba(74, 155, 127, 0.2)",
                  padding: "2px 10px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                <TrendingUp size={13} color="var(--color-success)" strokeWidth={2.5} />
                <span
                  className="text-number"
                  style={{
                    fontSize: "var(--text-caption)",
                    fontWeight: 700,
                    color: "var(--color-success)",
                  }}
                >
                  +27%
                </span>
              </div>
            </div>

            {/* Before / After comparison */}
            <div style={{ padding: "var(--space-6) var(--space-5)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-4)",
                }}
              >
                {/* Before */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-caption)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.45)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    Baseline
                  </p>
                  <motion.span
                    className="text-number"
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ ...entranceTransition, delay: 0.3 }}
                    style={{
                      fontSize: "3.5rem",
                      fontWeight: 700,
                      color: "rgba(255, 255, 255, 0.5)",
                      lineHeight: 1,
                      display: "block",
                    }}
                  >
                    62%
                  </motion.span>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-caption)",
                      color: "rgba(255, 255, 255, 0.35)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    Day 1
                  </p>
                </div>

                {/* Arrow */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...entranceTransition, delay: 0.4 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    flexShrink: 0,
                  }}
                >
                  <ArrowRight
                    size={24}
                    color="var(--color-accent)"
                    strokeWidth={2}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    30 days
                  </span>
                </motion.div>

                {/* After */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-caption)",
                      fontWeight: 600,
                      color: "var(--color-success)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    Follow-up
                  </p>
                  <motion.span
                    className="text-number"
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ ...entranceTransition, delay: 0.5 }}
                    style={{
                      fontSize: "3.5rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      lineHeight: 1,
                      display: "block",
                    }}
                  >
                    89%
                  </motion.span>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-caption)",
                      color: "rgba(255, 255, 255, 0.35)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    Day 30
                  </p>
                </div>
              </div>

              {/* Progress bar visual */}
              <div
                style={{
                  marginTop: "var(--space-6)",
                  position: "relative",
                }}
              >
                {/* Track */}
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(255, 255, 255, 0.08)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: "62%" }}
                    animate={
                      isInView
                        ? { width: "89%" }
                        : { width: "62%" }
                    }
                    transition={{
                      duration: 1.2,
                      delay: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      background:
                        "linear-gradient(90deg, rgba(255, 255, 255, 0.3), var(--color-success))",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom — subject breakdown */}
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                gap: "var(--space-3)",
              }}
            >
              {[
                { subject: "Math", before: 58, after: 84 },
                { subject: "Science", before: 65, after: 91 },
                { subject: "English", before: 70, after: 93 },
              ].map((item) => (
                <div
                  key={item.subject}
                  style={{ textAlign: "center", flex: 1 }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "rgba(255, 255, 255, 0.4)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    {item.subject}
                  </p>
                  <p
                    className="text-number"
                    style={{
                      fontSize: "var(--text-body-sm)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                      {item.before}
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.3)",
                        margin: "0 3px",
                      }}
                    >
                      →
                    </span>
                    <span style={{ color: "var(--color-success)" }}>
                      {item.after}%
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Responsive */}
      <style>{`
        .guarantee-container {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .guarantee-container {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .guarantee-container > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .guarantee-container p {
            max-width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
