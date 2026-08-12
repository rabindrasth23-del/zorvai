"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Mic, MessageCircle, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Mic,
    headline: "Sessions that teach, not just quiz",
    description:
      "Voice-powered study sessions with a structured learning cycle. Set your own session length — the AI paces itself to fit. No more passive re-reading or random flashcards.",
    accent: "var(--color-primary)",
  },
  {
    icon: MessageCircle,
    headline: "Ask anything, anytime",
    description:
      "Text or photo — your AI coach is always available for ad-hoc questions, personalized to your exact subject and history. Not a generic search engine with a chatbot skin.",
    accent: "var(--color-accent)",
  },
  {
    icon: BarChart3,
    headline: "Watch yourself improve",
    description:
      "Every session tracked, every topic scored. See your mastery grow across subjects — not just a streak counter or time-spent metric that doesn't tell you what you actually learned.",
    accent: "var(--color-success)",
  },
];

const entranceTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
  mass: 1,
};

export default function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="features"
      ref={sectionRef}
      aria-labelledby="features-heading"
      style={{
        paddingTop: "var(--space-20)",
        paddingBottom: "var(--space-20)",
        background: "var(--color-surface)",
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
            Features
          </p>
          <h2
            id="features-heading"
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
            Everything a student actually needs
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body)",
              color: "var(--color-text-muted)",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Three tools. One coach. No feature bloat.
          </p>
        </motion.div>

        {/* Feature Blocks — alternating layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-16)",
          }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isReversed = i % 2 === 1;

            return (
              <motion.div
                key={feature.headline}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  ...entranceTransition,
                  delay: 0.15 + i * 0.1,
                }}
                className="feature-block"
                style={{
                  display: "grid",
                  gap: "var(--space-10)",
                  alignItems: "center",
                  direction: isReversed ? "rtl" : "ltr",
                }}
              >
                {/* Text side */}
                <div style={{ direction: "ltr" }}>
                  {/* Icon badge */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "var(--radius-md)",
                      background: `color-mix(in srgb, ${feature.accent} 10%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "var(--space-5)",
                    }}
                  >
                    <Icon
                      size={28}
                      color={feature.accent}
                      strokeWidth={1.75}
                    />
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                      lineHeight: 1.25,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    {feature.headline}
                  </h3>

                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-body)",
                      lineHeight: 1.7,
                      color: "var(--color-text-muted)",
                      maxWidth: "460px",
                    }}
                  >
                    {feature.description}
                  </p>
                </div>

                {/* Visual side — stylized card preview */}
                <div
                  style={{
                    direction: "ltr",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      aspectRatio: "4 / 3",
                      background: "var(--color-bg)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Decorative elements */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: feature.accent,
                        opacity: 0.8,
                      }}
                    />
                    {/* Skeleton UI preview */}
                    <div
                      style={{
                        padding: "var(--space-6)",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-3)",
                          marginBottom: "var(--space-5)",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--radius-full)",
                            background: `color-mix(in srgb, ${feature.accent} 15%, transparent)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon
                            size={18}
                            color={feature.accent}
                            strokeWidth={1.75}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              width: 120,
                              height: 10,
                              borderRadius: 5,
                              background: "var(--color-muted)",
                              marginBottom: 6,
                            }}
                          />
                          <div
                            style={{
                              width: 80,
                              height: 8,
                              borderRadius: 4,
                              background: "var(--color-border)",
                            }}
                          />
                        </div>
                      </div>
                      {[1, 0.8, 0.6].map((opacity, j) => (
                        <div
                          key={j}
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: "var(--color-muted)",
                            marginBottom: "var(--space-3)",
                            width: `${70 + j * 10}%`,
                            opacity,
                          }}
                        />
                      ))}
                      <div
                        style={{
                          marginTop: "var(--space-5)",
                          display: "flex",
                          gap: "var(--space-3)",
                        }}
                      >
                        <div
                          style={{
                            height: 32,
                            width: 100,
                            borderRadius: "var(--radius-sm)",
                            background: feature.accent,
                            opacity: 0.2,
                          }}
                        />
                        <div
                          style={{
                            height: 32,
                            width: 80,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-border)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        .feature-block {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .feature-block {
            grid-template-columns: 1fr !important;
            direction: ltr !important;
          }
        }
      `}</style>
    </section>
  );
}
