"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { DashboardCard, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   MOCK EXAM RESULTS PAGE
   Route: /mock-exam/[id]/results
   Score, missed topics linked to Learn content, encouraging copy
   ============================================================================= */

interface ExamResult {
  questionId: number;
  correct: boolean;
  score: number;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
}

interface ResultsData {
  score: number;
  correctCount: number;
  totalQuestions: number;
  results: ExamResult[];
  weakTopics: string[];
  strongTopics: string[];
  timeSpentSeconds: number;
}

export default function MockExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(`exam_results_${id}`);
    if (cached) {
      setResults(JSON.parse(cached));
    } else {
      router.push("/mock-exam");
    }
  }, [id, router]);

  if (!results) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-muted)" }}>
        Loading results…
      </div>
    );
  }

  const scoreColor = results.score >= 80 ? "var(--dash-success)" : results.score >= 50 ? "var(--dash-amber)" : "var(--dash-danger)";
  const timeMinutes = Math.round(results.timeSpentSeconds / 60);

  return (
    <div className="dash-page-enter" style={{ maxWidth: 700, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ═══ Score Card ═══ */}
      <DashboardCard padding="32px">
        <div style={{ textAlign: "center" }}>
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="text-number" style={{ fontSize: 64, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {results.score}%
            </div>
          </motion.div>
          <p style={{ fontSize: 15, color: "var(--dash-text)", marginTop: 12 }}>
            {results.correctCount} of {results.totalQuestions} correct · {timeMinutes} min
          </p>
          <p style={{ fontSize: 14, color: "var(--dash-muted)", marginTop: 4 }}>
            {results.score >= 80
              ? "Great work — you're showing solid understanding!"
              : results.score >= 50
                ? "Good effort — a few areas to review and you'll have this down."
                : "Keep going — let's focus on the topics that need more practice."}
          </p>
        </div>
      </DashboardCard>

      {/* ═══ Topics Summary ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {results.strongTopics.length > 0 && (
          <DashboardCard padding="20px">
            <SectionHeader title="Strong areas" />
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {results.strongTopics.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--dash-success)" }}>
                  <span>✓</span> {t}
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {results.weakTopics.length > 0 && (
          <DashboardCard padding="20px">
            <SectionHeader title="Needs more practice" />
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {results.weakTopics.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--dash-amber)" }}>
                  <span>→</span> {t}
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>

      {/* ═══ Detailed Results (toggle) ═══ */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 10,
            fontSize: 14,
            color: "var(--dash-text)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {showDetails ? "▾ Hide detailed results" : "▸ Show detailed results"}
        </button>

        {showDetails && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {results.results.map((r, i) => (
              <motion.div
                key={r.questionId}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  padding: "14px 16px",
                  background: "var(--dash-surface)",
                  border: `1px solid ${r.correct ? "rgba(74, 222, 128, 0.2)" : "rgba(248, 113, 113, 0.2)"}`,
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>Q{i + 1} · {r.topic}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.correct ? "var(--dash-success)" : "var(--dash-danger)" }}>
                    {r.correct ? "Correct" : "Review again"}
                  </span>
                </div>
                {!r.correct && (
                  <>
                    <div style={{ fontSize: 13, color: "var(--dash-dim)", marginBottom: 4 }}>
                      Your answer: {r.studentAnswer || "(no answer)"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--dash-success)" }}>
                      Correct: {r.correctAnswer}
                    </div>
                    {r.explanation && (
                      <div style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 6, fontStyle: "italic" }}>
                        {r.explanation}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Actions ═══ */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "center" }}>
        <button
          onClick={() => router.push("/mock-exam")}
          style={{
            padding: "12px 28px",
            background: "var(--dash-teal)",
            color: "#0f1b1e",
            border: "none",
            borderRadius: "var(--dash-radius-pill)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Take another exam
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "12px 28px",
            background: "transparent",
            border: "1px solid var(--dash-border)",
            borderRadius: "var(--dash-radius-pill)",
            fontSize: 14,
            color: "var(--dash-muted)",
            cursor: "pointer",
          }}
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
