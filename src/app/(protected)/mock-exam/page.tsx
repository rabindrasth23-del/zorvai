"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { DashboardCard, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   MOCK EXAM LANDING PAGE
   Route: /mock-exam
   Subject picker → timer/length choice → start exam
   ============================================================================= */

const DURATION_OPTIONS = [
  { label: "15 min", value: 15, questions: 8 },
  { label: "30 min", value: 30, questions: 12 },
  { label: "45 min", value: 45, questions: 18 },
  { label: "60 min", value: 60, questions: 25 },
];

export default function MockExamLandingPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [subject, setSubject] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (!subject.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/mock-exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          questionCount: selectedDuration.questions,
          durationMinutes: selectedDuration.value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate exam");
        setGenerating(false);
        return;
      }

      router.push(`/mock-exam/${data.exam.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setGenerating(false);
    }
  }

  return (
    <div className="dash-page-enter" style={{ maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
        Mock Exams
      </h1>
      <p style={{ fontSize: 14, color: "var(--dash-muted)", marginBottom: 32 }}>
        Test yourself across multiple topics. Questions are weighted toward areas that need more work.
      </p>

      <DashboardCard padding="28px">
        <SectionHeader title="Set up your exam" />

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Subject input */}
          <div>
            <label style={{ fontSize: 13, color: "var(--dash-muted)", display: "block", marginBottom: 6 }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Biology, Mathematics, Physics"
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--dash-bg)",
                border: "1px solid var(--dash-border)",
                borderRadius: 10,
                fontSize: 15,
                color: "var(--dash-text)",
                outline: "none",
              }}
            />
          </div>

          {/* Duration picker */}
          <div>
            <label style={{ fontSize: 13, color: "var(--dash-muted)", display: "block", marginBottom: 8 }}>
              Duration & questions
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {DURATION_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  onClick={() => setSelectedDuration(opt)}
                  style={{
                    padding: "14px 8px",
                    background: selectedDuration.value === opt.value ? "var(--dash-teal-bg)" : "var(--dash-bg)",
                    border: `1px solid ${selectedDuration.value === opt.value ? "var(--dash-teal-border)" : "var(--dash-border)"}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 200ms",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: selectedDuration.value === opt.value ? "var(--dash-teal)" : "var(--dash-text)" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}>
                    {opt.questions} questions
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--dash-danger)", padding: "10px 14px", background: "rgba(248, 113, 113, 0.08)", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!subject.trim() || generating}
            style={{
              width: "100%",
              padding: "14px 0",
              background: generating ? "var(--dash-dim)" : "var(--dash-teal)",
              color: "#0f1b1e",
              border: "none",
              borderRadius: "var(--dash-radius-pill)",
              fontSize: 16,
              fontWeight: 600,
              cursor: generating ? "wait" : "pointer",
              opacity: !subject.trim() ? 0.5 : 1,
              transition: "opacity 200ms",
            }}
          >
            {generating ? "Generating your exam…" : "Start exam"}
          </button>
        </div>
      </DashboardCard>
    </div>
  );
}
