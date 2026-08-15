import FadeInSection from "./FadeInSection";
import Link from "next/link";
import { ArrowRight, ClipboardEdit, Repeat, ClipboardCheck, Target, Banknote } from "lucide-react";

export default function GuaranteeSection() {
  return (
    <section
      id="guarantee"
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

      <div className="max-w-[1200px] mx-auto px-[var(--space-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--space-12)] items-center relative z-10">
        {/* --- Left Column: Copy + CTA --- */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
          <FadeInSection>
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
              Prove it, or get your <span style={{ color: "var(--color-accent)", fontStyle: "italic" }}>money back.</span>
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <p
              className="max-w-full md:max-w-[460px]"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-body)",
                lineHeight: 1.7,
                color: "rgba(255, 255, 255, 0.75)",
                marginBottom: "var(--space-4)",
              }}
            >
              Take a baseline quiz before you start. Study with Zorvai for the number of sessions we agree on upfront. Take a follow-up quiz. If your score hasn&apos;t improved by the amount we agreed on, you get a full refund.
            </p>
            <p
              className="max-w-full md:max-w-[460px]"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-body)",
                lineHeight: 1.7,
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "var(--space-8)",
              }}
            >
              The only condition is the one we set together, in writing, before you start: how many sessions, and how much improvement. Nothing hidden beyond that.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.2}>
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
                transition: "box-shadow 200ms ease, transform 200ms ease",
              }}
              className="hover:scale-[1.02] active:scale-[0.97]"
            >
              Start your baseline quiz
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </FadeInSection>
        </div>

        {/* --- Right Column: Process Diagram --- */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FadeInSection delay={0.2}>
            <div
              style={{
                width: "100%",
                maxWidth: "420px",
                background: "rgba(255, 255, 255, 0.06)",
                backdropFilter: "blur(12px)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "var(--space-8)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              {/* Step 1 */}
              <div className="flex items-center gap-[var(--space-4)]">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <ClipboardEdit size={20} className="text-white" />
                </div>
                <span className="font-sans text-[var(--text-body)] font-medium text-white">
                  Baseline Quiz
                </span>
              </div>
              
              {/* Connector line */}
              <div className="w-0.5 h-6 bg-white/10 ml-[19px]" />

              {/* Step 2 */}
              <div className="flex items-center gap-[var(--space-4)]">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Repeat size={20} className="text-[var(--color-accent)]" />
                </div>
                <span className="font-sans text-[var(--text-body)] font-medium text-white">
                  Study with Zorvai
                </span>
              </div>

              {/* Connector line */}
              <div className="w-0.5 h-6 bg-white/10 ml-[19px]" />

              {/* Step 3 */}
              <div className="flex items-center gap-[var(--space-4)]">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <ClipboardCheck size={20} className="text-white" />
                </div>
                <span className="font-sans text-[var(--text-body)] font-medium text-white">
                  Follow-up Quiz
                </span>
              </div>

              {/* Connector line */}
              <div className="w-0.5 h-6 bg-white/10 ml-[19px]" />

              {/* Step 4: Outcomes */}
              <div className="grid grid-cols-2 gap-[var(--space-4)] mt-[var(--space-2)]">
                {/* Hit target */}
                <div className="bg-white/5 border border-white/10 rounded-[var(--radius-md)] p-[var(--space-4)] flex flex-col items-center gap-[var(--space-2)] text-center">
                  <Target size={24} className="text-[var(--color-success)]" />
                  <span className="font-sans text-[var(--text-caption)] font-bold text-white/50 uppercase tracking-wider">
                    Hit the target
                  </span>
                  <span className="font-sans text-[var(--text-body-sm)] font-semibold text-white">
                    Keep going
                  </span>
                </div>
                {/* Missed target */}
                <div className="bg-white/5 border border-white/10 rounded-[var(--radius-md)] p-[var(--space-4)] flex flex-col items-center gap-[var(--space-2)] text-center">
                  <Banknote size={24} className="text-[var(--color-warning)]" />
                  <span className="font-sans text-[var(--text-caption)] font-bold text-white/50 uppercase tracking-wider">
                    Missed it
                  </span>
                  <span className="font-sans text-[var(--text-body-sm)] font-semibold text-white">
                    Full refund
                  </span>
                </div>
              </div>

            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}
