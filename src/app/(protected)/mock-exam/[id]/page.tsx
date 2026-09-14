"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { use } from "react";

/* =============================================================================
   MOCK EXAM — TIMED EXAM PAGE
   Route: /mock-exam/[id]
   Clean timed-exam UI: one question at a time, timer, question count, no distracting chrome
   ============================================================================= */

interface Question {
  id: number;
  topic: string;
  type: "multiple_choice" | "short_answer" | "true_false";
  difficulty: string;
  question: string;
  options: string[] | null;
}

interface ExamData {
  id: string;
  subject: string;
  questions: Question[];
  total_questions: number;
  duration_seconds: number;
}

export default function MockExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  // Fetch exam data from sessionStorage (set during generate)
  useEffect(() => {
    async function loadExam() {
      try {
        // Try to get from the generate response cached in sessionStorage
        const cached = sessionStorage.getItem(`exam_${id}`);
        if (cached) {
          const data = JSON.parse(cached);
          setExam(data);
          setTimeLeft(data.duration_seconds);
          return;
        }
        // If not cached, we can't fetch questions (they don't have answers exposed)
        // Redirect back
        router.push("/mock-exam");
      } catch {
        router.push("/mock-exam");
      }
    }
    loadExam();
  }, [id, router]);

  // Timer countdown
  useEffect(() => {
    if (!exam || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !exam) return;
    setSubmitting(true);

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    const answerArray = exam.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] || "",
    }));

    try {
      const res = await fetch(`/api/mock-exam/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answerArray, timeSpentSeconds: timeSpent }),
      });

      const results = await res.json();
      sessionStorage.setItem(`exam_results_${id}`, JSON.stringify(results));
      router.push(`/mock-exam/${id}/results`);
    } catch {
      setSubmitting(false);
    }
  }, [submitting, exam, answers, id, router]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (!exam) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-muted)" }}>
        Loading exam…
      </div>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const isLastQuestion = currentIndex === exam.questions.length - 1;
  const allAnswered = exam.questions.every((q) => answers[q.id]?.trim());

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ═══ Top bar: Timer + Progress ═══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, padding: "12px 16px", background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: 12 }}>
        <div style={{ fontSize: 13, color: "var(--dash-muted)" }}>
          Question <span className="text-number" style={{ color: "var(--dash-text)", fontWeight: 600 }}>{currentIndex + 1}</span> of{" "}
          <span className="text-number">{exam.total_questions}</span>
        </div>
        <div style={{ fontSize: 13, color: timeLeft < 60 ? "var(--dash-danger)" : "var(--dash-muted)" }}>
          ⏱ <span className="text-number" style={{ fontWeight: 600 }}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* ═══ Dot tracker ═══ */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
        {exam.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: i === currentIndex
                ? "var(--dash-teal)"
                : answers[q.id]
                  ? "var(--dash-success)"
                  : "var(--dash-border-hi)",
              transition: "all 200ms",
            }}
            aria-label={`Go to question ${i + 1}`}
          />
        ))}
      </div>

      {/* ═══ Question Card ═══ */}
      <motion.div
        key={currentQ.id}
        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: "var(--dash-radius-card)",
          padding: 28,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, padding: "3px 8px", background: "var(--dash-raised)", borderRadius: "var(--dash-radius-pill)", color: "var(--dash-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {currentQ.topic}
          </span>
          <span style={{ fontSize: 11, padding: "3px 8px", background: "var(--dash-raised)", borderRadius: "var(--dash-radius-pill)", color: "var(--dash-dim)" }}>
            {currentQ.difficulty}
          </span>
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--dash-text)", marginBottom: 20 }}>
          {currentQ.question}
        </p>

        {/* Multiple choice options */}
        {currentQ.type === "multiple_choice" && currentQ.options && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [currentQ.id]: opt })}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  background: answers[currentQ.id] === opt ? "var(--dash-teal-bg)" : "var(--dash-bg)",
                  border: `1px solid ${answers[currentQ.id] === opt ? "var(--dash-teal-border)" : "var(--dash-border)"}`,
                  borderRadius: 10,
                  fontSize: 14,
                  color: "var(--dash-text)",
                  cursor: "pointer",
                  transition: "all 200ms",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQ.type === "true_false" && (
          <div style={{ display: "flex", gap: 10 }}>
            {["True", "False"].map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [currentQ.id]: opt })}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: answers[currentQ.id] === opt ? "var(--dash-teal-bg)" : "var(--dash-bg)",
                  border: `1px solid ${answers[currentQ.id] === opt ? "var(--dash-teal-border)" : "var(--dash-border)"}`,
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--dash-text)",
                  cursor: "pointer",
                  transition: "all 200ms",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Short answer */}
        {currentQ.type === "short_answer" && (
          <textarea
            value={answers[currentQ.id] || ""}
            onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
            placeholder="Type your answer…"
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "var(--dash-bg)",
              border: "1px solid var(--dash-border)",
              borderRadius: 10,
              fontSize: 14,
              color: "var(--dash-text)",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        )}
      </motion.div>

      {/* ═══ Navigation ═══ */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "1px solid var(--dash-border)",
            borderRadius: "var(--dash-radius-pill)",
            fontSize: 14,
            color: "var(--dash-muted)",
            cursor: currentIndex === 0 ? "default" : "pointer",
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "12px 28px",
              background: allAnswered ? "var(--dash-teal)" : "var(--dash-amber)",
              color: "#0f1b1e",
              border: "none",
              borderRadius: "var(--dash-radius-pill)",
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : allAnswered ? "Submit exam" : "Submit (some unanswered)"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            style={{
              padding: "12px 24px",
              background: "var(--dash-teal)",
              color: "#0f1b1e",
              border: "none",
              borderRadius: "var(--dash-radius-pill)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
