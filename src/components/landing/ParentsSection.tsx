"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  BarChart3,
  Bell,
  Mail,
  ShieldCheck,
  Eye,
  TrendingUp,
} from "lucide-react";

const parentFeatures = [
  {
    icon: BarChart3,
    text: "Real progress data, not just 'time spent'",
  },
  {
    icon: Mail,
    text: "Weekly digest via push or email — your choice",
  },
  {
    icon: Bell,
    text: "Missed-session alerts — one heads-up, not a guilt trip",
  },
  {
    icon: TrendingUp,
    text: "Improvement guarantee with a measurable before-and-after",
  },
];

const entranceTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
  mass: 1,
};

export default function ParentsSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="parents"
      ref={sectionRef}
      aria-labelledby="parents-heading"
      style={{
        paddingTop: "var(--space-20)",
        paddingBottom: "var(--space-20)",
        background: "var(--color-bg)",
      }}
    >
      <div
        className="parents-container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 var(--space-6)",
          display: "grid",
          gap: "var(--space-12)",
          alignItems: "center",
        }}
      >
        {/* Left — Copy */}
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
              marginBottom: "var(--space-3)",
            }}
          >
            For Parents
          </p>
          <h2
            id="parents-heading"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.015em",
              marginBottom: "var(--space-6)",
            }}
          >
            Built for students.{" "}
            <span style={{ color: "var(--color-primary)" }}>
              Trusted by parents.
            </span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body)",
              lineHeight: 1.7,
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-8)",
              maxWidth: "480px",
            }}
          >
            You see study progress in full detail — sessions completed, topics
            mastered, areas to review. Your child&apos;s day-to-day feelings stay
            private unless something needs your attention. That boundary is
            written in plain language, not buried in a terms page.
          </p>

          {/* Feature list */}
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            {parentFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.li
                  key={feat.text}
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, x: -12 }
                  }
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    ...entranceTransition,
                    delay: 0.2 + i * 0.06,
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "var(--space-3)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--radius-sm)",
                      background:
                        "color-mix(in srgb, var(--color-success) 12%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Icon
                      size={16}
                      color="var(--color-success)"
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-body)",
                      color: "var(--color-text)",
                      lineHeight: 1.5,
                    }}
                  >
                    {feat.text}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        {/* Right — Dashboard Preview */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...entranceTransition, delay: 0.15 }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            {/* Mini dashboard header */}
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Eye size={16} color="var(--color-primary)" strokeWidth={1.75} />
                <span
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "var(--text-body-sm)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  Parent Dashboard
                </span>
              </div>
              <ShieldCheck
                size={16}
                color="var(--color-success)"
                strokeWidth={1.75}
              />
            </div>

            {/* Dashboard content skeleton */}
            <div style={{ padding: "var(--space-5)" }}>
              {/* Status badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  background:
                    "color-mix(in srgb, var(--color-success) 10%, transparent)",
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-success)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "var(--text-caption)",
                    fontWeight: 600,
                    color: "var(--color-success)",
                  }}
                >
                  On track for guarantee
                </span>
              </div>

              {/* Progress bars */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                }}
              >
                {[
                  { label: "Math", progress: 78, color: "var(--color-primary)" },
                  { label: "Science", progress: 65, color: "var(--color-accent)" },
                  { label: "English", progress: 91, color: "var(--color-success)" },
                ].map((subject) => (
                  <div key={subject.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-inter), system-ui, sans-serif",
                          fontSize: "var(--text-body-sm)",
                          color: "var(--color-text)",
                          fontWeight: 500,
                        }}
                      >
                        {subject.label}
                      </span>
                      <span
                        className="text-number"
                        style={{
                          fontSize: "var(--text-body-sm)",
                          fontWeight: 600,
                          color: subject.color,
                        }}
                      >
                        {subject.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "var(--color-muted)",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={
                          isInView
                            ? { width: `${subject.progress}%` }
                            : { width: 0 }
                        }
                        transition={{
                          duration: 0.8,
                          delay: 0.4,
                          ease: "easeOut",
                        }}
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          background: subject.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly summary */}
              <div
                style={{
                  marginTop: "var(--space-5)",
                  padding: "var(--space-3) var(--space-4)",
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {[
                  { label: "Sessions", value: "12" },
                  { label: "Topics", value: "8" },
                  { label: "Mastered", value: "5" },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <span
                      className="text-number"
                      style={{
                        fontSize: "var(--text-h4)",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        display: "block",
                      }}
                    >
                      {stat.value}
                    </span>
                    <span
                      style={{
                        fontFamily:
                          "var(--font-inter), system-ui, sans-serif",
                        fontSize: "var(--text-caption)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        .parents-container {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .parents-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
